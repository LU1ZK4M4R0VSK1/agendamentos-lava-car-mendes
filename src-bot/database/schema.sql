-- ============================================
-- SCHEMA MVP SIMPLIFICADO — 5 tabelas
-- SQLite compatível com migração futura para PostgreSQL
-- ============================================

CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'general',
    phone TEXT,
    instance_name TEXT UNIQUE NOT NULL,
    admin_group_jid TEXT,
    system_prompt TEXT,
    business_hours TEXT, -- JSON estruturado
    timezone TEXT DEFAULT 'America/Sao_Paulo',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    remote_jid TEXT NOT NULL,
    push_name TEXT,
    phone TEXT,
    organization_id TEXT NOT NULL REFERENCES organizations(id),
    first_contact_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_contact_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(remote_jid, organization_id)
);

CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL REFERENCES customers(id),
    organization_id TEXT NOT NULL REFERENCES organizations(id),
    instance_name TEXT,
    status TEXT DEFAULT 'active',
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME
);

CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(id),
    whatsapp_message_id TEXT UNIQUE,
    direction TEXT NOT NULL,
    content TEXT,
    message_type TEXT DEFAULT 'text',
    sender_jid TEXT,
    timestamp INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS service_requests (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(id),
    customer_id TEXT NOT NULL REFERENCES customers(id),
    organization_id TEXT NOT NULL REFERENCES organizations(id),
    type TEXT DEFAULT 'general',
    status TEXT DEFAULT 'pending',
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices essenciais
CREATE INDEX IF NOT EXISTS idx_customers_jid_org ON customers(remote_jid, organization_id);
CREATE INDEX IF NOT EXISTS idx_conversations_customer ON conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_whatsapp_id ON messages(whatsapp_message_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_service_requests_org ON service_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_created ON service_requests(created_at);
