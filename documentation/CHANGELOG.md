# 2.3.7 (2025-12-05)

### Features

* **WhatsApp Business Meta Templates**: Adiciona endpoints de atualização e exclusão para templates do Meta
  - Novos endpoints para editar e excluir templates do WhatsApp Business
  - Adicionados DTOs e schemas de validação para gerenciamento de templates
  - Melhorias nas capacidades de gerenciamento do ciclo de vida dos templates

* **Events API**: Adiciona isLatest e progress ao evento messages.set
  - Permite que consumidores saibam quando a sincronização de histórico está completa (isLatest=true)
  - Acompanha porcentagem de progresso da sincronização através de webhooks
  - Adicionado campo extra ao tipo EmitData para propriedades adicionais no payload
  - Atualizados todos os controllers de evento (webhook, rabbitmq, sqs, websocket, pusher, kafka, nats)

* **Integração N8N**: Adiciona quotedMessage ao payload em sendMessageToBot
  - Suporte para mensagens citadas na integração do chatbot N8N
  - Melhorias no contexto de informação das mensagens

* **WebSocket**: Adiciona curinga "*" para permitir que todos os hosts se conectem via websocket
  - Configuração de host mais flexível para conexões WebSocket
  - Lógica de validação de host melhorada no WebsocketController

* **Suporte Pix**: Manipula mensagens de botão interativo para pix
  - Suporte para mensagens interativas de botão Pix
  - Melhorias na integração com fluxo de pagamento

### Correções

* **Processador de Mensagens Baileys**: Corrige eventos de mensagens recebidas não funcionando após reconexão
  - Adicionada lógica de limpeza no mount() para evitar vazamentos de memória de múltiplas assinaturas
  - Recria messageSubject se foi finalizado durante logout
  - Remonta messageProcessor no connectToWhatsapp() para garantir assinatura ativa
  - Corrigido problema onde onDestroy() chamava complete() no RxJS Subject, fechando-o permanentemente
  - Garante que assinaturas antigas sejam devidamente limpas antes de criar novas

* **Autenticação Baileys**: Resolve estado "aguardando mensagem" após reconexão
  - Corrigido problema de chaves Redis não sendo removidas corretamente durante logout da instância
  - Previne carregamento de chaves criptográficas antigas/inválidas na reconexão
  - Corrigido estado de bloqueio onde instâncias autenticavam mas não conseguiam enviar mensagens
  - Garante que novas credenciais (creds) sejam devidamente utilizadas após reconexão

* **Cache OnWhatsapp**: Previne erros de constraint única e otimiza escritas no banco de dados
  - Corrigido erro `Unique constraint failed on the fields: (remoteJid)` ao enviar para grupos
  - Refatorada consulta para usar condição OR encontrando por jidOptions ou remoteJid
  - Adicionada comparação profunda para pular atualizações desnecessárias no banco
  - Substituído processamento sequencial por Promise.allSettled para execução paralela
  - Ordenados JIDs alfabeticamente em jidOptions para detecção precisa de alterações
  - Adicionada função auxiliar normalizeJid para código mais limpo

* **Integração Proxy**: Corrige erro "Media upload failed on all hosts" ao usar proxy
  - Criado makeProxyAgentUndici() para agentes proxy compatíveis com Undici
  - Corrigida compatibilidade com implementação nativa fetch() do Node.js 18+
  - Substituído HttpsProxyAgent/SocksProxyAgent tradicional por Undici ProxyAgent
  - Mantido makeProxyAgent() legado para compatibilidade com Axios
  - Corrigido tratamento de protocolo em makeProxyAgent para prevenir erros undefined

* **WhatsApp Business API**: Corrige manipulação de base64, filename e caption
  - Corrigida conversão de base64 para mídia na Business API
  - Corrigido tratamento de filename para mensagens de documento
  - Melhorado processamento de caption para mensagens de mídia
  - Melhorada validação e processamento de remoteJid

* **Serviço de Chat**: Corrige erros em fetchChats e painel de mensagens
  - Corrigidos erros de cleanMessageData no painel de mensagens do Manager
  - Melhorada confiabilidade na busca de chats
  - Melhorada sanitização de dados de mensagem

* **Filtragem de Contatos**: Aplica filtros where corretamente no endpoint findContacts
  - Corrigido endpoint para processar todos os campos da cláusula where (id, remoteJid, pushName)
  - Anteriormente processava apenas campo remoteJid, ignorando outros filtros
  - Adicionado campo remoteJid ao contactValidateSchema para validação adequada
  - Mantido isolamento multi-tenant com filtragem por instanceId
  - Permite filtrar contatos por qualquer campo suportado em vez de retornar todos

* **Integração Chatwoot e Baileys**: Múltiplas melhorias na integração
  - Melhorias na formatação e consistência do código
  - Corrigidos problemas de integração entre serviços Chatwoot e Baileys
  - Melhorias no tratamento e entrega de mensagens

* **Perda de Mensagens Baileys**: Previne perda de mensagens de placeholders stub do WhatsApp
  - Corrigido problema de mensagens sendo perdidas e não salvas no banco, especialmente para canais/newsletters (@lid)
  - Detecta stubs do WhatsApp através de messageStubParameters contendo 'Message absent from node'
  - Previne adição de stubs ao cache de mensagens duplicadas
  - Permite que mensagem real seja processada quando chega após descriptografia
  - Mantém descarte de stubs para evitar salvamento de placeholders vazios

* **Contatos do Banco**: Respeita DATABASE_SAVE_DATA_CONTACTS em atualizações de contato
  - Adicionadas verificações condicionais faltantes para configuração DATABASE_SAVE_DATA_CONTACTS
  - Corrigidas tentativas de atualização de foto de perfil quando salvamento no banco está desabilitado
  - Corrigida promise não aguardada no handler contacts.upsert

* **Prisma/PostgreSQL**: Adiciona constraint única ao modelo Chat
  - Gerada migração para adicionar índice único em instanceId e remoteJid
  - Adicionada etapa de deduplicação antes de criar índice para prevenir violações de constraint
  - Previne duplicação de chats no banco de dados

* **Upload MinIO**: Manipula messageContextInfo no upload de mídia para prevenir erros no MinIO
  - Previne erros ao fazer upload de mídia com metadados messageContextInfo
  - Melhorado tratamento de erros para operações de armazenamento de mídia

* **Typebot**: Corrige roteamento de mensagens para JIDs @lid
  - Typebot agora responde a mensagens de JIDs terminados com @lid
  - Mantém JID completo para @lid em vez de extrair apenas número
  - Corrigida condição: `remoteJid.includes('@lid') ? remoteJid : remoteJid.split('@')[0]`
  - Manipula ambos os formatos @s.whatsapp.net e @lid

