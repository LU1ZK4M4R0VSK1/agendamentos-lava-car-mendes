# 🚀 Guia Passo a Passo: Configurando o Bot Gemini com a Evolution API

Este guia vai te mostrar do zero como criar uma instância na Evolution API, conectar o seu WhatsApp, configurar o Webhook e colocar o Bot (Gemini) para rodar e responder as mensagens.

## Passo 1: Iniciar os Serviços Básicos

Você precisa estar com dois terminais abertos para iniciar os sistemas.

1. **Terminal 1 - Evolution API**: Inicie o servidor da Evolution API. Certifique-se de que ele está rodando na porta `8080`.
2. **Terminal 2 - Bot Webhook**: No diretório raiz do projeto (`d:\evolution-api`), inicie o script do bot:
   ```bash
   node bot-gemini-webhook.js
   ```
   *O bot deve iniciar e mostrar a mensagem: "🤖 Webhook Gemini rodando em http://localhost:3001/webhook"*

## Passo 2: Acessar o Evolution Manager

O Evolution Manager é a interface gráfica onde você gerencia suas instâncias do WhatsApp.

1. Acesse no seu navegador o endereço padrão do Manager (geralmente `http://localhost:8081` ou se estiver rodando local sem Docker, verifique de acordo com a sua instalação).
2. Se solicitar uma senha ou API Key GLOBAL, utilize a que você definiu na instalação (ex: `teste123api`).

## Passo 3: Criar uma Nova Instância

Se você já criou a `aero-lanches`, pode pular para o **Passo 5**, apenas conectando o QR Code se estiver desconectado.

1. Dentro do Manager, vá em **Instâncias** (Instances) > **Criar Instância** (Add Instance).
2. Dê um nome para a instância (ex: `aero-lanches`).
3. Selecione a integração **WHATSAPP-BAILEYS-WHATSAPP**.
4. Clique em **Criar** ou **Salvar**.

## Passo 4: Conectar o WhatsApp (Escanear QR Code)

1. Na lista de instâncias, localize a sua nova instância e clique nela.
2. Na aba de conexões, clique para **Gerar QR Code** (ou "Connect").
3. Abra o WhatsApp no seu celular (o número que será o bot).
4. Vá em **Aparelhos Conectados** > **Conectar um Aparelho** e leia o QR Code na tela.
5. Aguarde o status mudar para **CONECTADO** (Connected).

## Passo 5: Configurar o Webhook (O Passo que faltava!)

É aqui que dizemos à Evolution API para enviar as mensagens recebidas para o nosso pequeno servidor Node.js que roda o Gemini.

1. Dentro dos detalhes da sua instância no **Manager**, procure a aba ou menu **Webhooks**.
2. Ative o uso de Webhook (se houver uma chave on/off).
3. Preencha a URL com o endereço do seu bot local:
   ```
   http://localhost:3001/webhook
   ```
4. Nas opções de eventos (Events), marque pelo menos a opção:
   - `MESSAGES_UPSERT` (ou "Mensagens Recebidas/Criadas").
   - *Se quiser, pode marcar `MESSAGES_CREATE` também*.
5. Verifique se a opção "Webhook By Events" (separar eventos na url) está **DESATIVADA** (falsa).
6. **Salve as configurações**.

## Passo 6: Como Funciona o Fluxo agora?

1. Alguém envia uma mensagem para o número do WhatsApp que você escaneou.
2. O servidor da Evolution API (localhost:8080) recebe a mensagem da rede do WhatsApp.
3. A Evolution API verifica: "Tem webhook aqui?". Sim! E faz uma requisição POST com a mensagem para `http://localhost:3001/webhook`.
4. O seu bot (`bot-gemini-webhook.js`) recebe isso. Usa a API do Google Gemini para ler o contexto e a personalidade (Sara do Aero Lanches) e devolver uma resposta ideal.
5. O bot envia a resposta devolta para a Evolution API ordenando: "Envie isso!".
6. A Evolution API envia para o WhatsApp do cliente final!

## Passo 7: Como Testar?

- Envie a mensagem "Oi" de **OUTRO NÚMERO** de WhatsApp para o número que você escaneou no QR Code.
- Olhe o terminal onde o script `node bot-gemini-webhook.js` está rodando. Você deve ver as mensagens passando pelo console, porque a opção `CONFIG.DEBUG` é `true` no código.

**🎉 Pronto! O seu sistema de integração de IA está completo!**
