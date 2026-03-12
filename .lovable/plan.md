

## Analysis: Where the Chat Gets PEP Information

### Current Data Flow

When a user asks about the PEP, the `rag-chat` edge function combines **two data sources**:

### 1. Structured Database Query (pep_entries table)
- **Trigger**: `detectTables()` matches keywords like "pep", "orçamento", "wbs", "componente", etc.
- **Query** (line 68): Only selects `ref, comp, prod, subp, pct, descricao, n_atual, o_atual, p_atual, r_base, t_base`
- **Filter**: `versao = 'v2'`, limit 80 rows
- **Sent to Claude**: Only a **sample of 15 rows** (`amostra: data.slice(0, 15)` on line 111)

**Problem**: The query selects only 11 columns and sends only 15 of 80 rows to the LLM. Key columns like `codigo_wbs`, `secretaria`, `lote`, `tipo_aquisicao`, `metodo_aquisicao`, `desembolso_*`, `fisica_*`, `resumo_executivo` are **not included**. This means the assistant gives shallow, incomplete answers about the PEP.

### 2. RAG Semantic Search (rag_chunks table)
- Generates an embedding of the user message via Google's `gemini-embedding-001`
- Calls `match_chunks()` RPC to find similar text chunks (threshold 0.3, max 8 chunks)
- This may return additional PEP context **if** relevant documents were ingested into the RAG system

### 3. Hardcoded Program Facts
- Fixed data in `buildSystemPrompt()` (lines 221-236): program name, contract number, total value, components breakdown, executing agencies, etc.

---

### Root Issues

| Issue | Detail |
|---|---|
| **Missing columns** | PEP query omits `codigo_wbs`, `secretaria`, `desembolso_*`, `fisica_*`, `resumo_executivo`, `tipo_aquisicao`, `metodo_aquisicao`, `lote` |
| **Too few rows** | 80 rows fetched but only 15 sent to Claude as "amostra" |
| **No hierarchy context** | The query doesn't distinguish Components (ref=C) from Products (ref=P) or Sub-products (ref=SP) for the LLM |

### Proposed Fix

Update the `rag-chat` edge function to:

1. **Expand the PEP select columns** to include `codigo_wbs`, `secretaria`, `desembolso_total`, `tipo_aquisicao`, `metodo_aquisicao`, `lote`, `resumo_executivo`
2. **Increase the sample size** for `pep_entries` from 15 to 30 (or send all 80, since Components are ~3 rows + Products ~15 + Sub-products + PTs)
3. **Add a smarter sampling strategy**: send ALL Component-level rows (ref=C) and Product-level rows (ref=P), then sample PT-level rows -- this gives the LLM a complete structural overview

### Files changed

| File | Action |
|---|---|
| `supabase/functions/rag-chat/index.ts` | Edit TABLE_QUERIES for pep_entries, increase sample slice, add hierarchy-aware sampling |

