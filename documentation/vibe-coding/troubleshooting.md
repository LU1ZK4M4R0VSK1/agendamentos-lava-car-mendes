# 🛠️ Documentação de Erros e Soluções (Troubleshooting)

Durante o processo de implementação e testes locais do bot (incluindo o módulo Lava Car e banco de dados), registramos os seguintes erros ambientais. Use este documento como guia caso você mesmo ou outro desenvolvedor esbarre nestes problemas ao dar o play no terminal.

## 1. Erro: Módulo não encontrado (dotenv)
**Sintoma:** Ao rodar `node src-bot/seed.js` ou `node src-bot/index.js`, o Node.js lançava um erro crasso:
```text
node:internal/modules/cjs/loader
Error: Cannot find module 'dotenv'
```
**Causa:** As dependências do projeto não estavam instaladas ou estavam corrompidas na pasta `node_modules`.
**Solução (O que foi feito):** Foi executado o comando `npm install` no diretório raiz do projeto para baixar o `dotenv` e o `dayjs` (necessário para cálculos do Lava Car). O erro foi mitigado automaticamente.

---

## 2. Erro: Falha na Autenticação do PostgreSQL
**Sintoma:** Ao conectar o bot via `node src-bot/seed.js`, o log imprimiu:
```text
❌ Erro no seed: a autenticação falhou para o usuário "postgres"
```
**Causa:** O arquivo `src-bot/config.js` procura por padrão a URL local `postgresql://postgres:postgres@localhost:5432/bot_db` se não houver um arquivo `.env` configurado contendo uma variável `POSTGRES_URL` válida. No seu ambiente, ou o banco de dados não existe nessas credenciais, ou o contêiner do Docker está desligado.
**Como Resolver:**
1. Crie ou renomeie o arquivo `env.example` para `.env` na raiz do projeto.
2. Certifique-se de preencher `POSTGRES_URL` com as credenciais reais (Ex: `postgresql://seu_user:sua_senha@localhost:5432/sua_tabela`).
3. Se estiver usando Docker, rode `docker-compose up -d` para ligá-lo.

---

## 3. Erro: Timeout/Recusa de Conexão na Evolution API
**Sintoma:** Ao executar o script `setup-posto3l.ps1` (ou requisições `curl` para `localhost:8080`), o Windows PowerShell retornou:
```text
Invoke-RestMethod : Não é possível conectar-se ao servidor remoto
```
**Causa:** O servidor da Evolution API (porta 8080) não estava rondando localmente no momento do teste.
**Como Resolver:**
Esse script automatiza a criação da estância e do webhook, mas exige que a API esteja ativa. Ligue o seu container do `evolution-api` e tente rodar `.\setup-posto3l.ps1` novamente via PowerShell.

---

## 4. Erro: API Key do Gemini Expirada (Testes Locais)
**Sintoma:** Ao simular a conversa rodando o script isolado no terminal (`node test-lavacar.js`), a Inteligência Artificial do Google estourou:
```text
API key expired. Please renew the API key.
```
**Causa:** A chave de testes gravada hardcoded nos scripts iniciais (`AIzaSyCE...jnXw`) foi desativada pelo Google Docs por expiração de limite gratuito ou tempo.
**Como Resolver:**
1. Acesse [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) com sua conta Google.
2. Gere uma chave do formato `AIza...` gratuita.
3. Cole a respectiva chave dentro de `test-lavacar.js` (se estiver brincando no terminal) e no seu `.env` oficial (`GEMINI_API_KEY=...`) para que a aplicação principal e o Evolution enxerguem.
