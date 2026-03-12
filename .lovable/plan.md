

## Migração completa para Google text-embedding-004 (768 dimensões)

### Problema
O modelo `gte-small` do Supabase.ai excede o limite de CPU das edge functions, impedindo a geração de embeddings mesmo em lotes de 2 chunks.

### Solução
Substituir `gte-small` pelo Google `text-embedding-004` via HTTP em todo o pipeline RAG. Este modelo gera vetores de 768 dimensões e roda externamente (sem consumir CPU da edge function).

### Pré-requisito: GOOGLE_API_KEY
O projeto não possui a secret `GOOGLE_API_KEY`. Será necessário adicioná-la antes de implementar. A chave pode ser obtida em [Google AI Studio](https://aistudio.google.com/apikey).

### Alterações

| Arquivo | Mudança |
|---|---|
| `supabase/functions/rag-embed-batch/index.ts` | Substituir `Supabase.ai.Session("gte-small")` por chamada HTTP ao Google `text-embedding-004`. Vetores de 768 dimensões. |
| `supabase/functions/rag-chat/index.ts` | Mesma substituição na função `generateEmbedding` usada para busca semântica. Usar `GOOGLE_API_KEY` em vez de `LOVABLE_API_KEY`. |
| Migration SQL | `ALTER COLUMN embedding TYPE vector(768)`, recriar `match_chunks` com `vector(768)`, e `UPDATE rag_chunks SET embedding = NULL` para forçar reindexação. |

### Fluxo de embedding (HTTP, sem CPU local)

```text
rag-embed-batch
  → fetch("https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=...")
  → response.embedding.values (768 floats)
  → UPDATE rag_chunks SET embedding = ...
  → se restam chunks, auto-invoca próximo batch
```

### Reindexação
A migration vai setar todos os embeddings existentes para NULL. Após deploy, basta chamar `rag-embed-batch` com o `document_id` para reprocessar.

