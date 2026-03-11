-- 006_pep_expansion.sql
-- Expansão da tabela pep_entries para incluir código WBS, valores em BRL,
-- tipo/método de aquisição, entregas físicas por ano e desembolsos anuais.
-- Apliar manualmente no SQL Editor do Supabase.
-- Compatível com dados v2 já existentes (ALTER TABLE não apaga dados).

ALTER TABLE pep_entries
  ADD COLUMN IF NOT EXISTS codigo_wbs        TEXT,              -- col I — "1.2.3.4"
  ADD COLUMN IF NOT EXISTS k_reais_bid       NUMERIC(15,2),     -- col K — BRL BID
  ADD COLUMN IF NOT EXISTS l_reais_local     NUMERIC(15,2),     -- col L — BRL Local
  ADD COLUMN IF NOT EXISTS m_reais_total     NUMERIC(15,2),     -- col M — BRL Total
  ADD COLUMN IF NOT EXISTS pct_bid           NUMERIC(6,2),      -- col Q — %BID
  ADD COLUMN IF NOT EXISTS pmr_ref           TEXT,              -- col Z — código PMR associado
  ADD COLUMN IF NOT EXISTS pa_ref            TEXT,              -- col AA — ref Ponto de Atenção
  ADD COLUMN IF NOT EXISTS tipo_aquisicao    TEXT,              -- col AB — ex: "Consultor Individual"
  ADD COLUMN IF NOT EXISTS metodo_aquisicao  TEXT,              -- col AC — ex: "CD", "3CV", "SN"
  ADD COLUMN IF NOT EXISTS fisica_2025       SMALLINT DEFAULT 0, -- col AD — entrega prevista 2025 (0/1)
  ADD COLUMN IF NOT EXISTS fisica_2026       SMALLINT DEFAULT 0, -- col AE
  ADD COLUMN IF NOT EXISTS fisica_2027       SMALLINT DEFAULT 0, -- col AF
  ADD COLUMN IF NOT EXISTS fisica_2028       SMALLINT DEFAULT 0, -- col AG
  ADD COLUMN IF NOT EXISTS fisica_2029       SMALLINT DEFAULT 0, -- col AH
  ADD COLUMN IF NOT EXISTS fisica_eop        SMALLINT DEFAULT 0, -- col AI — entrega EOP
  ADD COLUMN IF NOT EXISTS desembolso_2025   NUMERIC(15,2),     -- col AJ — US$ previsto 2025
  ADD COLUMN IF NOT EXISTS desembolso_2026   NUMERIC(15,2),     -- col AK
  ADD COLUMN IF NOT EXISTS desembolso_2027   NUMERIC(15,2),     -- col AL
  ADD COLUMN IF NOT EXISTS desembolso_2028   NUMERIC(15,2),     -- col AM
  ADD COLUMN IF NOT EXISTS desembolso_2029   NUMERIC(15,2),     -- col AN
  ADD COLUMN IF NOT EXISTS desembolso_total  NUMERIC(15,2);     -- col AO — total US$

-- Índice WBS único por versão (referência primária de navegação)
CREATE UNIQUE INDEX IF NOT EXISTS idx_pep_wbs_versao
  ON pep_entries (codigo_wbs, versao)
  WHERE codigo_wbs IS NOT NULL;

-- Índice para filtrar entregas físicas por ano (queries de cronograma)
CREATE INDEX IF NOT EXISTS idx_pep_fisica
  ON pep_entries (versao, ref)
  WHERE ref = 'PT';