* **Filtragem de Mensagens**: Unifica filtragem remoteJid usando OR com remoteJidAlt
  - Melhorada filtragem de mensagens com suporte a JID alternativo
  - Melhor tratamento de mensagens com diferentes formatos de JID

* **Integração @lid**: Múltiplas correções para problemas com @lid, eventos de mensagem e erros do chatwoot
  - Reorganização de imports e melhoria no tratamento de mensagens no BaileysStartupService
  - Melhorado processamento de remoteJid para lidar com casos @lid
  - Melhorada normalização de JID e segurança de tipos na integração Chatwoot
  - Simplificada lógica de tratamento de mensagens e gerenciamento de cache
  - Refatorado tratamento de mensagens e atualizações de polling com lógica de descriptografia para votos de enquete
  - Melhorado fluxo de processamento de eventos para vários tipos de mensagem

* **Contatos Chatwoot**: Corrige erro de duplicação de contato na importação
  - Resolvido erro 'ON CONFLICT DO UPDATE command cannot affect row a second time'
  - Removida tentativa de atualizar campo identifier no conflito (parte da constraint)
  - Alterado para atualizar apenas campo updated_at: `updated_at = NOW()`
  - Permite que contatos duplicados sejam atualizados corretamente sem erros

* **Serviço Chatwoot**: Corrige tratamento async no método update_last_seen
  - Adicionado await faltante para chatwootRequest no processamento de mensagens lidas
  - Previne falha do serviço ao processar mensagens lidas

* **Acesso a Métricas**: Corrige validação de IP incluindo x-forwarded-for
  - Utiliza todos os IPs incluindo cabeçalho x-forwarded-for ao verificar acesso a métricas
  - Melhorada segurança e controle de acesso para endpoint de métricas

### Dependências

* **Baileys**: Atualizado para versão 7.0.0-rc.9
  - Último release candidate com múltiplas melhorias e correções de bugs

* **AWS SDK**: Pacotes atualizados para versão 3.936.0
  - Funcionalidade e compatibilidade aprimoradas
  - Melhorias de desempenho

### Qualidade de Código e Refatoração

* **Gerenciamento de Templates**: Remove DTOs de edição/exclusão de templates não utilizados após refatoração
* **Utilitários de Proxy**: Melhora makeProxyAgent para compatibilidade com Undici
* **Formatação de Código**: Melhora formatação e consistência de código entre serviços
* **BaileysStartupService**: Corrige indentação e remove linhas em branco desnecessárias
* **Controllers de Evento**: Protege spread extra e previne sobrescrita de campos core em todos os controllers de evento
* **Organização de Imports**: Reorganiza imports para melhor estrutura e manutenibilidade de código

# 2.3.6 (2025-10-21)

### Features

* **Baileys, Chatwoot, Cache OnWhatsapp**: Múltiplas implementações e correções
  - Corrigido cache para números PN, LID e g.us para enviar número correto
  - Corrigido envio de áudio e documento via Chatwoot no canal Baileys
  - Múltiplas correções na integração Chatwoot
  - Corrigido problema de mensagens ignoradas ao receber leads

### Correções

* **Baileys**: Corrige armazenamento de buffer no banco de dados
  - Salva corretamente valores Uint8Array no banco de dados
* **Baileys**: Simplifica log do objeto messageSent
  - Corrigido erro "this.isZero not is function"

### Chore

* **Versão**: Atualiza versão para 2.3.6 e dependência Baileys para 7.0.0-rc.6
* **Workflows**: Atualiza etapa de checkout para incluir submódulos
  - Adicionada opção 'submodules: recursive' à etapa de checkout em múltiplos arquivos de workflow para garantir que submódulos sejam inicializados corretamente durante processos de CI/CD
* **Manager**: Atualiza arquivos de asset e processo de instalação
  - Atualizada referência do subprojeto em evolution-manager-v2 para o commit mais recente
  - Melhorado script manager_install.sh para incluir etapas de npm install e build
  - Substituído arquivo JavaScript antigo por nova versão para melhor desempenho
  - Adicionado novo arquivo CSS para estilização consistente da aplicação

# 2.3.5 (2025-10-15)

### Features

* **Melhorias Chatwoot**: Aprimoramentos abrangentes no tratamento de mensagens, edição, exclusão e i18n
* **Dados de Participantes**: Adiciona campo participantsData mantendo compatibilidade retroativa para participantes de grupo
* **LID para Número de Telefone**: Converte LID para número de telefone nos participantes do grupo
* **Configurações Docker**: Adiciona serviços Kafka e frontend às configurações Docker

### Correções

* **Migração Kafka**: Corrigido erro de migração PostgreSQL para integração Kafka
  - Corrigida referência de tabela de `"public"."Instance"` para `"Instance"` na constraint de chave estrangeira
  - Corrigido erro `ERROR: relation "public.Instance" does not exist` na migração `20250918182355_add_kafka_integration`
  - Alinhada convenção de nomenclatura de tabelas com outras migrações da Evolution API para consistência
  - Resolvida falha de migração de banco de dados que impedia configuração da integração Kafka
* **Atualização Versão Baileys**: v7.0.0-rc.5 com correções de compatibilidade
  - Corrigida compatibilidade da assinatura assertSessions usando type assertion
  - Corrigida incompatibilidade em chamada de voz (wavoip) com nova versão do Baileys
  - Trata status undefined em update usando padrão 'DELETED'
* **Melhorias Chatwoot**: Múltiplas correções para maior confiabilidade
  - Corrigida extração de chatId para JIDs não-grupo
  - Resolvido timeout de webhook na exclusão com 5+ imagens
  - Melhorado tratamento de erros em mensagens do Chatwoot
  - Ajustada lógica de verificação de conversa e cache
  - Otimizada lógica de reabertura de conversa e notificação de conexão
  - Corrigida reabertura de conversa e loop de conexão
* **Tratamento de Mensagens Baileys**: Melhorias no processamento de mensagens
  - Adicionado log de aviso para mensagens não encontradas
  - Corrigida verificação de mensagens no serviço Baileys
  - Simplificado tratamento de linkPreview no BaileysStartupService
* **Validação de Mídia**: Corrige validação de conteúdo de mídia
* **Conexão PostgreSQL**: Refatora conexão com PostgreSQL e melhora tratamento de mensagens

### Qualidade de Código e Refatoração

* **Exponential Backoff**: Implementa padrões de backoff exponencial e extrai números mágicos para constantes
* **Build TypeScript**: Atualiza processo de build TypeScript e dependências

# 2.3.4 (2025-09-23)

### Features

* **Integração Kafka**: Adicionada integração de eventos Apache Kafka para streaming de eventos em tempo real
  - Novo controller Kafka, router e schema para publicação de eventos
  - Suporte para tópicos de eventos específicos de instância e globais
  - Autenticação SASL/SSL configurável e configurações de conexão
  - Criação automática de tópicos com partições e replicação configuráveis
  - Gerenciamento de grupo de consumidores para processamento confiável de eventos
  - Integração com gerenciador de eventos existente para distribuição contínua de eventos

