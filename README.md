# 🔱 Evolution API - Sistema Trinity (Multi-Tenant SaaS)

Este repositório contém a inteligência e o backend do sistema **Trinity Bot**, uma plataforma SaaS robusta baseada no modelo **Trinity** (WhatsApp Bot AI + Site de Agendamento + Painel Admin), projetada para atender múltiplos estabelecimentos de forma isolada e escalável.

---

## 📂 Documentação Central

A documentação completa, incluindo a arquitetura multi-tenant, guias de setup para novos clientes e instruções de desenvolvimento, está centralizada na pasta `documentation/`.

### 👉 [Acessar a Documentação Técnica](file:///d:/evolution-api/documentation/README.md)

---

## 🛠️ Estrutura do Projeto

- **`src-bot/`**: Lógica do Bot de atendimento (Multi-tenant) e API de agendamentos.
- **`src/`**: Evolution API (Core - Gerenciamento de instâncias WhatsApp).
- **`site agendamentos.../`**: Frontend configurável (Painel administrativo e site para clientes).
- **`scripts/`**: Utilitários de desenvolvimento, manutenção e balanceamento de carga.
- **`resources/`**: Backups, esquemas de banco de dados e arquivos de suporte.

---

## 🚀 Como começar?

1. Certifique-se de ter o **Node.js 20+** instalado.
2. Configure o arquivo `.env` seguindo o `.env.example`.
3. Para entender como adicionar um novo estabelecimento (tenant) ao sistema, siga o [Guia de Novo Cliente](file:///d:/evolution-api/documentation/guias/novo-cliente.md).

---

© 2026 Evolution API / Trinity Team - Plataforma Multi-Tenant.
