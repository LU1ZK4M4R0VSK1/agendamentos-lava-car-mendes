# 🔱 LAVA CAR MENDES - DOCUMENTAÇÃO DO SISTEMA (TRINITY MODEL)

Esta documentação serve como o "Cérebro do Projeto" para guiar IAs e desenvolvedores. Use este arquivo para entender a arquitetura, os contratos de API e como o sistema "respira".

---

## 🏛️ ARQUITETURA DO SISTEMA (TRINDADE)

O sistema funciona como três pilares integrados:

1.  **WHATSAPP (O Recepcionista)**:
    *   **Motor**: Evolution API + Gemini (Google AI).
    *   **Função**: Saudação inicial, identificação básica e envio do Link de Agendamento.
    *   **Fluxo**: Ativo no arquivo `src-bot/index.js`, respondendo via webhook.

2.  **SITE DE AGENDAMENTO (O Especialista)**:
    *   **Motor**: React + Vite + Tailwind CSS.
    *   **Função**: Fluxo guiado de 8 passos para coleta de Serviço, Veículo (Hatch/Sedan/SUV), Placa, Data e Hora.
    *   **Repositório**: `car-wash-boss/`.

3.  **PAINEL ADMIN (O Gerente)**:
    *   **Motor**: Dashboard de Gestão (integrado no site).
    *   **Função**: Visualizar faturamento hoje/mês, gerenciar agenda e mudar status de lavagens.
    *   **Backend**: API Administrativa no servidor do bot (`src-bot/admin.routes.js`).

---

## 📊 BANCO DE DATOS (PostgreSQL)

### Tabelas Principais:
*   `organizations`: Cada unidade de Lava Car (SaaS ready). Ex: `posto3l` -> Lava Car Mendes.
*   `customers`: Dados básicos (Nome, Telefone, WhatsApp JID).
*   `vehicles`: **(Novo)** Vínculo entre cliente e carro (Placa, Modelo, Cor, Tipo).
*   `appointments`: Agendamentos com `vehicle_id`, `total_price` e `status` dinâmico.
*   `services`: Catálogo de preços base e durações.

### Status de Agendamento:
`agendado` ➔ `em_andamento` ➔ `concluido` (ou `cancelado`).

---

## 🔌 CONTRATOS DE API (Endpoints Críticos)

### Público (Site -> Bot)
*   `POST /api/public/bookings`: Salva o agendamento completo (Cria cliente e veículo em cascata).

### Admin (Painel -> Bot)
*   `GET /api/admin/dashboard`: Stats rápidos (Receita, Carros hoje).
*   `GET /api/admin/agenda`: Lista detalhada por dia.
*   `PATCH /api/admin/appointments/:id/status`: Muda o status do serviço.

---

## 🧠 VIBE CODING - DIRETRIZES PARA A IA

Para manter a coesão do projeto, SEMPRE siga estas regras:

1.  **Multi-Tenancy**: Sempre use `organization_id` ou `instanceName` (`posto3l`) nas consultas. Nunca ignore o isolamento de dados.
2.  **Cascata de Agendamento**: Um agendamento nunca existe sozinho. Ele exige um `customer_id` e um `vehicle_id`. Use `db.saveFullBooking` para garantir a integridade.
3.  **IDs de Serviço**: No site e no banco, use `svc_1`, `svc_2`, etc. Não use nomes como IDs em chaves estrangeiras.
4.  **Datas**: Use ISO Strings para o banco e `format(date, 'HH:mm')` para exibição no frontend.
5.  **CORS**: O site roda (geralmente) na porta 5173 e o Bot na 3001. O CORS está habilitado no Bot para permitir essa conversa local.

---

## ⚠️ ERROS E GOTCHAS (Histórico)

*   **Banco de Dados Inexistente**: O banco `bot_db` precisa ser criado manualmente se o Postgres for novo (Use `node create-db.js`).
*   **Conflito de Horário**: PostgreSQL impede agendamentos sobrepostos via restrição `no_overlap`. Se der erro 409, o horário já está cheio.
*   **IDs do Lovable**: O projeto original do Lovable usava IDs como `simples`. Foram migrados para `svc_1` para alinhar com o Seed do Bot.

---

*Documentação gerada em: 2026-04-01 por Antigravity AI.*
