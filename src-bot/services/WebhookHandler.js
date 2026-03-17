// src-bot/services/WebhookHandler.js
// Processa webhooks da Evolution API — orquestrador principal

const axios = require('axios');

class WebhookHandler {
  /**
   * @param {object} deps
   * @param {import('../database/Database')} deps.db
   * @param {import('./AIService')} deps.aiService
   * @param {import('./MessageProcessor')} deps.messageProcessor
   * @param {import('../config')} deps.config
   */
  constructor({ db, aiService, messageProcessor, statsService, businessHoursService, config }) {
    this.db = db;
    this.aiService = aiService;
    this.messageProcessor = messageProcessor;
    this.statsService = statsService;
    this.businessHoursService = businessHoursService;
    this.config = config;
  }

  /**
   * Processa o payload do webhook
   * @param {object} payload
   */
  async handle(payload) {
    if (payload.event !== 'messages.upsert') return;

    const data = payload.data;
    if (!data?.key) return;

    const { remoteJid, fromMe, id: whatsappMsgId } = data.key;
    const instanceName = payload.instance;

    if (fromMe) return;
    if (remoteJid === 'status@broadcast') return;
    if (!data.message) return;

    const text = data.message.conversation || data.message.extendedTextMessage?.text;
    if (!text) return;

    // ── Mensagem de GRUPO ──
    if (remoteJid?.includes('@g.us')) {
      // Log para descobrir o JID do grupo (útil na configuração inicial)
      if (this.config.DEBUG && !this.config.ADMIN_GROUP_JID) {
        console.log(`📢 Grupo detectado: ${remoteJid} | Mensagem: ${text}`);
        console.log(`   Para configurar como grupo admin, defina: ADMIN_GROUP_JID=${remoteJid}`);
      }

      // Só processa se for o grupo admin configurado
      if (this.config.ADMIN_GROUP_JID && remoteJid === this.config.ADMIN_GROUP_JID) {
        await this._handleAdminCommand(text, instanceName);
      }
      return;
    }

    // ── Mensagem INDIVIDUAL (fluxo normal do bot) ──

    // Deduplicação
    if (await this.db.messageExists(whatsappMsgId)) {
      if (this.config.DEBUG) console.log(`🔁 Duplicada: ${whatsappMsgId}`);
      return;
    }

    // Identifica organização
    const org = await this.db.findOrganizationByInstance(instanceName);
    if (!org) {
      console.warn(`⚠️ Instância desconhecida: ${instanceName}`);
      return;
    }

    if (this.config.DEBUG) console.log(`💬 [${org.name}] ${data.pushName || remoteJid}: ${text}`);

    // Busca/cria customer e conversa
    const customer = await this.db.findOrCreateCustomer(remoteJid, org.id, data.pushName);
    const { conversation, isNew } = await this.db.findOrCreateConversation(
      customer.id, org.id, instanceName, this.config.CONVERSATION_TIMEOUT_MINUTES
    );

    if (isNew && this.config.DEBUG) console.log(`🆕 Nova conversa: ${conversation.id}`);

    // Salva mensagem recebida
    await this.db.createMessage({
      conversationId: conversation.id,
      whatsappMessageId: whatsappMsgId,
      direction: 'inbound',
      content: text,
      senderJid: remoteJid,
      timestamp: data.messageTimestamp,
    });

    // Busca contexto extra (Endereço e Horário)
    const lastAddress = await this.db.getLastAddressForCustomer(customer.id, org.id);
    const timeContext = this.businessHoursService.getAIPromptContext(org.businessHours, org.timezone);

    let enrichedPrompt = org.systemPrompt || '';
    
    // Injeta Avisos do Dia (se válidos por 24h)
    if (org.importantNotices && org.noticesUpdatedAt) {
      const updatedAt = new Date(org.noticesUpdatedAt).getTime();
      const isExpired = (Date.now() - updatedAt) > 24 * 60 * 60 * 1000;
      
      if (!isExpired) {
        enrichedPrompt += `\n\n--- AVISOS IMPORTANTES DO DIA ---\n${org.importantNotices}\n`;
        enrichedPrompt += `DIRETIVA: Use as informações acima com prioridade. Se for uma promoção vaga (sem preço), informe o cliente e diga que o desconto final será aplicado no fechamento. Se for falta de item, avise educadamente e sugira alternativas.\n`;
      }
    }

    if (lastAddress) {
      enrichedPrompt += `\n\n--- MEMÓRIA DO CLIENTE ---\nO último endereço de entrega deste cliente foi: ${lastAddress}. Se ele pedir "no endereço de sempre", confirme se é este o endereço.\n`;
    }
    enrichedPrompt += `\n\n${timeContext}`;

    // Gera resposta com IA
    const rawResponse = await this.aiService.ask(this.db, conversation.id, text, enrichedPrompt);

    // Extrai pedido + limpa tags
    const orderData = this.messageProcessor.extractOrder(rawResponse);
    const cleanText = this.messageProcessor.clean(rawResponse);

    // Salva resposta
    await this.db.createMessage({
      conversationId: conversation.id,
      direction: 'outbound',
      content: cleanText,
      senderJid: 'bot',
    });

    // Se pedido detectado, salva e notifica grupo admin
    if (orderData) {
      const requestId = await this.db.createServiceRequest({
        conversationId: conversation.id,
        customerId: customer.id,
        organizationId: org.id,
        type: org.type === 'restaurant' ? 'food_order' : 'general',
        details: {
          cliente: orderData.cliente || customer.pushName,
          telefone: customer.phone, // Sempre usa o phone real do WhatsApp
          itens: orderData.itens,
          endereco: orderData.endereco,
          tipoentrega: orderData.tipoentrega,
          pagamento: orderData.pagamento,
          observacoes: orderData.observacoes,
        },
      });

      if (this.config.DEBUG) console.log(`📦 Pedido: ${requestId}`);

      // Envia resumo no grupo admin
      await this._notifyAdminGroup(requestId, orderData, customer, org.name, instanceName);
    }

    // Envia resposta via Evolution API
    await this._sendWhatsApp(instanceName, remoteJid, cleanText);
    if (this.config.DEBUG) console.log(`✅ [${org.name}] Resposta enviada`);

    // Envio de cardápio se solicitado
    if (this.messageProcessor.detectMenuRequest(rawResponse)) {
      const slug = org.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
      const menusDir = require('path').join(__dirname, '..', 'data', 'menus');
      const fs = require('fs');
      
      // Busca qualquer arquivo que comece com cardapio_<slug>
      const files = fs.readdirSync(menusDir);
      const menuFile = files.find(f => f.startsWith(`cardapio_${slug}`));

      if (menuFile) {
        const menuPath = require('path').join(menusDir, menuFile);
        const ext = require('path').extname(menuFile).toLowerCase().replace('.', '');
        const mediaType = ['jpg', 'jpeg', 'png'].includes(ext) ? 'image' : 'document';

        await this._sendMedia(instanceName, remoteJid, menuPath, 'Aqui está o nosso cardápio! 📄', mediaType);
        if (this.config.DEBUG) console.log(`📄 [${org.name}] Cardápio enviado (${mediaType}): ${menuPath}`);
      } else if (this.config.DEBUG) {
        console.warn(`⚠️ [${org.name}] Cardápio não encontrado para slug: ${slug}`);
      }
    }
  }

