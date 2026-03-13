
-- ─── pep_cronograma_financeiro (unpivot series temporal) ──────────────────
CREATE TABLE public.pep_cronograma_financeiro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pep_entry_id UUID NOT NULL REFERENCES public.pep_entries(id) ON DELETE CASCADE,
  periodo DATE NOT NULL,
  valor_planejado NUMERIC DEFAULT 0,
  valor_realizado NUMERIC DEFAULT 0,
  moeda TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(pep_entry_id, periodo, moeda)
);

ALTER TABLE public.pep_cronograma_financeiro ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_all_cronograma_fin" ON public.pep_cronograma_financeiro FOR ALL TO public USING (true) WITH CHECK (true);

-- ─── pep_tarefas (Gantt tasks) ───────────────────────────────────────────
CREATE TABLE public.pep_tarefas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pep_entry_id UUID NOT NULL REFERENCES public.pep_entries(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  fase TEXT NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  progresso INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pendente',
  responsavel TEXT,
  notas TEXT,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.pep_tarefas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_all_pep_tarefas" ON public.pep_tarefas FOR ALL TO public USING (true) WITH CHECK (true);