* **Evolution Manager v2 Open Source**: Evolution Manager v2 agora disponível como código aberto
  - Adicionado como submódulo git com URL HTTPS para fácil acesso
  - Configuração open source completa com licença Apache 2.0 + condições personalizadas da Evolution API
  - Templates GitHub para issues, pull requests e workflows
  - Documentação abrangente e diretrizes de contribuição
  - Suporte Docker para ambientes de desenvolvimento e produção
  - Workflows CI/CD para qualidade de código, auditorias de segurança e builds automatizadas
  - Suporte multi-idioma (Inglês, Português, Espanhol, Francês)
  - Frontend moderno React + TypeScript + Vite com Tailwind CSS

* **Melhorias EvolutionBot**: Funcionalidade EvolutionBot aprimorada e tratamento de mensagens
  - Implementada funcionalidade splitMessages para melhor segmentação de mensagens
  - Adicionado suporte a linkPreview para melhor apresentação de mensagens
  - Centralizada lógica de split entre serviços de chatbot para consistência
  - Melhorias na formatação e entrega de mensagens

### Correções

* **Schema MySQL**: Corrigido erros de valor padrão inválido para campos `createdAt` nos modelos `Evoai` e `EvoaiSetting`
  - Alterado `@default(now())` para `@default(dbgenerated("CURRENT_TIMESTAMP"))` para compatibilidade MySQL
  - Adicionados campos de relação faltantes (`N8n`, `N8nSetting`, `Evoai`, `EvoaiSetting`) no modelo Instance
  - Resolvidos erros de validação de schema Prisma para provider MySQL

* **Validação Schema Prisma**: Corrigido erro de campo `instanceName` na criação de mensagem
  - Removido campo `instanceName` inválido de objetos de mensagem antes da inserção no banco
  - Resolvido erro de validação Prisma `Unknown argument 'instanceName'`
  - Simplificada estrutura de dados de mensagem para corresponder aos requisitos do schema Prisma

* **Processamento de Mensagens de Mídia**: Melhorias no tratamento de mídia entre serviços de chatbot
  - Corrigida conversão base64 no serviço EvoAI para processamento adequado de imagens
  - Convertido ArrayBuffer para string base64 usando `Buffer.from().toString('base64')`
  - Melhorado tratamento de URL de mídia e codificação base64 para melhor integração com chatbot
  - Aprimorada detecção de mensagens de imagem e fluxo de processamento

* **Evolution Manager v2 Linting**: Resolvidos conflitos de configuração ESLint
  - Desabilitadas regras conflitantes do Prettier na configuração ESLint
  - Adicionadas substituições abrangentes de regras para padrões TypeScript e React
  - Corrigidas questões de ordenação de imports e formatação de código
  - Atualizadas vulnerabilidades de segurança em dependências (Vite, esbuild)

### Qualidade de Código e Refatoração

* **Serviços de Chatbot**: Simplificado tratamento de mensagens de mídia em todas as integrações de chatbot
  - Padronizados padrões de processamento de base64 e mediaUrl
  - Melhorada legibilidade e manutenibilidade do código na lógica de tratamento de mídia
  - Aprimorado tratamento de erros para processos de download e conversão de mídia
  - Unificada detecção de mensagens de imagem entre diferentes serviços de chatbot

* **Operações de Banco de Dados**: Melhorada consistência e validação de dados
  - Aprimorada conformidade com schema Prisma em todas as operações de mensagem
  - Removidas referências redundantes de nome de instância para melhor integridade de dados
  - Otimizado fluxo de criação de mensagem com validação adequada de campos

### Variáveis de Ambiente

* Adicionadas opções de configuração Kafka abrangentes:
  - `KAFKA_ENABLED`, `KAFKA_CLIENT_ID`, `KAFKA_BROKERS`
  - `KAFKA_CONSUMER_GROUP_ID`, `KAFKA_TOPIC_PREFIX`
  - `KAFKA_SASL_*` e `KAFKA_SSL_*` para autenticação
  - `KAFKA_EVENTS_*` para configuração de tipos de evento

# 2.3.3 (2025-09-18)

### Features

* Adiciona campos extras ao objeto enviado ao bot Flowise
* Adiciona endpoint /metrics compatível com Prometheus (protegido por PROMETHEUS_METRICS)
* Implementa suporte a linkPreview para Evolution Bot

### Correções

* Corrige vulnerabilidade Path Traversal no endpoint /assets implementando verificações de segurança
* Configura Husky e lint-staged para verificações automatizadas de qualidade de código em commits e pushes
* Converte mediaKey de mensagens de mídia para evitar erros de descriptografia
* Melhora formatação de código para melhor legibilidade em arquivos de serviço WhatsApp
* Formata atribuição messageGroupId para melhor legibilidade
* Melhora implementação de linkPreview baseado em feedback do PR
* Limpa formatação de código para implementação de linkPreview
* Usa 'unknown' como fallback para label clientName
* Remove abort process quando status está paused, permitindo retorno do chatbot após expiração do tempo e após ser pausado por interação humana (stopBotFromMe)
* Melhora sanitização de conteúdo de mensagem no serviço Baileys e lógica de recuperação de mensagens no serviço Chatwoot
* Integra eventos de mudança de status do Typebot para webhook no controller e serviço de chatbot
* Correção do mimetype de vídeos

### Segurança

* **CRÍTICO**: Corrigida vulnerabilidade Path Traversal no endpoint /assets que permitia leitura de arquivos local não autenticada
* Segurança de WebSockets Personalizável

### Testes

