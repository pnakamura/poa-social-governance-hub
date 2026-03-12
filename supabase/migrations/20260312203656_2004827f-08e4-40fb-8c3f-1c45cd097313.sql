CREATE TABLE public.pep_sei (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pep_entry_id uuid NOT NULL REFERENCES public.pep_entries(id) ON DELETE CASCADE,
  numero_processo text NOT NULL,
  url text,
  descricao text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pep_sei ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_all_pep_sei" ON public.pep_sei
  FOR ALL TO public
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_pep_sei_entry ON public.pep_sei(pep_entry_id);