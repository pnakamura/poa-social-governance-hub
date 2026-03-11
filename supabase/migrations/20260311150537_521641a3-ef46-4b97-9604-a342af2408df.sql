
-- Dados editáveis de gestão do item PEP
CREATE TABLE public.pep_gestao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pep_entry_id uuid NOT NULL REFERENCES public.pep_entries(id) ON DELETE CASCADE UNIQUE,
  status text NOT NULL DEFAULT 'nao_iniciado',
  progresso integer NOT NULL DEFAULT 0,
  data_inicio_real date,
  data_fim_previsto date,
  nivel_risco text DEFAULT 'baixo',
  notas text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Impedimentos / check-list
CREATE TABLE public.pep_impedimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pep_entry_id uuid NOT NULL REFERENCES public.pep_entries(id) ON DELETE CASCADE,
  descricao text NOT NULL,
  resolvido boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Histórico de alterações
CREATE TABLE public.pep_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pep_entry_id uuid NOT NULL REFERENCES public.pep_entries(id) ON DELETE CASCADE,
  campo text NOT NULL,
  valor_anterior text,
  valor_novo text,
  usuario text DEFAULT 'sistema',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.pep_gestao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pep_impedimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pep_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_all" ON public.pep_gestao FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON public.pep_impedimentos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON public.pep_historico FOR ALL USING (true) WITH CHECK (true);

-- Trigger para updated_at
CREATE TRIGGER update_pep_gestao_updated_at
  BEFORE UPDATE ON public.pep_gestao
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket para evidências
INSERT INTO storage.buckets (id, name, public) VALUES ('pep-evidencias', 'pep-evidencias', true);
CREATE POLICY "pep_evidencias_read" ON storage.objects FOR SELECT USING (bucket_id = 'pep-evidencias');
CREATE POLICY "pep_evidencias_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pep-evidencias');
CREATE POLICY "pep_evidencias_delete" ON storage.objects FOR DELETE USING (bucket_id = 'pep-evidencias');
