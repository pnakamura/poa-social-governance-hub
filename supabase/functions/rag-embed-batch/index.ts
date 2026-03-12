import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Embedding generation via Supabase built-in gte-small ────────────────────

async function generateEmbedding(text: string): Promise<number[]> {
  const model = new Supabase.ai.Session("gte-small");
  const output = await model.run(text, {
    mean_pool: true,
    normalize: true,
  });
  return Array.from(output as Float32Array);
}

// ── Main handler ────────────────────────────────────────────────────────────
// Processes `batch_size` chunks (default 2) starting at `offset`.
// After finishing, chains to itself for the next batch.

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
    const { document_id, offset = 0, batch_size = 2 } = await req.json();

    if (!document_id) {
      return new Response(
        JSON.stringify({ error: "document_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch chunks that need embeddings (NULL embedding) for this document
    const { data: chunks, error: fetchError } = await supabase
      .from("rag_chunks")
      .select("id, content")
      .eq("document_id", document_id)
      .is("embedding", null)
      .order("chunk_index", { ascending: true })
      .range(0, batch_size - 1);

    if (fetchError) {
      throw new Error(`Failed to fetch chunks: ${fetchError.message}`);
    }

    if (!chunks || chunks.length === 0) {
      console.log(`All chunks embedded for document ${document_id}`);
      return new Response(
        JSON.stringify({
          document_id,
          status: "complete",
          message: "All chunks have embeddings",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log(`Embedding ${chunks.length} chunks for doc ${document_id} (offset ${offset})...`);

    // Process each chunk in this batch
    for (const chunk of chunks) {
      console.log(`Embedding chunk ${chunk.id}...`);
      const embedding = await generateEmbedding(chunk.content);

      const { error: updateError } = await supabase
        .from("rag_chunks")
        .update({ embedding: JSON.stringify(embedding) })
        .eq("id", chunk.id);

      if (updateError) {
        console.error(`Failed to update chunk ${chunk.id}:`, updateError);
      }
    }

    // Check if there are more chunks to process
    const { count } = await supabase
      .from("rag_chunks")
      .select("id", { count: "exact", head: true })
      .eq("document_id", document_id)
      .is("embedding", null);

    const remaining = count ?? 0;

    if (remaining > 0) {
      // Chain to next batch (fire-and-forget)
      const nextOffset = offset + batch_size;
      console.log(`${remaining} chunks remaining, triggering next batch at offset ${nextOffset}...`);

      const embedUrl = `${SUPABASE_URL}/functions/v1/rag-embed-batch`;
      fetch(embedUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ document_id, offset: nextOffset, batch_size }),
      }).catch((err) => console.error("Failed to chain rag-embed-batch:", err));
    } else {
      console.log(`All chunks embedded for document ${document_id}!`);
    }

    return new Response(
      JSON.stringify({
        document_id,
        processed: chunks.length,
        remaining,
        status: remaining > 0 ? "processing" : "complete",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("rag-embed-batch error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
