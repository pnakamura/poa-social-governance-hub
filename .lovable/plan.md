

## Fix: `match_chunks` search_path breaks `<=>` operator

### Root Cause
The `match_chunks` function has `SET search_path TO 'public, extensions'` which Postgres interprets as a **single schema** named `"public, extensions"` rather than two schemas. The pgvector `<=>` operator lives in the `extensions` schema and is never found.

This is why RAG semantic search silently returns empty results -- the function throws an internal error that gets swallowed.

### Fix
One SQL migration to recreate `match_chunks` with the correct search_path syntax:

```sql
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
```

Key change: `SET search_path = public, extensions` (no quotes wrapping both values together).

### No other changes needed
- Edge functions (`rag-chat`, `rag-embed-batch`) are correct
- Embeddings (768-dim) are correctly stored
- Only the SQL function's search_path syntax is broken

