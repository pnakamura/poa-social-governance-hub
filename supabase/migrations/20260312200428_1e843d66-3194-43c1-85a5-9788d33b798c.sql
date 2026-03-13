
-- Add new columns to atividades
ALTER TABLE public.atividades ADD COLUMN IF NOT EXISTS descricao text;
ALTER TABLE public.atividades ADD COLUMN IF NOT EXISTS cor text;

-- Create atividade_comentarios table
CREATE TABLE IF NOT EXISTS public.atividade_comentarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  atividade_id uuid NOT NULL REFERENCES public.atividades(id) ON DELETE CASCADE,
  texto text NOT NULL,
  autor text,
  criado_em timestamptz DEFAULT now()
);

ALTER TABLE public.atividade_comentarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_all_comentarios" ON public.atividade_comentarios
  FOR ALL TO public
  USING (true) WITH CHECK (true);

-- Create atividade_alertas table
CREATE TABLE IF NOT EXISTS public.atividade_alertas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  atividade_id uuid NOT NULL REFERENCES public.atividades(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'info',
  mensagem text NOT NULL,
  resolvido boolean DEFAULT false,
  criado_em timestamptz DEFAULT now()
);

ALTER TABLE public.atividade_alertas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_all_alertas" ON public.atividade_alertas
  FOR ALL TO public
  USING (true) WITH CHECK (true);