  // ════════════════════════════════════════════
  // COMANDOS DO GRUPO ADMIN
  // ════════════════════════════════════════════

  /**
   * Processa comandos do grupo admin
   * Comandos: .saiu PED-xxx | .pronto PED-xxx | .cancelou PED-xxx
   */
  async _handleAdminCommand(text, instanceName) {
    // 1. Estatísticas
    const statsMatch = text.match(/^\.(dia|semana|mes|tudo)/i);
    if (statsMatch) {
      const period = statsMatch[1].toLowerCase();
      const org = await this.db.findOrganizationByInstance(instanceName);
      if (!org) return;

      const stats = await this.statsService.getStats(org.id, period);
      
      const periodLabel = {
        dia: 'hoje',
        semana: 'esta semana',
        mes: 'este mês',
        tudo: 'todo o período'
      }[period];

      const formatTime = (s) => {
        if (s < 60) return `${s}s`;
        if (s < 3600) return `${Math.floor(s/60)}m ${s%60}s`;
        return `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m`;
      };

      const message = [
        `📊 *Relatório: ${org.name}*`,
        `Período: ${periodLabel}`,
        '',
        `🤖 O robô respondeu automaticamente *${stats.customersCount}* clientes,`,
        `📦 gerou *${stats.ordersCount}* pedidos`,
        `⏱️ e manteve tempo de resposta médio de *${formatTime(stats.avgResponseTime)}*.`,
        '',
        stats.avgResponseTime < 60 ? 'Manteve tempo de resposta imediato mesmo fora do horário. ✅' : ''
      ].filter(Boolean).join('\n');

      const adminGroupJid = org.adminGroupJid || this.config.ADMIN_GROUP_JID;
      await this._sendWhatsApp(instanceName, adminGroupJid, message);
      return;
    }

    // 2. Mural de Avisos (Avisos do Dia)
    const noticeMatch = text.match(/^\.hoje\s+(.+)/i);
    if (noticeMatch) {
      const content = noticeMatch[1].trim();
      const org = await this.db.findOrganizationByInstance(instanceName);
      if (!org) return;

      const adminGroupJid = org.adminGroupJid || this.config.ADMIN_GROUP_JID;

      if (content.toLowerCase() === 'limpar') {
        await this.db.updateOrganizationNotices(instanceName, null);
        await this._sendWhatsApp(instanceName, adminGroupJid, '✅ Avisos do dia limpos com sucesso.');
        return;
      }

      await this.db.updateOrganizationNotices(instanceName, content);
      await this._sendWhatsApp(instanceName, adminGroupJid, 
        `✅ *Aviso Salvo!* A IA usará esta informação nas próximas 24 horas:\n\n"${content}"`);
      return;
    }

    const match = text.match(/^\.(saiu|pronto|cancelou)\s+(.+)/i);
    if (!match) return;

    const command = match[1].toLowerCase();
    const pedidoId = match[2].trim();

    const statusMap = {
      saiu: 'em_entrega',
      pronto: 'pronto',
      cancelou: 'cancelled',
    };

    const customerMessageMap = {
      saiu: '🛵 Seu pedido saiu para entrega! Em breve chegará no seu endereço.',
      pronto: '✅ Seu pedido está pronto! Aguardando retirada.',
      cancelou: '❌ Seu pedido foi cancelado. Entre em contato se tiver dúvidas.',
    };

    // Busca o pedido
    const order = await this.db.findServiceRequestById(pedidoId);
    if (!order) {
      // Tenta responder no grupo que enviou o comando
      const adminGroupJid = org.adminGroupJid || this.config.ADMIN_GROUP_JID;
      await this._sendWhatsApp(instanceName, adminGroupJid,
        `⚠️ Pedido não encontrado: ${pedidoId}`);
      return;
    }

    // Atualiza status
    const newStatus = statusMap[command];
    await this.db.updateServiceRequestStatus(order.id, newStatus);

    // Busca o customer para enviar notificação
    const customer = await this.db.findCustomerById(order.customerId);
    if (customer) {
      await this._sendWhatsApp(instanceName, customer.remoteJid, customerMessageMap[command]);
    }

    // Confirma no grupo
    const adminGroupJid = org.adminGroupJid || this.config.ADMIN_GROUP_JID;
    await this._sendWhatsApp(instanceName, adminGroupJid,
      `✅ Pedido ${order.id} → status: *${newStatus}*${customer ? `\nCliente ${customer.pushName || customer.phone} notificado.` : ''}`);

    if (this.config.DEBUG) console.log(`🔄 Pedido ${order.id} → ${newStatus}`);
  }

