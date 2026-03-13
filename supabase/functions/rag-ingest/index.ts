import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Text chunking ───────────────────────────────────────────────────────────

function chunkText(
  text: string,
  chunkSize = 2500,
  overlap = 200,
): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;

    if (end < text.length) {
      const lastPeriod = text.lastIndexOf(".", end);
      const lastNewline = text.lastIndexOf("\n", end);
      const breakPoint = Math.max(lastPeriod, lastNewline);
      if (breakPoint > start + chunkSize / 2) {
        end = breakPoint + 1;
      }
    }

    const chunk = text.slice(start, end).trim();
    if (chunk.length > 50) {
      chunks.push(chunk);
    }

    start = end - overlap;
    if (start >= text.length) break;
  }

  return chunks;
}

// ── Content hash ────────────────────────────────────────────────────────────

async function hashContent(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ── Main handler ────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { title, content, source_type, source_url, metadata } = await req.json();

    if (!title || !content) {
      return new Response(
        JSON.stringify({ error: "Campos 'title' e 'content' são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Check for duplicate content
    const contentHash = await hashContent(content);
    const { data: existing } = await supabase
      .from("rag_documents")
      .select("id")
      .eq("content_hash", contentHash)
      .limit(1);

    let docId: string;
    let action: string;

    if (existing && existing.length > 0) {
      docId = existing[0].id;
      action = "updated";

      // Delete old chunks and update document metadata
      await supabase.from("rag_chunks").delete().eq("document_id", docId);
      await supabase
        .from("rag_documents")
        .update({
          title,
          source_type: source_type ?? "manual",
          source_url: source_url ?? null,
          metadata: metadata ?? {},
          updated_at: new Date().toISOString(),
        })
        .eq("id", docId);
    } else {
      // Create new document
      const { data: doc, error: docError } = await supabase
        .from("rag_documents")
        .insert({
          title,
          source_type: source_type ?? "manual",
          source_url: source_url ?? null,
          content_hash: contentHash,
          metadata: metadata ?? {},
        })
        .select("id")
        .single();

      if (docError || !doc) {
        throw new Error(`Failed to create document: ${docError?.message}`);
      }
      docId = doc.id;
      action = "created";
    }

    // 2. Chunk text and store WITHOUT embeddings
    const chunks = chunkText(content);
    console.log(`Storing ${chunks.length} chunks without embeddings for doc ${docId}...`);

    const chunkRows = chunks.map((c, i) => ({
      document_id: docId,
      content: c,
      chunk_index: i,
      metadata: { source_type: source_type ?? "manual" },
      // embedding is NULL — will be filled by rag-embed-batch
    }));

    // Insert all chunks at once (no embedding = fast)
    for (let i = 0; i < chunkRows.length; i += 50) {
      const batch = chunkRows.slice(i, i + 50);
      const { error: chunkError } = await supabase.from("rag_chunks").insert(batch);
      if (chunkError) console.error("Chunk insert error:", chunkError);
    }

    // Update chunk count
    await supabase
      .from("rag_documents")
      .update({ chunk_count: chunks.length })
      .eq("id", docId);

    // 3. Trigger embedding processing asynchronously (fire-and-forget)
    const embedUrl = `${SUPABASE_URL}/functions/v1/rag-embed-batch`;
    console.log(`Triggering rag-embed-batch for doc ${docId}, offset 0...`);

    fetch(embedUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ document_id: docId, offset: 0, batch_size: 2 }),
    }).catch((err) => console.error("Failed to trigger rag-embed-batch:", err));

    console.log(`Document ${docId} ${action} with ${chunks.length} chunks (embeddings queued)`);

    return new Response(
      JSON.stringify({
        document_id: docId,
        chunks_count: chunks.length,
        action,
        embedding_status: "queued",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("RAG ingest error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
