import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Embedding via Google text-embedding-004 (768 dimensions) ────────────────

async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: { parts: [{ text }] }, outputDimensionality: 768 }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Google Embedding API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.embedding.values; // 768-dimensional vector
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
    const { document_id, offset = 0, batch_size = 5 } = await req.json();

    if (!document_id) {
      return new Response(
        JSON.stringify({ error: "document_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
    if (!GOOGLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GOOGLE_API_KEY não configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch chunks that need embeddings
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
        JSON.stringify({ document_id, status: "complete", message: "All chunks have embeddings" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log(`Embedding ${chunks.length} chunks for doc ${document_id} (offset ${offset})...`);

    // Process each chunk via Google API (HTTP, no local CPU)
    for (const chunk of chunks) {
      console.log(`Embedding chunk ${chunk.id}...`);
      const embedding = await generateEmbedding(chunk.content, GOOGLE_API_KEY);

      const { error: updateError } = await supabase
        .from("rag_chunks")
        .update({ embedding: JSON.stringify(embedding) })
        .eq("id", chunk.id);

      if (updateError) {
        console.error(`Failed to update chunk ${chunk.id}:`, updateError);
      }
    }

    // Check remaining
    const { count } = await supabase
      .from("rag_chunks")
      .select("id", { count: "exact", head: true })
      .eq("document_id", document_id)
      .is("embedding", null);

    const remaining = count ?? 0;

    if (remaining > 0) {
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
      JSON.stringify({ document_id, processed: chunks.length, remaining, status: remaining > 0 ? "processing" : "complete" }),
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
