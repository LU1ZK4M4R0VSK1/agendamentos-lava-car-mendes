// src-bot/services/AIService.js
// Integração com Gemini — busca histórico do banco

const axios = require('axios');

class AIService {
  constructor({ apiKey, model, temperature, maxTokens, debug }) {
    this.apiKey = apiKey;
    this.model = model || 'gemini-2.0-flash';
    this.temperature = temperature || 0.7;
    this.maxTokens = maxTokens || 1500;
    this.debug = debug || false;
  }

  async ask(db, conversationId, userMessage, systemPrompt) {
    const rows = await db.getConversationHistory(conversationId, 20);
    const history = rows.map(r => ({
      role: r.direction === 'inbound' ? 'user' : 'model',
      parts: [{ text: r.content }],
    }));
    history.push({ role: 'user', parts: [{ text: userMessage }] });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const body = {
      contents: history,
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { temperature: this.temperature, maxOutputTokens: this.maxTokens },
    };

    // Tenta até 2x (com retry em caso de 429)
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await axios.post(url, body, { timeout: 30000 });
        const text = res.data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('Gemini retornou vazio');
        return text;
      } catch (err) {
        const is429 = err.response?.status === 429;
        if (is429 && attempt < 2) {
          if (this.debug) console.log('⏳ Rate limit (429), aguardando 1s...');
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }
        if (this.debug) {
          console.error(`❌ Gemini erro: ${err.response?.status || ''} ${err.message}`);
          if (err.response?.data) console.error('Data:', JSON.stringify(err.response.data, null, 2));
        }
        
        if (err.response?.status === 429) {
          return '⚠️ O limite de mensagens da IA foi atingido por hoje. Por favor, tente novamente em alguns instantes ou troque a API Key.';
        }
        
        return 'Desculpe, tive um problema. Pode repetir?';
      }
    }
  }
}

module.exports = AIService;
