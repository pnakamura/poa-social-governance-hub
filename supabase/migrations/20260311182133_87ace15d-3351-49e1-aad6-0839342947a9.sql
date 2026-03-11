
-- Tabela para riscos específicos de itens PEP e vinculação com riscos globais
CREATE TABLE public.pep_riscos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pep_entry_id UUID NOT NULL REFERENCES public.pep_entries(id) ON DELETE CASCADE,
  risco_global_id UUID REFERENCES public.riscos(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  probabilidade TEXT NOT NULL DEFAULT 'Média' CHECK (probabilidade IN ('Muito Baixa', 'Baixa', 'Média', 'Alta', 'Muito Alta')),
  impacto TEXT NOT NULL DEFAULT 'Médio' CHECK (impacto IN ('Muito Baixo', 'Baixo', 'Médio', 'Alto', 'Muito Alto')),
  mitigacao TEXT,
  status TEXT NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Mitigado', 'Aceito', 'Eliminado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pep_riscos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_all_pep_riscos" ON public.pep_riscos
  FOR ALL TO public
  USING (true)
  WITH CHECK (true);

-- Trigger para updated_at
CREATE TRIGGER update_pep_riscos_updated_at
  BEFORE UPDATE ON public.pep_riscos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
