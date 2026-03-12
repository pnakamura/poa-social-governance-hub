CREATE OR REPLACE FUNCTION public.match_chunks(
  query_embedding extensions.vector,
  match_threshold double precision DEFAULT 0.5,
  match_count integer DEFAULT 10
)
RETURNS TABLE(id uuid, document_id uuid, content text, metadata jsonb, similarity double precision)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
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