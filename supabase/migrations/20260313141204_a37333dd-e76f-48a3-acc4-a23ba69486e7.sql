
-- Fase 1: UNIQUE constraints para habilitar UPSERT

-- pep_entries: chave natural = (codigo_wbs, versao)
ALTER TABLE pep_entries 
  ADD CONSTRAINT pep_entries_wbs_versao_uk UNIQUE (codigo_wbs, versao);

-- pmr_outputs: chave natural = codigo
ALTER TABLE pmr_outputs 
  ADD CONSTRAINT pmr_outputs_codigo_uk UNIQUE (codigo);

-- pmr_outcomes: chave natural = codigo
ALTER TABLE pmr_outcomes 
  ADD CONSTRAINT pmr_outcomes_codigo_uk UNIQUE (codigo);
