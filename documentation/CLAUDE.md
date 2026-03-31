# CLAUDE.md
Este arquivo fornece orientações abrangentes para a IA Claude ao trabalhar com a base de código da Evolution API.
## Visão Geral do Projeto
**Evolution API** é uma API REST poderosa e pronta para produção para comunicação com WhatsApp que suporta múltiplos provedores de WhatsApp:
- **Baileys** (WhatsApp Web) - Cliente WhatsApp Web de código aberto
- **Meta Business API** - API Oficial do WhatsApp Business
- **Evolution API** - Integração personalizada com WhatsApp
Construída com **Node.js 20+**, **TypeScript 5+** e **Express.js**, ela fornece integrações extensivas com chatbots, sistemas CRM e plataformas de mensagens em uma **arquitetura multi-tenant**.
## Comandos Comuns de Desenvolvimento
### Construir e Executar
```bash
# Desenvolvimento
npm run dev:server    # Executa em desenvolvimento com recarga automática (tsx watch)
# Produção
npm run build        # Verificação TypeScript + build com tsup
npm run start:prod   # Executa a build de produção
# Execução direta
npm start           # Executa com tsx

### Qualidade de Código

bash

npm run lint        # ESLint com correção automática
npm run lint:check  # Apenas verificação do ESLint
npm run commit      # Commit interativo com commitizen

### Gerenciamento de Banco de Dados

bash

# Defina primeiro o provedor de banco de dados
export DATABASE_PROVIDER=postgresql  # ou mysql
# Gera o cliente Prisma (usa automaticamente a variável de ambiente DATABASE_PROVIDER)
npm run db:generate
# Aplica migrações (produção)
npm run db:deploy      # Unix/Mac
npm run db:deploy:win  # Windows
# Migrações de desenvolvimento (com sincronização para a pasta do provedor)
npm run db:migrate:dev      # Unix/Mac
npm run db:migrate:dev:win  # Windows
# Abre o Prisma Studio
npm run db:studio

### Testes

bash

npm test    # Executa testes com modo watch

## Arquitetura

### Estrutura Principal

- **SaaS multi-tenant**: Isolamento completo de instâncias com autenticação por inquilino
    
- **Banco de dados multi-provedor**: PostgreSQL e MySQL via Prisma ORM com schemas e migrações específicas por provedor
    
- **Integrações com WhatsApp**: Baileys, Meta Business API e Evolution API com interface unificada
    
- **Arquitetura orientada a eventos**: EventEmitter2 para eventos internos + WebSocket, RabbitMQ, SQS, NATS, Pusher para eventos externos
    
- **Padrão de microsserviços**: Integrações modulares para chatbots, armazenamento e serviços externos
    

### Layout do Diretório

text

src/
├── api/
│   ├── controllers/     # Manipuladores de rotas HTTP (camada fina)
│   ├── services/        # Lógica de negócios (funcionalidade principal)
│   ├── repository/      # Camada de acesso a dados (Prisma)
│   ├── dto/            # Objetos de Transferência de Dados (classes simples)
│   ├── guards/         # Middleware de autenticação/autorização
│   ├── integrations/   # Integrações com serviços externos
│   │   ├── channel/    # Provedores WhatsApp (Baileys, Business API, Evolution)
│   │   ├── chatbot/    # Integrações de IA/Bot (OpenAI, Dify, Typebot, Chatwoot)
│   │   ├── event/      # Sistemas de eventos (WebSocket, RabbitMQ, SQS, NATS, Pusher)
│   │   └── storage/    # Armazenamento de arquivos (S3, MinIO)
│   ├── routes/         # Definições de rotas Express (padrão RouterBroker)
│   └── types/          # Definições de tipos TypeScript
├── config/             # Configurações de ambiente e aplicação
├── cache/             # Implementações de cache Redis e local
├── exceptions/        # Classes de exceção HTTP personalizadas
├── utils/            # Utilitários e ajudantes compartilhados
└── validate/         # Schemas de validação JSONSchema7

### Pontos Chave de Integração

**Integrações de Canal** (`src/api/integrations/channel/`):

- **Baileys**: Cliente WhatsApp Web com autenticação por QR code
    
- **Business API**: API Oficial do WhatsApp Business da Meta
    
- **Evolution API**: Integração personalizada com WhatsApp
    
- Gerenciamento do ciclo de vida da conexão por instância com reconexão automática
    

**Integrações de Chatbot** (`src/api/integrations/chatbot/`):

- **EvolutionBot**: Chatbot nativo com sistema de gatilhos
    
- **Chatwoot**: Integração com plataforma de atendimento ao cliente
    
- **Typebot**: Construtor de fluxo de chatbot visual
    
- **OpenAI**: Capacidades de IA incluindo GPT e Whisper (transcrição de áudio)
    
- **Dify**: Plataforma de fluxo de trabalho de agente de IA
    
- **Flowise**: Construtor visual LangChain
    
- **N8N**: Plataforma de automação de fluxo de trabalho
    
- **EvoAI**: Integração de IA personalizada
    

**Integrações de Eventos** (`src/api/integrations/event/`):

- **WebSocket**: Conexões [Socket.io](https://socket.io/) em tempo real
    
- **RabbitMQ**: Fila de mensagens para processamento assíncrono
    
- **Amazon SQS**: Enfileiramento de mensagens em nuvem
    
- **NATS**: Sistema de mensagens de alto desempenho
    
- **Pusher**: Notificações push em tempo real
    

**Integrações de Armazenamento** (`src/api/integrations/storage/`):

- **AWS S3**: Armazenamento de objetos em nuvem
    
- **MinIO**: Armazenamento auto-hospedado compatível com S3
    
- Gerenciamento de arquivos de mídia e geração de URLs
    

### Gerenciamento de Schema de Banco de Dados

- Arquivos de schema separados: `postgresql-schema.prisma` e `mysql-schema.prisma`
    
- A variável de ambiente `DATABASE_PROVIDER` determina o banco de dados ativo
    
- As pastas de migração são específicas do provedor e selecionadas automaticamente durante a implantação
    

### Autenticação e Segurança

- **Autenticação baseada em chave de API** via cabeçalho `apikey` (global ou por instância)
    
- **Tokens específicos de instância** para autenticação de conexão WhatsApp
    
- **Sistema de Guards** para proteção de rotas e autorização
    
- **Validação de entrada** usando JSONSchema7 com `dataValidate` do RouterBroker
    
- **Limitação de taxa** e middleware de segurança
    
- **Validação de assinatura de webhook** para integrações externas
    

## Detalhes Importantes de Implementação

### Gerenciamento de Instâncias WhatsApp

- Cada conexão WhatsApp é uma "instância" com nome único
    
- Dados da instância armazenados no banco de dados com estado de conexão
    
- Persistência de sessão no banco de dados ou sistema de arquivos (configurável)
    
- Tratamento de reconexão automática com backoff exponencial
    

### Arquitetura de Fila de Mensagens

- Suporta RabbitMQ, Amazon SQS e WebSocket para eventos
    
- Tipos de eventos: message.received, message.sent, connection.update, etc.
    
- Configurável por instância quais eventos enviar
    

### Tratamento de Mídia

- Armazenamento local ou S3/Minio para arquivos de mídia
    
- Download automático de mídia do WhatsApp
    
- Geração de URLs de mídia para acesso externo
    
- Suporte para transcrição de áudio via OpenAI
    

### Suporte Multi-tenant

- Isolamento de instâncias no nível do banco de dados
    
- Configurações de webhook separadas por instância
    
- Configurações de integração independentes por instância
    

## Configuração de Ambiente

As principais variáveis de ambiente estão definidas em `.env.example`. O sistema usa um sistema de configuração fortemente tipado via `src/config/env.config.ts`.

Configurações críticas:

- `DATABASE_PROVIDER`: postgresql ou mysql
    
- `DATABASE_CONNECTION_URI`: String de conexão do banco de dados
    
- `AUTHENTICATION_API_KEY`: Autenticação global da API
    
- `REDIS_ENABLED`: Habilita cache Redis
    
- `RABBITMQ_ENABLED`/`SQS_ENABLED`: Opções de fila de mensagens
    

## Diretrizes de Desenvolvimento

O projeto segue padrões de desenvolvimento abrangentes definidos em `.cursor/rules/`:

### Princípios Fundamentais

- **Sempre responda em Português (PT-BR)** para comunicação com o usuário
    
- **Siga os padrões de arquitetura estabelecidos** (Service Layer, RouterBroker, etc.)
    
- **Tratamento robusto de erros** com lógica de repetição e degradação gradual
    
- **Compatibilidade multi-banco de dados** (PostgreSQL e MySQL)
    
- **Abordagem centrada em segurança** com validação de entrada e limitação de taxa
    
- **Otimizações de desempenho** com cache Redis e pooling de conexões
    

### Padrões de Código

- **Modo estrito do TypeScript** com cobertura completa de tipos
    
- **JSONSchema7** para validação de entrada (não class-validator)
    
- **Commits Convencionais** aplicados pelo commitlint
    
- **ESLint + Prettier** para formatação de código
    
- **Padrão Service Object** para lógica de negócios
    
- **Padrão RouterBroker** para manipulação de rotas com `dataValidate`
    

### Padrões de Arquitetura

- **Isolamento multi-tenant** no nível do banco de dados e instância
    
- **Comunicação orientada a eventos** com EventEmitter2
    
- **Padrão de integração de microsserviços** para serviços externos
    
- **Pooling de conexões** e gerenciamento de ciclo de vida
    
- **Estratégia de cache** com Redis primário e fallback Node-cache
    

## Abordagem de Testes

Atualmente, o projeto tem infraestrutura mínima de testes formais:

- **Testes manuais** são a abordagem principal
    
- **Testes de integração** no ambiente de desenvolvimento
    
- **Nenhuma suíte de testes unitários** implementada atualmente
    
- Arquivos de teste podem ser colocados no diretório `test/` como `*.test.ts`
    
- Execute `npm test` para modo watch durante o desenvolvimento de testes
    

### Estratégia de Testes Recomendada

- Foque na **lógica crítica de negócios** nos serviços
    
- **Mock dependências externas** (APIs do WhatsApp, banco de dados)
    
- **Testes de integração** para endpoints da API
    
- **Testes manuais** para fluxos de conexão do WhatsApp
    

## Considerações de Implantação

- Suporte a Docker com `Dockerfile` e `docker-compose.yaml`
    
- Tratamento de desligamento gracioso para conexões
    
- Endpoints de health check para monitoramento
    
- Integração com Sentry para rastreamento de erros
    
- Telemetria para análise de uso (apenas dados não sensíveis)