

## Fix: CPU Time Exceeded on rag-ingest

### Problem
The `gte-small` model running inside the edge function exceeds the CPU time limit when processing 14+ chunks sequentially. Each embedding call is CPU-intensive and the free tier has a ~50s wall-clock / ~2s CPU limit.

### Solution: Split into batch processing with a queue approach

Refactor `rag-ingest` to process chunks in **small batches across multiple invocations**:

1. **First call**: Create/update the document, chunk the text, store chunks **without embeddings**, return immediately with `action: "queued"`.

2. **New endpoint `rag-embed-batch`**: A separate edge function that processes N chunks at a time (e.g., 3 chunks per invocation). After embedding a batch, it calls itself for the next batch via `fetch()`.

This is complex. A simpler approach:

### Simpler Solution: Increase chunk size + limit chunks

1. **Increase chunk size** from 1000 to 2000 chars, reduce overlap to 100 — cuts chunks roughly in half (14 → ~7).
2. **Process embeddings with a timeout safety** — if we can't do all, store what we have.

### Simplest Solution (recommended): Two-phase ingestion

**Phase 1** — `rag-ingest` stores the document and chunks (text only, no embeddings). Returns immediately.

**Phase 2** — A new `rag-embed` function is called per-chunk or in small batches (2-3 chunks). The n8n workflow or frontend calls it after ingestion.

Actually, the simplest fix that keeps everything in one function:

### Recommended: Larger chunks + process one-at-a-time with DB writes

Increase chunk size to 2500 chars with 200 overlap. This cuts a ~14k char document from 14 chunks to ~6. Also, insert each chunk immediately after embedding (instead of batching all at the end), so partial progress is saved.

### Changes

| File | Action |
|---|---|
| `supabase/functions/rag-ingest/index.ts` | Increase `chunkSize` to 2500, insert each chunk right after its embedding is generated, add progress logging |

If this still hits CPU limits, we'll need to split into a two-phase approach with a separate `rag-embed` function.

