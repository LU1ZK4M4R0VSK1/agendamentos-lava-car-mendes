# 📚 Documentação da Plataforma - Sistema Trinity (Multi-Tenant)

Bem-vindo à documentação centralizada da plataforma **Trinity**. Este repositório foi projetado como uma solução **SaaS (Software as a Service)**, onde uma única infraestrutura backend atende múltiplos estabelecimentos (tenants) de forma isolada e segura.

---

## 🏛️ Conceito Multi-Tenant

A plataforma utiliza o identificador `organization_id` para garantir que os dados de cada cliente (como o Lava Car Mendes, Pizzarias, etc.) nunca se misturem. 
- **Isolamento de Dados**: Consultas ao banco sempre filtram por organização.
- **Configuração Individual**: Cada tenant possui seus próprios horários, serviços, preços e prompts de IA.
- **Escalabilidade**: Novos clientes podem ser adicionados sem alterações no código principal.

---

## 🗺️ Sumário

### 🏗️ [Arquitetura](file:///d:/evolution-api/documentation/arquitetura/trinity.md)
Entenda o "Cérebro" da plataforma e como o modelo Trinity gerencia múltiplos inquilinos.

### 🚀 [Guias de Configuração](file:///d:/evolution-api/documentation/guias/)
- [**Adicionando um Novo Tenant**](file:///d:/evolution-api/documentation/guias/novo-cliente.md): Passo a passo para configurar um novo estabelecimento no bot.
- [**Setup do Servidor**](file:///d:/evolution-api/documentation/guias/setup-bot-avancado.md): Instalação do core da plataforma.

### 🔌 [API & Endpoints](file:///d:/evolution-api/documentation/api/endpoints.md)
*(Em construção)* Documentação técnica das rotas públicas e administrativas.

### 🚢 [Deploy & Infraestrutura](file:///d:/evolution-api/documentation/deploy/)
- [**Kama Tech / Produção**](file:///d:/evolution-api/documentation/deploy/kama-tech.md): Guia de deploy em ambientes produtivos (Hetzner/Docker).

### 📈 [Produto](file:///d:/evolution-api/documentation/produto/)
- [**Changelog**](file:///d:/evolution-api/documentation/produto/changelog.md): Histórico de atualizações e novas funcionalidades.
- [**Roadmap**](file:///d:/evolution-api/documentation/produto/roadmap.md): Planejamento de futuras sprints e melhorias.

### 🧠 [Vibbe Coding & IA](file:///d:/evolution-api/documentation/vibe-coding/)
Espaço dedicado para o aprendizado da IA e resolução de problemas recorrentes.
- [**Troubleshooting**](file:///d:/evolution-api/documentation/vibe-coding/troubleshooting.md): Soluções para erros comuns.
- [**Instruções Claude/IA**](file:///d:/evolution-api/documentation/vibe-coding/claude-instructions.md): Contexto específico para assistentes de codificação.
- [**Segurança**](file:///d:/evolution-api/documentation/vibe-coding/security.md): Práticas de segurança e proteção de dados.

---

> [!TIP]
> Se você é um desenvolvedor novo ou uma IA começando no projeto, comece pela [Arquitetura](file:///d:/evolution-api/documentation/arquitetura/trinity.md).
