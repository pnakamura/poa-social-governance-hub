
-- RAG Documents table
CREATE TABLE public.rag_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'web',
  source_url TEXT,
  content_hash TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  chunk_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RAG Chunks table with vector embeddings
CREATE TABLE public.rag_chunks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.rag_documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding extensions.vector(1536),
  metadata JSONB DEFAULT '{}'::jsonb,
  chunk_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Chat Conversations table
CREATE TABLE public.chat_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX rag_chunks_document_id_idx ON public.rag_chunks(document_id);
CREATE INDEX rag_documents_source_type_idx ON public.rag_documents(source_type);
CREATE INDEX rag_documents_content_hash_idx ON public.rag_documents(content_hash);
CREATE INDEX chat_conversations_user_id_idx ON public.chat_conversations(user_id);

-- RLS
ALTER TABLE public.rag_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rag_documents_select" ON public.rag_documents FOR SELECT USING (true);
CREATE POLICY "rag_documents_insert" ON public.rag_documents FOR INSERT WITH CHECK (
  auth.role() = 'service_role' OR auth.role() = 'anon'
);
CREATE POLICY "rag_documents_update" ON public.rag_documents FOR UPDATE USING (
  auth.role() = 'service_role' OR auth.role() = 'anon'
);
CREATE POLICY "rag_documents_delete" ON public.rag_documents FOR DELETE USING (
  auth.role() = 'service_role'
);

CREATE POLICY "rag_chunks_select" ON public.rag_chunks FOR SELECT USING (true);
CREATE POLICY "rag_chunks_insert" ON public.rag_chunks FOR INSERT WITH CHECK (
  auth.role() = 'service_role' OR auth.role() = 'anon'
);
CREATE POLICY "rag_chunks_delete" ON public.rag_chunks FOR DELETE USING (
  auth.role() = 'service_role'
);

CREATE POLICY "chat_conversations_select" ON public.chat_conversations FOR SELECT USING (true);
CREATE POLICY "chat_conversations_insert" ON public.chat_conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "chat_conversations_update" ON public.chat_conversations FOR UPDATE USING (true);

-- Match chunks function for semantic search
CREATE OR REPLACE FUNCTION public.match_chunks(
  query_embedding extensions.vector(1536),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public, extensions'
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
