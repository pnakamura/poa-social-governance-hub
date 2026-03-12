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

// ── Embedding generation via Supabase built-in gte-small ────────────────────

async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const model = new Supabase.ai.Session("gte-small");
  const allEmbeddings: number[][] = [];

  for (const text of texts) {
    const output = await model.run(text, {
      mean_pool: true,
      normalize: true,
    });
    // output is a Float32Array or similar typed array — convert to number[]
    allEmbeddings.push(Array.from(output as Float32Array));
  }

  return allEmbeddings;
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

    if (existing && existing.length > 0) {
      // Update existing document: delete old chunks and re-ingest
      await supabase.from("rag_chunks").delete().eq("document_id", existing[0].id);
      await supabase
        .from("rag_documents")
        .update({
          title,
          source_type: source_type ?? "manual",
          source_url: source_url ?? null,
          metadata: metadata ?? {},
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing[0].id);

      const docId = existing[0].id;

      // Re-chunk and re-embed
      const chunks = chunkText(content);
      console.log(`Generating embeddings for ${chunks.length} chunks (update)...`);
      const embeddings = await generateEmbeddings(chunks);

      const chunkRows = chunks.map((c, i) => ({
        document_id: docId,
        content: c,
        embedding: JSON.stringify(embeddings[i]),
        chunk_index: i,
        metadata: { source_type: source_type ?? "manual" },
      }));

      await supabase.from("rag_chunks").insert(chunkRows);
      await supabase
        .from("rag_documents")
        .update({ chunk_count: chunks.length })
        .eq("id", docId);

      return new Response(
        JSON.stringify({
          document_id: docId,
          chunks_count: chunks.length,
          action: "updated",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2. Create new document
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

    // 3. Chunk text
    const chunks = chunkText(content);

    // 4. Generate embeddings using built-in gte-small
    console.log(`Generating embeddings for ${chunks.length} chunks (new doc)...`);
    const embeddings = await generateEmbeddings(chunks);

    // 5. Insert chunks with embeddings
    const chunkRows = chunks.map((c, i) => ({
      document_id: doc.id,
      content: c,
      embedding: JSON.stringify(embeddings[i]),
      chunk_index: i,
      metadata: { source_type: source_type ?? "manual" },
    }));

    // Insert in batches of 50
    for (let i = 0; i < chunkRows.length; i += 50) {
      const batch = chunkRows.slice(i, i + 50);
      const { error: chunkError } = await supabase.from("rag_chunks").insert(batch);
      if (chunkError) {
        console.error("Chunk insert error:", chunkError);
      }
    }

    // 6. Update chunk count
    await supabase
      .from("rag_documents")
      .update({ chunk_count: chunks.length })
      .eq("id", doc.id);

    console.log(`Successfully ingested doc ${doc.id} with ${chunks.length} chunks`);

    return new Response(
      JSON.stringify({
        document_id: doc.id,
        chunks_count: chunks.length,
        action: "created",
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
