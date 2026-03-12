

## Criar interface de ingestão de documentos RAG

### Situação atual
- A edge function `rag-ingest` já existe e aceita `{ title, content, source_type, source_url, metadata }`
- Não há nenhuma tela ou componente no frontend para enviar documentos
- A página Settings existe mas só tem teste de conexão Supabase

### Proposta

Criar uma nova página **"Base de Conhecimento"** (rota `/conhecimento`) com:

1. **Formulário de ingestão manual** — campos para título, conteúdo (textarea grande), tipo de fonte (select: manual, google_drive, gmail, whatsapp, web), URL da fonte (opcional), e botão "Ingerir". Chama a edge function `rag-ingest` via fetch.

2. **Lista de documentos ingeridos** — tabela mostrando os documentos em `rag_documents` (título, tipo, data, quantidade de chunks, status). Permite ver detalhes e excluir documentos.

3. **Upload de arquivo** — permitir arrastar/colar um arquivo `.txt` ou `.md` e extrair o conteúdo automaticamente para o campo de texto.

4. **Seção informativa** — card com instruções sobre como configurar os workflows n8n para ingestão automática (Google Drive, Gmail, WhatsApp, Web), com link para a documentação já existente em `n8n/docs/rag-ingestion-guide.md`.

### Alterações técnicas

| Arquivo | Ação |
|---|---|
| `src/pages/Conhecimento.tsx` | Criar — página completa com formulário + listagem |
| `src/App.tsx` | Adicionar rota `/conhecimento` |
| `src/components/layout/Sidebar.tsx` | Adicionar link "Base de Conhecimento" com ícone `BookOpen` |

### Detalhes de implementação

- O formulário chama `supabase.functions.invoke('rag-ingest', { body: payload })` diretamente
- A listagem faz `supabase.from('rag_documents').select('*').order('created_at', { ascending: false })`
- Exclusão: deleta o documento (chunks são removidos via cascade se configurado, senão deletar chunks primeiro)
- Upload de arquivo: usa `FileReader` para ler `.txt/.md` e preencher o textarea

