
-- Allow authenticated users to delete rag_documents
CREATE POLICY "authenticated_delete_rag_documents" ON public.rag_documents
  FOR DELETE TO authenticated
  USING (true);

-- Allow authenticated users to delete rag_chunks  
CREATE POLICY "authenticated_delete_rag_chunks" ON public.rag_chunks
  FOR DELETE TO authenticated
  USING (true);

-- Also allow anon to delete (since app uses anon key without auth)
DROP POLICY IF EXISTS "rag_documents_delete" ON public.rag_documents;
CREATE POLICY "rag_documents_delete" ON public.rag_documents
  FOR DELETE TO public
  USING (true);

DROP POLICY IF EXISTS "rag_chunks_delete" ON public.rag_chunks;
CREATE POLICY "rag_chunks_delete" ON public.rag_chunks
  FOR DELETE TO public
  USING (true);
