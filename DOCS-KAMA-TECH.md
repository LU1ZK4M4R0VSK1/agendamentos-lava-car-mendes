# 🤖 KAMA TECH — Documentação do Projeto

> Bot WhatsApp multi-tenant com IA (Gemini) + Evolution API + PostgreSQL.
> Pronto para produção e vibe coding.

---

## 📁 Estrutura do Projeto

```
evolution-api/
├── src-bot/                    # ← Código do bot (seu produto)
│   ├── index.js                # Entry point
│   ├── config.js               # Configurações (env vars)
│   ├── webhook.routes.js       # Rotas HTTP
│   ├── onboard-client.js       # Script de onboarding automático
│   ├── seed.js                 # Seed inicial do banco
│   ├── migrate-to-pg.js        # Migração SQLite → PostgreSQL
│   ├── database/
│   │   ├── Database.js         # Classe PostgreSQL (async)
│   │   ├── schema-pg.sql       # Schema das tabelas
│   │   └── schema.sql          # Schema SQLite (legado)
│   ├── services/
│   │   ├── AIService.js        # Integração Gemini
│   │   ├── WebhookHandler.js   # Processamento de mensagens
│   │   ├── MessageProcessor.js # Extração de pedidos/tags
│   │   ├── StatsService.js     # Estatísticas
│   │   └── BusinessHoursService.js
│   ├── prompts/                # ← Templates de IA
│   │   ├── assertiva.js        # Curta e direta
│   │   ├── numerica.js         # Opções numéricas
│   │   ├── amigavel.js         # Simpática e calorosa
│   │   └── formal.js           # Profissional/corporativo
│   ├── data/
│   │   ├── bot.db              # SQLite (backup)
│   │   └── menus/              # Cardápios (PDF/PNG)
│   └── domain/                 # Modelos de dados
├── docker-kama-tech.prod.yaml  # Docker Compose produção
├── Dockerfile.bot              # Imagem Docker do bot
├── .env                        # Variáveis de ambiente
└── DOCS-KAMA-TECH.md           # Este arquivo
```

---

## 🚀 Deploy Rápido (VPS)

### Pré-requisitos
- VPS com Ubuntu 22+ (mínimo 2GB RAM)
- Docker e Docker Compose instalados

### Passo a Passo

```bash
# 1. Clone o repositório
git clone https://github.com/LU1ZK4M4R0VSK1/ServiceAutomation.git
cd ServiceAutomation

# 2. Configure o .env
cp .env.example .env
nano .env
# Edite: GEMINI_API_KEY, PG_PASSWORD, EVOLUTION_APIKEY

# 3. Suba tudo com um comando
docker compose -f docker-kama-tech.prod.yaml up -d

# 4. Verifique se está rodando
docker compose -f docker-kama-tech.prod.yaml ps

# 5. Cadastre o primeiro cliente
docker exec -it kama_bot node src-bot/onboard-client.js
```

### Variáveis de Ambiente (`.env`)
```env
# Gemini (IA)
GEMINI_API_KEY=sua_chave_gemini
GEMINI_MODEL=gemini-2.0-flash

# Bot
BOT_PORT=3001
BOT_DEBUG=false

# Evolution API
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_APIKEY=KamaTech_ApiKey_2024

# PostgreSQL
PG_USER=postgres
PG_PASSWORD=SenhaForte123!
PG_DATABASE=evolution_db
POSTGRES_URL=postgresql://postgres:SenhaForte123!@localhost:5432/bot_db
```

---

## 👤 Onboarding de Novo Cliente

### Método Automático (recomendado)
```bash
node src-bot/onboard-client.js
```
O script interativo coleta:
1. Nome do restaurante
2. Horários de funcionamento
3. Personalidade da IA (4 templates prontos)
4. Cria a instância na Evolution API
5. Gera o QR Code para conectar o WhatsApp

### Método Manual (vibe coding)
Peça para a IA:
> "Cadastre um novo restaurante chamado [NOME] com personalidade [assertiva/numerica/amigavel/formal], horário de [HH:MM] às [HH:MM], instância [slug]"

A IA deve executar:
```javascript
// 1. Importar dependências
const Database = require('./src-bot/database/Database');
const assertiva = require('./src-bot/prompts/assertiva');

// 2. Conectar ao PostgreSQL
const db = await new Database(process.env.POSTGRES_URL).initialize();

// 3. Gerar prompt a partir do template
const prompt = assertiva.generate('Nome do Restaurante', 'restaurant');

// 4. Cadastrar organização
await db.createOrganization({
  name: 'Nome do Restaurante',
  type: 'restaurant',
  instanceName: 'nome-restaurante',
  systemPrompt: prompt,
  businessHours: {
    mon: { open: '18:00', close: '23:00' },
    tue: { open: '18:00', close: '23:00' },
    // ... demais dias
  },
  timezone: 'America/Sao_Paulo',
  adminGroupJid: null, // preencher depois
});

// 5. Criar instância na Evolution API
// POST http://localhost:8080/instance/create
// { instanceName: 'nome-restaurante', integration: 'WHATSAPP-BAILEYS', qrcode: true }

// 6. Configurar webhook
// PUT http://localhost:8080/webhook/set/nome-restaurante
// { url: 'http://localhost:3001/webhook', events: ['MESSAGES_UPSERT'] }
```

