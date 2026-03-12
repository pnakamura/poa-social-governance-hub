
CREATE TABLE IF NOT EXISTS public.atividade_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  atividade_id uuid NOT NULL REFERENCES public.atividades(id) ON DELETE CASCADE,
  texto text NOT NULL,
  concluido boolean DEFAULT false,
  ordem integer DEFAULT 0,
  criado_em timestamptz DEFAULT now()
);

ALTER TABLE public.atividade_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_all_checklist" ON public.atividade_checklist
  FOR ALL TO public
  USING (true) WITH CHECK (true);
