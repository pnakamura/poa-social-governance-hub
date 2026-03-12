

## Fix: Google Embedding API 404 Error

### Problem
The `text-embedding-004` model has been deprecated by Google and returns 404 on the `v1beta` API. Both `rag-embed-batch` and `rag-chat` are affected.

### Solution
Replace `text-embedding-004` with `gemini-embedding-001` in both functions. The new model also produces 768-dimensional vectors, so no database changes are needed.

### Changes

| File | Change |
|---|---|
| `supabase/functions/rag-embed-batch/index.ts` (line 13) | Change model from `text-embedding-004` to `gemini-embedding-001` |
| `supabase/functions/rag-chat/index.ts` (line 131) | Same change |

After deploying, test by calling `rag-embed-batch` with `document_id: 43e183e1-3f82-42ce-9408-ef38c3659efd` to embed the 5 existing chunks.

