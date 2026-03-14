-- Migration 010: Sessões e Grupos WhatsApp
-- Suporte ao chatbot WhatsApp conectado ao rag-chat + parse-inbox

-- Tabela 1: Sessões por número de telefone
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  phone            TEXT        NOT NULL UNIQUE,
  push_name        TEXT,                          -- nome do contato no WhatsApp
  autorizado       BOOLEAN     DEFAULT FALSE,
  conversation_id  TEXT,                          -- ID da conversa no rag-chat (chat_conversations)
  ultima_mensagem  TIMESTAMPTZ DEFAULT now(),
  projeto          TEXT        DEFAULT 'BR-L1597',
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- Tabela 2: Grupos WhatsApp autorizados
CREATE TABLE IF NOT EXISTS whatsapp_grupos (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_jid        TEXT        NOT NULL UNIQUE,   -- ex: "5551999999999-1234567890@g.us"
  nome             TEXT,
  autorizado       BOOLEAN     DEFAULT TRUE,
  mencionar_apenas BOOLEAN     DEFAULT FALSE,     -- FALSE = responde tudo no grupo
  projeto          TEXT        DEFAULT 'BR-L1597',
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_wa_sessions_phone    ON whatsapp_sessions(phone);
CREATE INDEX IF NOT EXISTS idx_wa_sessions_autorizado ON whatsapp_sessions(autorizado);
CREATE INDEX IF NOT EXISTS idx_wa_grupos_jid        ON whatsapp_grupos(group_jid);

-- RLS
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_grupos   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_all_wa_sessions"
  ON whatsapp_sessions FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "public_all_wa_grupos"
  ON whatsapp_grupos FOR ALL USING (true) WITH CHECK (true);
