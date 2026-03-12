

## Sistema RAG Completo para o Assistente POA+SOCIAL

### Visao geral da arquitetura

```text
┌─────────────────────────────────────────────────────────┐
│                   FONTES DE DADOS                       │
│  Google Drive │ Gmail │ WhatsApp │ Web Scraping         │
└──────┬────────┴───┬───┴────┬─────┴────┬─────────────────┘
       │            │        │          │
       └────────────┴────────┴──────────┘
                     │
              ┌──────▼──────┐
              │     n8n     │  (orquestrador de ingestão)
              │  workflows  │
              └──────┬──────┘
                     │ chunking + embedding
              ┌──────▼──────────────────┐
              │   Supabase (pgvector)   │
              │  rag_documents          │
              │  rag_chunks (embeddings)│
              │  chat_conversations     │
              └──────▲──────────────────┘
                     │ semantic search
              ┌──────┴──────┐
              │ Edge Function│  rag-chat
              │ (embedding   │
              │  + LLM call) │
              └──────▲──────┘
                     │
              ┌──────┴──────┐
              │  Frontend   │  ChatAssistant.tsx
              │  (markdown, │  conversation history,
              │   streaming)│  source citations
              └─────────────┘
```

### Etapa 1 — Tabelas no Supabase (migration)

Criar 3 tabelas principais:

- **`rag_documents`** — registro de cada documento ingerido (título, fonte, tipo: `google_drive | gmail | whatsapp | web`, URL original, hash para deduplicação, metadata JSONB, timestamps)
- **`rag_chunks`** — chunks de texto com embeddings vetoriais (`document_id` FK, conteúdo texto, embedding `vector(1536)`, metadata JSONB, posição no documento)
- **`chat_conversations`** — histórico de conversas para contexto multi-turno (`user_id` opcional, messages JSONB array, created_at, updated_at)

Habilitar extensão `vector` (pgvector). Criar índice IVFFlat no campo embedding para busca eficiente. Criar função SQL `match_chunks(query_embedding, match_threshold, match_count)` para busca semântica.

### Etapa 2 — Edge Function `rag-chat` (substitui `n8n-chat-webhook`)

Nova edge function que:
1. Recebe `{ message, conversation_id? }` 
2. Gera embedding da pergunta via Lovable AI Gateway
3. Chama `match_chunks()` para buscar os top-K chunks relevantes (semantic search)
4. Também busca dados estruturados do Supabase (tabelas existentes — PEP, riscos, etc.) usando a detecção de intent atual
5. Monta system prompt com: dados fixos + chunks RAG + dados estruturados
6. Chama Claude (ANTHROPIC_API_KEY já configurado) com histórico de conversa
7. Salva a conversa em `chat_conversations`
8. Retorna `{ answer, sources: [{title, type, url}], conversation_id }`

### Etapa 3 — Edge Function `rag-ingest` (para n8n chamar)

Endpoint que n8n usará para enviar documentos:
1. Recebe `{ title, content, source_type, source_url, metadata }`
2. Faz chunking do texto (overlap de 200 chars, chunks de ~1000 chars)
3. Gera embeddings para cada chunk via Lovable AI Gateway
4. Insere documento + chunks no Supabase
5. Retorna `{ document_id, chunks_count }`

### Etapa 4 — Frontend atualizado

- **Markdown rendering** — instalar `react-markdown` + `remark-gfm` para renderizar tabelas, negrito, listas nas respostas
- **Citações de fontes** — mostrar badges clicáveis com tipo da fonte (Drive, Gmail, WhatsApp, Web) e link original
- **Histórico de conversa** — enviar `conversation_id` para manter contexto multi-turno
- **Chat maior** — aumentar dimensões do painel para acomodar respostas ricas

### Etapa 5 — Orientações para n8n (documentação, não código)

Fornecer orientações para criar workflows n8n para cada fonte:

- **Google Drive**: trigger por polling ou webhook → baixar arquivo → extrair texto (PDF/Docs) → POST para `rag-ingest`
- **Gmail**: trigger IMAP/Gmail node → extrair corpo do email → POST para `rag-ingest` com `source_type: 'gmail'`
- **WhatsApp**: Recomendação de usar **Twilio para WhatsApp** (disponível como conector Lovable). Workflow: Twilio webhook → n8n recebe mensagem → POST para `rag-ingest` com `source_type: 'whatsapp'`
- **Web**: n8n HTTP Request node ou Firecrawl → extrair markdown → POST para `rag-ingest` com `source_type: 'web'`

### Arquivos modificados/criados

1. **Migration SQL** — extensão pgvector, tabelas `rag_documents`, `rag_chunks`, `chat_conversations`, função `match_chunks`
2. **`supabase/functions/rag-chat/index.ts`** — nova edge function RAG
3. **`supabase/functions/rag-ingest/index.ts`** — endpoint de ingestão para n8n
4. **`supabase/config.toml`** — adicionar as duas novas functions
5. **`src/components/ChatAssistant.tsx`** — markdown, citações, conversation_id, painel maior
6. **`package.json`** — adicionar `react-markdown` e `remark-gfm`

### Sobre WhatsApp

Para monitoramento de WhatsApp, a opção mais viável é **Twilio para WhatsApp**:
- Twilio já está disponível como conector Lovable
- Configuração: criar sandbox WhatsApp no Twilio → configurar webhook apontando para n8n → n8n processa e envia para `rag-ingest`
- Quando pronto para produção, migrar do sandbox para número WhatsApp Business aprovado

