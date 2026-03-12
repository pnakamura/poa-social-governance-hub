
-- 1. Drop the embedding column and recreate as vector(768)
ALTER TABLE public.rag_chunks DROP COLUMN embedding;
ALTER TABLE public.rag_chunks ADD COLUMN embedding vector(768);

-- 2. Recreate match_chunks function for vector(768)
CREATE OR REPLACE FUNCTION public.match_chunks(
  query_embedding vector(768),
  match_threshold double precision DEFAULT 0.5,
  match_count integer DEFAULT 10
)
RETURNS TABLE(
  id uuid,
  document_id uuid,
  content text,
  metadata jsonb,
  similarity double precision
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public, extensions'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rc.id,
    rc.document_id,
    rc.content,
    rc.metadata,
    (1 - (rc.embedding <=> query_embedding))::FLOAT AS similarity
  FROM public.rag_chunks rc
  WHERE (1 - (rc.embedding <=> query_embedding))::FLOAT > match_threshold
  ORDER BY rc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
