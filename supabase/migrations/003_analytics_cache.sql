-- 003_analytics_cache.sql
-- Cache de dados externos (BCB, IBGE, INMET) com TTL de 6h
-- Criado para o Epic E002 — Análise Inteligente

CREATE TABLE IF NOT EXISTS analytics_cache (
  chave        TEXT PRIMARY KEY,
  dados        JSONB        NOT NULL,
  calculado_em TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Índice para verificação de TTL
CREATE INDEX IF NOT EXISTS idx_analytics_cache_calculado ON analytics_cache(calculado_em DESC);

-- RLS: leitura pública, escrita via service_role
ALTER TABLE analytics_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analytics_cache_select" ON analytics_cache
  FOR SELECT USING (true);

CREATE POLICY "analytics_cache_insert" ON analytics_cache
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'anon');

CREATE POLICY "analytics_cache_update" ON analytics_cache
  FOR UPDATE USING (auth.role() = 'service_role' OR auth.role() = 'anon');

-- Habilitar Realtime (opcional — para notificações de atualização)
ALTER PUBLICATION supabase_realtime ADD TABLE analytics_cache;