---

## 📋 Checklist por Cliente

Use este checklist para cada novo cliente:

- [ ] Nome do restaurante/empresa
- [ ] Tipo: restaurant / service / general
- [ ] Cardápio (PDF ou imagem PNG/JPG)
- [ ] Horários de funcionamento (por dia da semana)
- [ ] Número WhatsApp que será conectado
- [ ] Personalidade da IA escolhida
- [ ] Grupo admin WhatsApp (JID) — opcional
- [ ] Forma de pagamento aceitas (PIX, cartão, dinheiro)
- [ ] Endereço do estabelecimento
- [ ] Slug da instância (ex: `pizzaria-do-ze`)

### Após cadastro:
- [ ] QR Code escaneado e WhatsApp conectado
- [ ] Webhook configurado na Evolution API
- [ ] Cardápio salvo em `src-bot/data/menus/cardapio_SLUG.pdf`
- [ ] Mensagem de teste enviada com sucesso
- [ ] Grupo admin recebendo notificações de pedido

---

## 🤖 Personalidades de IA

### 1. Assertiva (`assertiva.js`)
- **Para:** Restaurantes com alto volume
- **Estilo:** Máximo 2 frases. Direta. Sem enrolação.
- **Exemplo:** "Olá! O que vai pedir hoje? 🍕"

### 2. Numérica (`numerica.js`)
- **Para:** Fluxo estruturado e rápido
- **Estilo:** Sempre apresenta opções com números (1, 2, 3...)
- **Exemplo:** "*1* - Ver cardápio | *2* - Fazer pedido | *3* - Horários"

### 3. Amigável (`amigavel.js`)
- **Para:** Empresas que valorizam relacionamento
- **Estilo:** Calorosa, usa nome do cliente, sugere itens
- **Exemplo:** "Oii João! 😄 Que bom ter você de volta! O que vai ser hoje?"

### 4. Formal (`formal.js`)
- **Para:** Clínicas, escritórios, serviços
- **Estilo:** Profissional, sem gírias, trata por senhor(a)
- **Exemplo:** "Boa tarde. Sou Ana, assistente da Clínica XYZ. Como posso ajudá-lo?"

### Criar template personalizado
```javascript
// src-bot/prompts/meu_template.js
module.exports = {
  name: 'Meu Template',
  description: 'Descrição curta',
  generate(businessName, businessType) {
    return `Prompt do sistema aqui...
    
    // OBRIGATÓRIO: incluir bloco de marcações
    [ANALYTICS]
    etapa: {saudacao|...}
    sentimento: {positivo|...}
    [/ANALYTICS]`;
  }
};
```

---

## 📊 Comandos do Grupo Admin

Os donos dos restaurantes podem usar comandos no grupo admin do WhatsApp:

| Comando | Ação |
|---|---|
| `.dia` | Relatório do dia (clientes, pedidos, tempo médio) |
| `.semana` | Relatório da semana |
| `.mes` | Relatório do mês |
| `.tudo` | Relatório completo |
| `.saiu PED-xxx` | Marca pedido como "em entrega" e notifica cliente |
| `.pronto PED-xxx` | Marca pedido como "pronto" e notifica cliente |
| `.cancelou PED-xxx` | Cancela pedido e notifica cliente |
| `.hoje texto` | Define aviso do dia (promoções, falta de item, etc.) |
| `.hoje limpar` | Remove avisos do dia |

---

## 🔧 Manutenção

### Logs
```bash
# Ver logs do bot em tempo real
docker logs -f kama_bot

# Ver logs da Evolution API
docker logs -f kama_evolution
```

### Backup do Banco
```bash
# Backup
docker exec kama_postgres pg_dump -U postgres bot_db > backup_$(date +%Y%m%d).sql

# Restaurar
docker exec -i kama_postgres psql -U postgres bot_db < backup.sql
```

### Atualizar código
```bash
git pull
docker compose -f docker-kama-tech.prod.yaml build bot
docker compose -f docker-kama-tech.prod.yaml up -d bot
```

---

## 💡 Dicas para Vibe Coding

Quando usar uma IA para modificar o projeto, dê estas instruções de contexto:

```
O projeto é um Bot WhatsApp multi-tenant feito em Node.js puro (sem framework).
- Banco: PostgreSQL via driver 'pg' (async, Pool)
- IA: Google Gemini via REST API
- WhatsApp: Evolution API via REST
- Todos os métodos do Database.js são async/await
- Cada restaurante é uma "organization" com instance_name único
- Templates de prompt ficam em src-bot/prompts/
- Marcações [ANALYTICS], [PEDIDO_FECHADO], [ENVIAR_CARDAPIO] são obrigatórias nos prompts
```
