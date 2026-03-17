# 📖 Guia de Configuração: Novo Restaurante (Evolution Bot)

Este guia foi criado para auxiliar IAs e desenvolvedores a configurar rapidamente um novo restaurante/instância no sistema Evolution Bot.

---

## 🚀 Passo a Passo para Configuração

### 1. Criar Instância na Evolution API
Antes de tudo, você precisa de uma instância rodando na Evolution API.
- **Nome da Instância:** Use nomes em kebab-case (ex: `pizzaria-do-bairro`).
- **Webhook:** Aponte para `URL_DO_BOT/webhook`.

### 2. Configurar no Banco de Dados (via `seed.js`)
Abra o arquivo [seed.js](file:///d:/evolution-api/src-bot/seed.js) e adicione um novo objeto ao array `ORGANIZATIONS`.

#### Campos Necessários:
- `name`: Nome visível do restaurante.
- `instanceName`: Deve ser IGUAL ao nome criado na Evolution API.
- `timezone`: Fuso horário (ex: `America/Sao_Paulo`).
- `businessHours`: Objeto JSON definindo o horário de funcionamento.
- `systemPrompt`: Instruções de comportamento para a IA.

### 3. Estrutura de Horário (`businessHours`)
Siga este padrão JSON para garantir que o bot saiba quando está aberto:

```json
{
  "mon": { "open": "18:00", "close": "23:00" },
  "tue": { "open": "18:00", "close": "23:00" },
  "wed": { "open": "18:00", "close": "23:00" },
  "thu": { "open": "18:00", "close": "23:00" },
  "fri": { "open": "18:00", "close": "23:59" },
  "sat": { "open": "18:00", "close": "23:59" },
  "sun": { "closed": true }
}
```

### 4. Configurar o Menu (PDF ou Imagem)
Para que o comando `[ENVIAR_CARDAPIO]` funcione, você deve:
1. Navegar até `src-bot/data/menus/`.
2. Adicionar o arquivo do cardápio.
3. **Regra de Nome:** O arquivo deve começar com `cardapio_` seguido do nome do restaurante em slug (ex: `cardapio_aero-lanches.pdf`).

### 5. Configurar Grupo Admin
- Crie um grupo no WhatsApp para o restaurante.
- Envie uma mensagem no grupo e veja o log do bot para capturar o `JID` (ex: `1203634... @g.us`).
- Adicione esse JID no campo `adminGroupJid` do `seed.js`.

---

## 🛠️ Comandos de Execução

Após editar o `seed.js`, rode:
```bash
node src-bot/seed.js
```

Para testar a resposta da IA sem precisar do WhatsApp, você pode usar o script de isolamento:
```bash
node src-bot/simulate_isolation.js
```

---

## 🎮 Comandos de Controle (Grupo Admin)

O dono do restaurante pode controlar a IA enviando comandos no grupo de administração:

| Comando | Descrição | Exemplo |
| :--- | :--- | :--- |
| `.hoje [texto]` | Cria um aviso para a IA usar por 24h. | `.hoje sem calabresa e suco em dobro` |
| `.hoje limpar` | Remove os avisos antes das 24h. | `.hoje limpar` |
| `.dia` | Relatório de pedidos e performance de hoje. | `.dia` |
| `.saiu [ID]` | Notifica o cliente que o pedido saiu. | `.saiu PED-123` |

---

## 🧠 Dicas para a IA (Prompt Engineering)

Ao criar o `systemPrompt` para um novo restaurante, sempre inclua:
1. **Identidade**: Nome da persona e tom de voz.
2. **Tags de Ação**: Garanta que ela use `[ENVIAR_CARDAPIO]` e `[PEDIDO_FECHADO]`.
3. **Memória**: A IA receberá automaticamente o histórico de context e endereços anteriores. Você pode instruí-la a confirmar se o cliente quer entregar no mesmo endereço caso receba a info `--- MEMÓRIA DO CLIENTE ---`.
4. **Horário**: A IA receberá as info de tempo (`--- INFO DE TEMPO ---`). Instrua-a a oferecer **agendamento** caso o status seja `FECHADO`.