* Atualizações Baileys: v7.0.0-rc.3 ([Link](https://github.com/WhiskeySockets/Baileys/releases/tag/v7.0.0-rc.3))

# 2.3.2 (2025-09-02)

### Features

* Adiciona suporte a proxy socks

### Correções

* Adicionado key id no payload do webhook no serviço n8n
* Melhora controller RabbitMQ com gerenciamento de conexão aprimorado e procedimentos de desligamento
* Converte imagens de saída para JPEG antes de enviar com Chatwoot
* Atualiza dependência baileys para versão 6.7.19

# 2.3.1 (2025-07-29)

### Feature

* Adiciona BaileysMessageProcessor para tratamento aprimorado de mensagens e integra rxjs para processamento assíncrono
* Melhora processamento de mensagens com lógica de retry para tratamento de erros

### Correções

* Atualiza Versão do Baileys
* Atualiza Repositório Dockerhub e Remove Variável de Sessão de Configuração
* Corrigido envio de variáveis no typebot
* Adiciona unreadMessages na resposta
* Número de telefone como ID de mensagem para Evo AI
* Corrige upload para s3 quando mensagem de mídia
* Simplifica verificação de mensagem editada no BaileysStartupService
* Evita corrupção de URLs com query strings
* Removida variável de ambiente CONFIG_SESSION_PHONE_VERSION

# 2.3.0 (2025-06-17 09:19)

### Feature

* Adiciona suporte para obter Catálogos e Coleções com novas rotas: '{{baseUrl}}/chat/fetchCatalogs' e '{{baseUrl}}/chat/fetchCollections'
* Adiciona suporte de integração NATS ao sistema de eventos
* Adiciona suporte de localização de mensagens meta
* Adiciona variável de ambiente S3_SKIP_POLICY para desabilitar setBucketPolicy para provedores incompatíveis
* Adiciona integração EvoAI com modelos, serviços e rotas
* Adiciona integração N8n com modelos, serviços e rotas

### Correções

* Vulnerabilidade de injeção de shell
* Atualiza Versão do Baileys v6.7.18
* Duplicação de envio de áudio do chatwoot
* CSAT do chatwoot criando nova conversa em outro idioma
* Refatora controller SQS para corrigir bug em eventos sqs por instância
* Ajuste na api cloud para envio de áudio e vídeo
* Preserva animação em figurinhas GIF e WebP
* Prevendo uso de conversa de outra inbox para o mesmo usuário
* Garante compatibilidade total com WhatsApp para conversão de áudio (libopus, 48kHz, mono)
* Melhora lógica de busca e processamento de mensagens
* Adicionado lid no roteador de números do whatsapp
* Agora se a variável CONFIG_SESSION_PHONE_VERSION não for preenchida ela busca automaticamente a versão mais atualizada

### Segurança

* Altera execSync para execFileSync
* Melhora autenticação WebSocket e tratamento de conexão

# 2.2.3 (2025-02-03 11:52)

### Correções

* Corrige cache no sistema de arquivos local
* Atualiza Versão do Baileys

# 2.2.2 (2025-01-31 06:55)

### Features

* Adicionado prefixo key ao nome da fila no RabbitMQ

### Correções

* Atualiza Versão do Baileys

# 2.2.1 (2025-01-22 14:37)

### Features

* Sistema de retry para envio de webhooks
* Filtragem de mensagens para suporte a consultas por intervalo de timestamp
* Filtragem de chats para suporte a consultas por intervalo de timestamp

### Correções

* Correção do webhook global
* Corrigido envio de áudio com whatsapp cloud api
* Refatoração na busca de chats
* Refatoração no Canal Evolution

# 2.2.0 (2024-10-18 10:00)

### Features

* Função Fake Call
* Envio de Lista com Baileys
* Envio de Botões com Baileys
* Adicionado unreadMessages aos chats
* Integração de eventos Pusher
* Adiciona suporte para splitMessages e timePerChar nas Integrações
* Conversor de Áudio via API
* Envia mensagens PTV com Baileys

### Correções

* Corrigido prefilledVariables no startTypebot
* Corrige upload duplicado de arquivo
* Marcar como lido de mim e grupos
* Consulta de busca de chats
* Anúncios de mensagens no chatwoot
* Adiciona índices para melhorar desempenho na Evolution
* Adiciona exclusão lógica ou permanente de mensagens baseado na configuração de ambiente
* Adiciona suporte para buscar múltiplas instâncias por chave
* Atualiza instance.controller.ts para filtrar por instanceName
* Recebe mensagem de resposta de botão de template

# 2.1.2 (2024-10-06 10:09)

### Features

* Sincroniza mensagens perdidas no chatwoot
* Define o número máximo de listeners que podem ser registrados para eventos
* Agora é possível enviar mídias com form-data

### Correções

* Busca mensagem de status
* Ajustes nas migrações
* Atualiza pushName no chatwoot
* Valida mensagem antes de enviar chatwoot
* Adiciona o status da mensagem ao retorno da função "prepareMessage"
* Corrigido openai setting ao enviar mensagem com chatwoot
* Corrige função buildkey em hSet e hDelete
* Corrige número do méxico
* Atualiza versão do baileys
* Atualização na versão do Baileys que corrige timeout ao atualizar foto de perfil
* Ajustes para corrigir erro de timeout no envio de mensagem de status
* Logs verbosos do chatwoot
* Ajustes nas conexões prisma
* Termos de licença atualizados
* Corrigido envio de mensagem para grupo sem cache (local ou redis)
* Corrigido startTypebot com startSession = true
* Corrigido problema de sempre criar um novo label ao salvar chatwoot
* Corrigido getBase64FromMediaMessage com convertToMp4
* Corrigido bug ao enviar mensagem quando não tem mentionsEveryOne no payload
* Não busca mensagem sem chatwoot Message Id para reply
* Corrigido bot fallback não funcionando nas integrações

# 2.1.1 (2024-09-22 10:31)

### Features

* Define um proxy global para ser usado se a instância não tiver um
* Salva is on whatsapp no banco de dados
* Adiciona headers ao registro de webhook da instância
* Debounce message break agora é "\n" em vez de espaço em branco
* Mensagens de visualização única agora são suportadas no chatwoot
* Chatbots agora podem enviar qualquer tipo de mídia

### Correções

* Valida se cache existe antes de acessá-lo
* AutoCreate chatwoot faltando na criação da instância
* Corrigidos bugs no frontend, nas telas de eventos
* Corrigido uso de chatwoot com canal evolution
* Corrige chatwoot reply quote com Cloud API
* Usa nome de exchange do .env no RabbitMQ
* Corrigido tela de chatwoot
* Agora é possível enviar imagens via Canal Evolution
* Removido "version" do docker-compose pois está obsoleto (https://dev.to/ajeetraina/do-we-still-use-version-in-compose-3inp)
* Corrigido typebot ignoreJids sendo usado apenas das configurações padrão
* Corrigido criação de inbox do Chatwoot ao salvar
* Alterado timeout do axios para requisições do manager para 30s
* Atualização na versão do Baileys que corrige timeout ao atualizar foto de perfil
* Corrigido problema ao enviar links em markdown por chatbots como Dify
* Corrigido problema com chatbots não respeitando configurações

# 2.1.0 (2024-08-26 15:33)

### Features

* Layout do manager melhorado
* Tradução no manager: Inglês, Português, Espanhol e Francês
* Integração Evolution Bot
* Opção para desabilitar bot contact do chatwoot com CHATWOOT_BOT_CONTACT
* Adicionada integração flowise
* Adicionado canal evolution na criação de instância
* Mudança na licença para Apache-2.0
* Marcar Todos em eventos

### Correções

* Refatora estrutura de integrações para sistema modular
* Corrigido integração dify agent
* Atualiza Versão do Baileys
* Corrigido configuração de proxy no manager
* Corrigido envio de mensagens em grupos
* Salvamento de mídia no S3 enviada por mim
* Corrigido duplicação bot ao usar startTypebot

### Mudanças Importantes

* Payloads para eventos mudaram (create Instance e set events). Verifique o postman para entender

# 2.0.10 (2024-08-16 16:23)

### Features

* OpenAI envia imagens quando markdown
* Dify envia imagens quando markdown
* Sentry implementado

### Correções

* Correção no get profilePicture
* Adicionado S3_REGION nas configurações minio

# 2.0.9 (2024-08-15 12:31)

### Features

* Adicionado ignoreJids nas configurações do chatwoot
* Dify agora identifica imagens
* Openai agora identifica imagens

### Correções

* Path mapping & correção de dependências & bundler alterado para tsup
* Melhora scripts de banco de dados para recuperar o provider do arquivo env
* Atualiza banco de dados de contatos com índice único
* Salva nome do chat
* Correção de mídia como anexos no chatwoot ao usar uma Instância Meta API e não Baileys
* Atualiza versão do Baileys 6.7.6
* Descontinua botões e lista na nova versão do Baileys
* Alterado labels para serem únicos na mesma instância
* Remove instância do redis mesmo usando banco de dados
* Sistema de sessão de integração unificado para não sobrepor
* Correção temporária para bug de pictureUrl em grupos
* Correção nas migrações

# 2.0.9-rc (2024-08-09 18:00)

### Features

* Adicionado botão de sessão geral no typebot, dify e openai no manager
* Adicionado compatibilidade com mysql através do prisma

### Correções

* Importação de contatos com imagem no chatwoot
* Correção conversationId quando é dify agent
* Corrigido carregamento de selects no manager
* Adiciona botão de restart na tela de sessões
* Ajustes nos arquivos docker
* StopBotFromMe funcionando com chatwoot

# 2.0.8-rc (2024-08-08 20:23)

### Features

* Variáveis passadas para o input no dify
* OwnerJid passado para o typebot
* Função para assistente openai adicionada

### Correções

* Ajustes na telemetria

# 2.0.7-rc (2024-08-03 14:04)

### Correções

* BusinessId adicionado na criação de instâncias no manager
* Ajustes no restart instance
* Resolve problema de conexão com instância
* Sessão agora é individual por instância e remoteJid
* Credenciais verificadas no login do manager
* Adicionada coluna description no typebot, dify e openai
* Corrigido integração dify agent

# 2.0.6-rc (2024-08-02 19:23)

### Features

* Obtém modelos para OpenAI

### Correções

* fetchInstances com parâmetro clientName
* corrigido update typebot, openai e dify

# 2.0.5-rc (2024-08-01 18:01)

### Features

* Speech to Text com Openai

### Correções

* ClientName nas informações
* Barra de rolagem da tela de instâncias no manager

# 2.0.4-rc (2024-07-30 14:13)

### Features

* Novo manager v2.0
* Integração Dify

### Correções

* Atualiza Versão do Baileys
* Ajustes para o novo manager
* Corrigido validação de trigger do openai
* Corrigido validação de trigger do typebot

# 2.0.3-beta (2024-07-29 09:03)

### Features

* Url de webhook por template enviado para enviar atualizações de status
* Envio de webhook de status de aprovação de template

### Correções

* Equações e ajustes para o novo manager
* Ajustes de TriggerType para integrações OpenAI e Typebot
* Corrigido chamada de start Typebot com sessão ativa

# 2.0.2-beta (2024-07-18 21:33)

### Feature

* Open AI implementado

### Correções

* Corrigido a função de salvar ou não salvar dados no banco de dados
* Resolve não encontrar nome
* Removido DEL_TEMP_INSTANCES pois não está sendo usado
* Corrigido nome de exchange global
* Adiciona apiKey e serverUrl às prefilledVariables no serviço typebot
* Correção no start typebot, se não existir, criar

# 2.0.1-beta (2024-07-17 17:01)

### Correções

* Resolvido problema com Chatwoot não recebendo mensagens enviadas pelo Typebot

# 2.0.0-beta (2024-07-14 17:00)

### Feature

* Adicionado prisma orm, conexão com postgres e mysql
* Adicionado ativação de integração chatwoot
* Adicionado ativação de integração typebot
* Agora você pode registrar vários typebots com gatilhos
* Mídia enviada ao typebot agora vai como template string, exemplo: imageMessage|MESSAGE_ID
* Configuração de organização e logo no bot contact do chatwoot
* Adicionado tempo de debounce para mensagens do typebot
* Marcação no contato do chatwoot por instância
* Adiciona suporte para gerenciar templates do WhatsApp via API oficial
* Correções e implementação de regex e fallback no typebot
* Configuração ignore jids adicionada ao typebot (será usada tanto para grupos quanto para contatos)
* Integração Minio e S3
* Quando a integração S3 está ativada, a mídia enviada ao typebot agora vai como template string, exemplo: imageMessage|MEDIA_URL

### Correções

* Removidos logs excessivamente verbosos
* Otimização no registro de instâncias
* Agora no typebot aguardamos até o bloco terminal para aceitar a mensagem do usuário, se chegar antes do bloco ser enviado, é ignorada
* Correção do envio de áudio, agora podemos acelerar e ter o wireframe do áudio
* Responder com mensagem de mídia no Chatwoot
* melhorias no envio de status e grupos
* Correção nos retornos de respostas de botões, listas e templates
* EvolutionAPI/Baileys implementado

### Mudanças Importantes

* autenticação jwt removida
* Conexão com mongodb removida
* Padronizados todos os corpos de requisição para usar camelCase
* Mudança na informação do webhook de owner para instanceId
* Alterada a configuração do arquivo .env, removida a versão yml e adicionado .env na raiz do repositório
* Removido o tipo de conexão mobile com Baileys
* Payloads e endpoints simplificados
* Typebot melhorado
  - Agora você pode registrar vários typebots
  - Configuração de início por gatilho ou para todos
  - Busca de sessão por typebot ou remoteJid
  - Configuração KeepOpen (mantém a sessão mesmo quando o bot termina, para executar uma vez por contato)
  - Configuração StopBotFromMe, permite que eu pare o bot se eu enviar uma mensagem de chat.
* Alterada a forma como o webhook de objetivo é configurado

# 1.8.2 (2024-07-03 13:50)

### Correções

* Correção no nome global da fila rabbitmq
* Melhoria no uso do banco de dados mongodb para credenciais
* Corrigido base64 no webhook para documentWithCaption
* Corrigido Generate pairing code

# 1.8.1 (2024-06-08 21:32)

### Feature

* Novo método de salvar sessões em arquivo usando worker, feito em parceria com [codechat](https://github.com/code-chat-br/whatsapp-api)

### Correções

* Correção de variáveis quebrando linhas no typebot

# 1.8.0 (2024-05-27 16:10)

### Feature

* Agora no manager, ao fazer login com a apikey do cliente, a listagem mostra apenas a instância correspondente à apikey fornecida (apenas com MongoDB)
* Novo modo global para eventos rabbitmq
* Build em docker para plataformas linux/amd64, linux/arm64

### Correções

* Correção na formatação de mensagem quando gerada por IA como markdown no typebot
* Correção de segurança no fetch instance com client key quando não conectado ao mongodb

# 1.7.5 (2024-05-21 08:50)

### Correções

* Adiciona função merge_brazil_contacts para resolver problema do nono dígito em números brasileiros
* Otimiza método ChatwootService para atualização de contato
* Corrige autenticação swagger
* Atualiza aws sdk v3
* Corrige erro de getOpenConversationByContact e consultas init
* Método para marcar chat como não lido
* Adicionada variável de ambiente para selecionar manualmente a versão do WhatsApp web para a lib baileys (opcional)

# 1.7.4 (2024-04-28 09:46)

### Correções

* Ajustes no proxy no fetchAgent
* Recuperação de mensagens perdidas com cache redis
* Log ao iniciar serviço de cache redis
* Recuperação de mensagens perdidas com cache redis
* Nome do inbox chatwoot
* Atualiza versão do Baileys

# 1.7.3 (2024-04-18 12:07)

### Correções

* Reverte correção de codificação de áudio
* Recuperação de mensagens perdidas com cache redis
* Ajustes no redis para salvar instâncias
* Ajustes no proxy
* Reverte pull request #523
* Adicionado nome da instância nos logs
* Adicionado suporte para espanhol
* Corrige erro: operador inválido. Os operadores permitidos para identificador são equal_to, not_equal_to no chatwoot

# 1.7.2 (2024-04-12 17:31)

### Feature

* Conexão mobile via sms (teste)

### Correções

* Ajustes no redis
* Envia evento global no websocket
* Ajustes no proxy
* Corrige codificação de áudio
* Corrige leitura de conversa na versão 3.7 do chatwoot
* Corrige ao receber/enviar mensagens do whatsapp desktop com mensagens efêmeras ativadas
* Alterados retornos de sessões na mudança de status do typebot
* Reorganização de arquivos e pastas

# 1.7.1 (2024-04-03 10:19)

### Correções

* Correção ao enviar arquivos com legenda no Whatsapp Business
* Correção no recebimento de mensagens com resposta no WhatsApp Business
* Correção ao enviar reação a uma mensagem no WhatsApp Business
* Correção do recebimento de reações no WhatsApp business
* Removido descrição obrigatória de linhas do sendList
* Recurso para coletar tipo de mensagem no typebot

# 1.7.0 (2024-03-11 18:23)

### Feature

* Adicionado endpoint de atualização de mensagem
* Adiciona capacidade de traduzir QRMessages no CW
* Entrar em Grupo por Código de Convite
* Ler mensagens do whatsapp no chatwoot
* Adiciona suporte para usar redis no cacheservice
* Adiciona suporte para labels
* Comando para limpar cache do inbox chatwoot
* Whatsapp Cloud API Oficial

### Correções

* Melhorias na configuração de proxy
* Correção no envio de listas
* Ajuste no webhook_base64
* Correção na formatação de texto do typebot
* Correção na formatação de texto do chatwoot e renderização de mensagem de lista
* Só usa uma requisição axios para obter o mimetype do arquivo se necessário
* Quando possível usar a extensão de arquivo original
* Ao receber um arquivo do whatsapp, usa o nome de arquivo original no chatwoot se possível
* Remove cache de ids de mensagens no chatwoot para usar a própria api do chatwoot
* Ajusta a mensagem citada, agora tem contextInfo na mensagem Raw
* Coleta de respostas com texto ou números no Typebot
* Adicionado endpoint sendList à documentação swagger
* Implementada função para sincronizar exclusões de mensagens no WhatsApp, refletindo automaticamente no Chatwoot.
* Melhoria na validação de números
* Corrige enquetes no envio de mensagens
* Envio de mensagem de status
* Mensagem 'connection successfully' spamming
* Invalida o cache da conversa se reopen_conversation for false e a conversa foi resolvida
* Corrige loop ao deletar uma mensagem no chatwoot
* Ao receber um arquivo do whatsapp, usa o nome de arquivo original no chatwoot se possível
* Correção na Função sendList
* Implementa upsert de contato em messaging-history.set
* Melhora tratamento de erros de proxy
* Refatora busca de participantes para grupo no serviço WhatsApp
* Corrigido problema onde a palavra final do typebot não funcionava
* A espera do typebot agora pausa o fluxo e composing é definido pelo parâmetro delay_message no set typebot
* Composing acima de 20s agora faz loop até terminar

# 1.6.1 (2023-12-22 11:43)

### Correções

* Corrigido Mensagens Lid
* Corrigido envio de variáveis para o typebot
* Corrigido envio de variáveis do typebot
* Correção envio de mídia s3/minio para chatwoot e typebot
* Corrigido problema do typebot fechar no final do fluxo, agora isso é opcional com a variável TYPEBOT_KEEP_OPEN
* Corrigido formatação Negrito, Itálico e Sublinhado do chatwoot usando Regex
* Adicionada a propriedade sign_delimiter à configuração do Chatwoot, permitindo definir um delimitador diferente para a assinatura. Padrão quando não definido \n
* Inclui o campo instance Id na configuração da instância
* Corrigido o pairing code
* Ajustes no typebot
* Corrigido problema ao desconectar a instância e conectar novamente usando mongodb
* Opções para desabilitar docs e manager
* Ao deletar uma mensagem no whatsapp, deleta a mensagem no chatwoot também

# 1.6.0 (2023-12-12 17:24)

### Feature

* Adicionada Integração AWS SQS
* Adicionado suporte à nova API do typebot
* Adicionado endpoint sendPresence
* Novo Instance Manager
* Adicionado auto_create ao set chatwoot para criar o inbox automaticamente ou não
* Adicionado reply, delete e reação de mensagem no chatwoot v3.3.1

### Correções

* Ajustes no proxy
* Ajustes no start session para Typebot
* Adicionado campo mimetype ao enviar mídia
* Ajustes nas validações para messages.upsert
* Corrigido mensagens não recebidas: tratamento de erro ao atualizar contato no chatwoot
* Correção workaround para gerenciar param data como array no mongodb
* Removido await do webhook ao enviar uma mensagem
* Atualiza typebot.service.ts - element.underline alterado ~ para *
* Removido restart da api ao receber um erro
* Correções no mongodb e chatwoot
* Ajustado retorno de consultas no mongodb
* Adicionado restart da instância ao atualizar foto de perfil
* Correção do funcionamento do chatwoot com fluxos de admin
* Corrigido problema que não gerava qrcode com a opção chatwoot_conversation_pending ativada
* Corrigido problema onde CSAT abria um novo ticket quando reopen_conversation estava desativado
* Corrigido problema ao enviar contato para Chatwoot via iOS

### Integrações

* Chatwoot: v3.3.1
* Typebot: v2.20.0

# 1.5.4 (2023-10-09 20:43)

### Correções

* Problema de tipagem do logger do Baileys resolvido
* Resolvido problema com mensagens duplicadas no chatwoot

# 1.5.3 (2023-10-06 18:55)

### Feature

* Documentação Swagger
* Adicionada opção de envio base 64 via webhook

### Correções

* Remove filas rabbitmq ao deletar instâncias
* Melhoria no restart da instância para refazer completamente a conexão
* Atualiza versão do node: v20
* Correção de mensagens enviadas pela api e typebot não aparecerem no chatwoot
* Ajuste no start typebot, adicionado parâmetro startSession
* Chatwoot agora recebe mensagens enviadas via api e typebot
* Corrigido problema de início com input no typebot
* Adicionada verificação para garantir que variáveis não estejam vazias antes de executar foreach no start typebot

# 1.5.2 (2023-09-28 17:56)

### Correções

* Correção chatwootSchema no modelo chatwoot para armazenar opções reopen_conversation e conversation_pending
* Problema resolvido ao enviar arquivos do minio para o typebot
* Melhoria no método "startTypebot" para criar sessão persistente quando acionado
* Novo manager para Evo 1.5.2 - Atualização Set Typebot
* Resolvidos problemas ao ler/consultar instâncias

# 1.5.1 (2023-09-17 13:50)

### Feature

* Adicionada opção listening_from_me no Set Typebot
* Adicionada opção de variáveis no Start Typebot
* Adicionados webhooks para eventos do typebot
* Adicionada integração ChamaAI
* Adicionado webhook para envio de erros
* Adicionado suporte para mensagens com anúncios no chatwoot

### Correções

* Correção de mensagens de conexão em loop no chatwoot
* Melhoria de desempenho na busca de instâncias

# 1.5.0 (2023-08-18 12:47)

### Feature

* Novo gerenciador de instâncias na rota /manager
* Adicionados arquivos extras para chatwoot e appsmith
* Adicionado Get Last Message e Archive para Chat
* Adicionada env var QRCODE_COLOR
* Adicionado websocket para envio de eventos
* Adicionado rabbitmq para envio de eventos
* Adicionada integração Typebot
* Adicionado endpoint proxy
* Adicionado send e date_time nos dados do webhook

### Correções

* Resolvido problema ao desconectar da instância a instância era deletada
* Codificados espaços no webhook do chatwoot
* Ajuste no salvamento de contatos, salvando a informação do número e Jid
* Atualiza Dockerfile
* Se você passar eventos vazios no create instance e set webhook é entendido como todos
* Corrigido problema que não saía médias base64
* Mensagens enviadas pela api agora chegam no chatwoot

### Integrações

* Chatwoot: v2.18.0 - v3.0.0
* Typebot: v2.16.0
* Manager Evolution API

# 1.4.8 (2023-07-27 10:27)

### Correções

* Corrigido bug de retorno de erro

# 1.4.7 (2023-07-27 08:47)

### Correções

* Corrigido bug de retorno de erro
* Corrigido problema de obtenção de mensagem ao deletar mensagem no chatwoot
* Mudança no padrão de retorno de erro

# 1.4.6 (2023-07-26 17:54)

### Correções

* Corrigido bug de criação de novo inbox pelo chatwoot
* Quando a conversa reabre está pendente quando conversation pending é true
* Adicionado arquivo docker-compose com imagem dockerhub

# 1.4.5 (2023-07-26 09:32)

### Correções

* Corrigidos problemas na localização de template no chatwoot
* Correção de mids duplicadas no chatwoot

# 1.4.4 (2023-07-25 15:24)

### Correções

* Corrigido problema de quebra de linha no chatwoot
* Resolvido recebimento de localização no chatwoot
* Ao solicitar o código de pareamento, também traz o qr code
* Opção reopen_conversation no endpoint chatwoot
* Opção conversation_pending no endpoint chatwoot

# 1.4.3 (2023-07-25 10:51)

### Correções

* Ajustes nas configurações com opções always_online, read_messages e read_status
* Corrigido envio de webhook para evento CALL
* Criar instância com configurações

# 1.4.2 (2023-07-24 20:52)

### Correções

* Corrigida validação is set settings
* Ajustes nas validações de grupo
* Ajustes na mensagem de figurinha para chatwoot

# 1.4.1 (2023-07-24 18:28)

### Correções

* Corrigida reconexão com código de pareamento ou qrcode
* Corrigido problema no createJid

# 1.4.0 (2023-07-24 17:03)

### Features

* Adicionada funcionalidade de conexão via código de pareamento
* Adicionado endpoint fetch profile no chat controller
* Criado controller de configurações
* Adicionado rejeitar chamada e enviar mensagem de texto ao receber uma chamada
* Adicionada configuração para ignorar mensagens de grupo
* Adicionada conexão com código de pareamento no chatwoot com comando /init:{NUMBER}
* Adicionada opção de codificação no endpoint sendWhatsAppAudio

### Correções

* Adicionada opção de link preview no envio de mensagem de texto
* Corrigido problema com fileSha256 aparecendo ao enviar figurinha no chatwoot
* Corrigido problema onde não era possível abrir uma conversa quando enviada primeiro por mim no meu celular no chatwoot
* Agora só atualiza o nome do contato se for igual ao número de telefone no chatwoot
* Agora aceita todos os templates de inbox do chatwoot
* Comando para criar novas instâncias definido para /new_instance:{NAME}:{NUMBER}
* Correção no set chatwoot, sign msg agora pode ser desabilitado

### Integrações

* Chatwoot: v2.18.0 - v3.0.0 (Beta)

# 1.3.2 (2023-07-21 17:19)

### Correções

* Correção no update settings que precisava reiniciar após atualizado
* Correção no uso da api com mongodb
* Ajustes no endpoint de busca de contatos, chats, mensagens e mensagens de status
* Agora ao deletar a instância, os dados referentes a ela no mongodb também são deletados
* Agora é validado se o nome da instância contém letras maiúsculas e caracteres especiais
* Por razões de compatibilidade, o modo container foi removido
* Adicionados arquivos docker-compose de exemplo

### Integrações

* Chatwoot: v2.18.0

# 1.3.1 (2023-07-20 07:48)

### Correções

* Ajuste no create store files

### Integrações

* Chatwoot: v2.18.0

# 1.3.0 (2023-07-19 11:33)

### Features

* Adicionado evento messages.delete
* Adicionado endpoint restart instance
* Criada automação para criação de instâncias no bot do chatwoot com o comando '#inbox_whatsapp:{INSTANCE_NAME}
* Alterada versão do Baileys para: 6.4.0
* Envio de contato no chatwoot
* Envio de array de contatos no chatwoot
* Adicionado apiKey no webhook e serverUrl no fetchInstance se EXPOSE_IN_FETCH_INSTANCES: true
* Tradução definida como padrão (inglês) no chatwoot

### Correções

* Corrigido erro ao enviar mensagem em grupos grandes
* Arquivos docker ajustados
* Corrigido na coleção postman o parâmetro webhookByEvent para webhook_by_events
* Adicionadas validações na criação de instância
* Removido endpoint link preview, agora é feito automaticamente a partir do envio de texto convencional
* Adicionada validação de pertencimento ao grupo antes de enviar mensagem para grupos
* Ajustes nos arquivos docker
* Ajustes nos retornos dos endpoints chatwoot e webhook
* Corrigido ghost mentions no envio de mensagem de texto
* Corrigido bug que salvava contatos de grupos sem número no chatwoot
* Corrigido problema para receber csat no chatwoot
* Corrigido necessidade de fileName para documento apenas em base64 para enviar mensagem de mídia
* Correção de bug ao enviar mensagem mobile altera nome do contato para número no chatwoot
* Correção de bug ao conectar whatsapp não envia mensagem de confirmação
* Corrigido mensagem citada com id ou mensagem diretamente
* Ajuste na validação para números mexicanos e argentinos
* Ajuste no create store files

### Integrações

* Chatwoot: v2.18.0

# 1.2.2 (2023-07-15 09:36)

### Correções

* Ajuste na rota "/" com informações da versão
* Ajustes na versão do chatwoot

### Integrações

* Chatwoot: v2.18.0

# 1.2.1 (2023-07-14 19:04)

### Correções

* Ajustes nos arquivos docker
* Salva url de imagem de grupos no chatwoot

# 1.2.0 (2023-07-14 15:28)

### Features

* Integração nativa com chatwoot
* Adicionada opção de retornar ou não participantes no fetchAllGroups
* Adicionada integração de grupos ao chatwoot
* Adicionada automação na criação de instância para chatwoot
* Adicionados logs verbosos e formato do serviço chatwoot

### Correções

* Ajustes nos arquivos docker-compose
* Ajustes na validação de número para números AR e MX
* Ajustes nos arquivos env, removido save old_messages
* Correção ao enviar mensagem para um grupo que não pertenço retorna bad request
* Ajustes no formato de retorno do endpoint fetchAllGroups
* Ajuste no envio de documento com legenda do chatwoot
* Corrigida mensagem com undefind no chatwoot
* Alterada mensagem na path /
* Teste de mensagem de mídia duplicada em grupos chatwoot
* Otimiza envio de mensagem de grupo com menções
* Corrigido nome do status de perfil no fetchInstances
* Corrigido erro 500 ao fazer logout na instância com status = close

# 1.1.5 (2023-07-12 07:17)

### Correções

* Ajustes na pasta temp
* Retorno com evento send_message

# 1.1.4 (2023-07-08 11:01)

### Features

* Rota para enviar broadcast de status
* Adicionados logs verbosos
* Inserido allContacts no payload do endpoint sendStatus

### Correções

* Ajustado set no webhook para ir vazio quando enabled false
* Ajuste no store files
* Corrigido problema ao não salvar contatos ao receber mensagens
* Alterado owner do jid para instanceName
* Criar .env para instalação no docker

# 1.1.3 (2023-07-06 11:43)

### Features

* Adicionada configuração para nível de log do Baileys no env
* Adicionado conversor de áudio para mp4 opcionalmente no get Base64 From MediaMessage
* Adicionado nome da organização no vcard
* Adicionado email no vcard
* Adicionado url no vcard
* Adicionados logs verbosos

### Correções

* Adicionado timestamp internamente nas urls para evitar cache
* Correção na descriptografia de votos de enquete
* Mudança na forma como a api enviava e salvava as mensagens enviadas, agora vai no evento messages.upsert
* Corrigido cash ao enviar figurinhas via url
* Melhorado como o Redis funciona para instâncias
* Corrigido problema ao desconectar a instância ela remove a instância
* Corrigido problema de envio de ack quando a visualização é feita por mim
* Ajuste no store files

# 1.1.2 (2023-06-28 13:43)

### Correções

* Corrigido versão do baileys no package.json
* Corrigido problema que não validava se o token passado na criação da instância já existia
* Corrigido problema que não deleta arquivos da instância no modo server

# 1.1.1 (2023-06-28 10:27)

### Features

* Adicionado envio de convite de grupo
* Adicionada configuração de webhook por evento no registro da instância individual

### Correções

* Ajuste de variáveis do dockerfile

# 1.1.0 (2023-06-21 11:17)

### Features

* Melhorado endpoint fetch instances, agora também busca outras instâncias mesmo que não estejam conectadas
* Adicionada conversão de áudios para envio de áudio gravado, agora é possível enviar áudios mp3 e não apenas ogg
* Rota para buscar todos os grupos que a conexão faz parte
* Rota para buscar todas as configurações de privacidade
* Rota para atualizar as configurações de privacidade
* Rota para atualizar assunto do grupo
* Rota para atualizar descrição do grupo
* Rota para aceitar código de convite
* Adicionada configuração de eventos por webhook das instâncias
* Agora a api key pode ser exposta no fetch instances se a variável EXPOSE_IN_FETCH_INSTANCES estiver definida como true
* Adicionada opção de gerar qrcode assim que a instância é criada
* O token da instância criada agora também pode ser opcionalmente definido manualmente no endpoint de criação
* Rota para enviar Sticker

### Correções

* Ajuste de variáveis do dockerfile
* ajustes no docker-compose para passar variáveis
* Ajusta a rota getProfileBusiness para fetchProfileBusiness
* correção de erro após logout e tentar obter status ou conectar novamente
* correção de envio de áudio narrado no whatsapp android e ios
* corrigido o problema de não desabilitar o webhook global pela variável
* Ajuste no registro de arquivos temporários e limpeza periódica
* Correção para o modo container também funcionar apenas com arquivos
* Remover gravação de mensagens antigas na sincronização

# 1.0.9 (2023-06-10)

### Correções

* Ajuste de variáveis do dockerfile

# 1.0.8 (2023-06-09)

### Features

* Adicionado arquivo Docker compose
* Adicionado arquivo ChangeLog

# 1.0.7 (2023-06-08)

### Features

* Ghost mention
* Menção em resposta
* Mudança de foto de perfil
* Mudança de nome de perfil
* Mudança de status de perfil
* Envio de enquete
* Criação de LinkPreview se mensagem contiver URL
* Novo sistema de webhooks, que pode ser separado em uma url por evento
* Envio da url do webhook local como destino nos dados do webhook para redirecionamento do webhook
* Modos de inicialização, server ou container
* Modo Server funciona normalmente como todos estão acostumados
* Modo Container feito para usar uma instância por container, ao iniciar a aplicação uma instância já é criada e o qrcode é gerado e começa a enviar webhook sem precisar chamar manualmente, permite apenas uma instância por vez.