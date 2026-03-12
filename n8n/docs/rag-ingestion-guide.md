# Guia de Configuração — Workflows n8n para Ingestão RAG

Este documento descreve como configurar workflows no n8n para alimentar o sistema RAG do POA+SOCIAL.

## Endpoint de Ingestão

Todos os workflows devem enviar documentos para:

```
POST https://dvqnlnxkwcrxbctujajl.supabase.co/functions/v1/rag-ingest
```

### Payload

```json
{
  "title": "Nome do documento",
  "content": "Texto completo do documento...",
  "source_type": "google_drive | gmail | whatsapp | web | manual",
  "source_url": "https://link-original-do-documento",
  "metadata": {
    "author": "Nome do autor",
    "date": "2026-03-12",
    "tags": ["pep", "riscos"]
  }
}
```

### Headers obrigatórios

```
Content-Type: application/json
```

### Resposta

```json
{
  "document_id": "uuid",
  "chunks_count": 15,
  "action": "created | updated"
}
```

---

## 1. Google Drive

### Trigger
- **Google Drive Trigger** (polling) — monitorar pasta específica
- Ou **Webhook** — se usar Google Drive Push Notifications

### Workflow

```
Google Drive Trigger (nova/alterada)
  → Google Drive: Download File
  → IF file type = PDF → Extract Text (via Tika ou PDF parse)
  → IF file type = Google Doc → Google Docs: Get Content
  → HTTP Request POST → rag-ingest
```

### Configuração
1. Criar credencial Google OAuth2 no n8n
2. Configurar trigger para monitorar pasta do programa
3. No nó "HTTP Request":
   - URL: `https://dvqnlnxkwcrxbctujajl.supabase.co/functions/v1/rag-ingest`
   - Method: POST
   - Body (JSON):
     ```json
     {
       "title": "{{ $json.name }}",
       "content": "{{ $json.content }}",
       "source_type": "google_drive",
       "source_url": "{{ $json.webViewLink }}",
       "metadata": {
         "mimeType": "{{ $json.mimeType }}",
         "modifiedTime": "{{ $json.modifiedTime }}"
       }
     }
     ```

---

## 2. Gmail

### Trigger
- **Gmail Trigger** — monitorar caixa de entrada ou label específico

### Workflow

```
Gmail Trigger (novo email)
  → Code: extrair corpo do email (texto ou HTML → texto)
  → HTTP Request POST → rag-ingest
```

### Configuração
1. Criar credencial Gmail OAuth2 no n8n
2. Configurar trigger com filtro de label (ex: "POA-SOCIAL")
3. No nó "Code" (JavaScript):
   ```javascript
   const subject = $input.first().json.subject;
   const from = $input.first().json.from;
   const body = $input.first().json.text || $input.first().json.snippet;
   const date = $input.first().json.date;

   return [{
     json: {
       title: `Email: ${subject}`,
       content: `De: ${from}\nData: ${date}\nAssunto: ${subject}\n\n${body}`,
       source_type: "gmail",
       source_url: `https://mail.google.com/mail/u/0/#inbox/${$input.first().json.id}`,
       metadata: { from, subject, date }
     }
   }];
   ```
4. No nó "HTTP Request": POST para `rag-ingest` com o JSON acima

---

## 3. WhatsApp (via Twilio)

### Pré-requisitos
- Conta Twilio com WhatsApp Sandbox configurado
- Webhook Twilio apontando para n8n

### Workflow

```
Webhook (recebe mensagem Twilio)
  → Code: formatar mensagem
  → HTTP Request POST → rag-ingest
```

### Configuração

1. No Twilio Console:
   - Ativar WhatsApp Sandbox
   - Configurar webhook "When a message comes in" para a URL do webhook n8n

2. No n8n, criar **Webhook** node:
   - Method: POST
   - Path: `/whatsapp-incoming`

3. No nó "Code":
   ```javascript
   const body = $input.first().json.body;
   const from = $input.first().json.body.From;
   const message = $input.first().json.body.Body;
   const timestamp = new Date().toISOString();

   return [{
     json: {
       title: `WhatsApp: ${from} - ${timestamp.split('T')[0]}`,
       content: `De: ${from}\nData: ${timestamp}\n\n${message}`,
       source_type: "whatsapp",
       metadata: { from, timestamp, sid: body.MessageSid }
     }
   }];
   ```

4. Para agrupar mensagens da mesma conversa ao longo do dia, considere usar um nó **Wait** + **Merge** para acumular mensagens antes de enviar ao `rag-ingest`.

---

## 4. Web Scraping

### Opção A: Firecrawl (recomendado)

```
Schedule Trigger (diário/semanal)
  → HTTP Request: Firecrawl API
  → Code: extrair markdown
  → HTTP Request POST → rag-ingest
```

### Opção B: HTTP Request direto

```
Schedule Trigger
  → HTTP Request: GET página
  → HTML Extract: extrair texto
  → HTTP Request POST → rag-ingest
```

### Configuração (Firecrawl)
1. Obter API key do Firecrawl
2. Configurar Schedule Trigger
3. No nó "HTTP Request" (Firecrawl):
   - URL: `https://api.firecrawl.dev/v1/scrape`
   - Method: POST
   - Headers: `Authorization: Bearer FIRECRAWL_API_KEY`
   - Body:
     ```json
     {
       "url": "https://pagina-alvo.com",
       "formats": ["markdown"]
     }
     ```
4. No nó "Code":
   ```javascript
   const data = $input.first().json;
   return [{
     json: {
       title: data.metadata?.title || data.url,
       content: data.markdown,
       source_type: "web",
       source_url: data.url,
       metadata: { 
         scraped_at: new Date().toISOString(),
         domain: new URL(data.url).hostname
       }
     }
   }];
   ```

---

## Dicas Gerais

1. **Deduplicação**: O endpoint `rag-ingest` faz hash do conteúdo automaticamente. Se o mesmo conteúdo for enviado novamente, ele atualiza ao invés de duplicar.

2. **Tamanho do conteúdo**: O chunking é feito automaticamente no backend (chunks de ~1000 chars com overlap de 200). Envie o texto completo.

3. **Monitoramento**: Verifique os logs da Edge Function em:
   https://supabase.com/dashboard/project/dvqnlnxkwcrxbctujajl/functions/rag-ingest/logs

4. **Teste manual**: Use o nó "HTTP Request" isolado para testar a ingestão antes de automatizar:
   ```json
   {
     "title": "Documento de Teste",
     "content": "Este é um documento de teste para verificar que a ingestão RAG está funcionando corretamente.",
     "source_type": "manual"
   }
   ```