  // ════════════════════════════════════════════
  // NOTIFICAÇÃO NO GRUPO ADMIN
  // ════════════════════════════════════════════

  async _notifyAdminGroup(requestId, orderData, customer, orgName, instanceName) {
    // Busca a organização para pegar o grupo específico
    const org = await this.db.findOrganizationByInstance(instanceName);
    const adminGroupJid = org?.adminGroupJid || this.config.ADMIN_GROUP_JID;

    if (!adminGroupJid) return;

    const message = [
      `🔔 *NOVO PEDIDO — ${orgName}*`,
      '',
      `📦 *Pedido:* ${requestId}`,
      `👤 *Cliente:* ${orderData.cliente || customer.pushName}`,
      `📞 *Telefone:* ${customer.phone}`,
      `🛒 *Itens:* ${orderData.itens || 'Não especificado'}`,
      `📍 *Endereço:* ${orderData.endereco || 'Retirada'}`,
      `🚚 *Entrega:* ${orderData.tipoentrega || 'Não informado'}`,
      `💳 *Pagamento:* ${orderData.pagamento || 'Não informado'}`,
      orderData.observacoes ? `📝 *Obs:* ${orderData.observacoes}` : '',
      '',
      `Para atualizar: .saiu ${requestId}`,
    ].filter(Boolean).join('\n');

    await this._sendWhatsApp(instanceName, adminGroupJid, message);
  }

  // ════════════════════════════════════════════
  // HELPER
  // ════════════════════════════════════════════

  async _sendWhatsApp(instanceName, to, text) {
    try {
      await axios.post(
        `${this.config.EVOLUTION_API_URL}/message/sendText/${instanceName}`,
        {
          number: to,
          options: { delay: this.config.MESSAGE_DELAY_MS, presence: 'composing' },
          text,
        },
        { headers: { apikey: this.config.EVOLUTION_APIKEY } }
      );
    } catch (err) {
      console.error(`❌ Envio falhou para ${to}: ${err.message}`);
    }
  }

  async _sendMedia(instanceName, to, filePath, caption, mediatype = 'document') {
    try {
      const fs = require('fs');
      const path = require('path');
      const fileBuffer = fs.readFileSync(filePath);
      const base64 = fileBuffer.toString('base64');
      const fileName = path.basename(filePath);
      const ext = path.extname(fileName).toLowerCase().replace('.', '');
      
      const mimetypes = {
        pdf: 'application/pdf',
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        mp4: 'video/mp4',
        mp3: 'audio/mpeg'
      };

      await axios.post(
        `${this.config.EVOLUTION_API_URL}/message/sendMedia/${instanceName}`,
        {
          number: to,
          mediatype: mediatype, // 'document' ou 'image'
          mimetype: mimetypes[ext] || 'application/octet-stream',
          fileName: fileName,
          caption: caption,
          media: base64,
          options: { delay: this.config.MESSAGE_DELAY_MS, presence: 'composing' }
        },
        { headers: { apikey: this.config.EVOLUTION_APIKEY } }
      );
    } catch (err) {
      console.error(`❌ Envio de mídia falhou para ${to}: ${err.message}`);
    }
  }
}

module.exports = WebhookHandler;
