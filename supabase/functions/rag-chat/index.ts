import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Intent detection (reused from original) ─────────────────────────────────

function detectTables(msg: string): string[] {
  const m = msg.toLowerCase();
  const tables: string[] = [];

  if (
    m.includes("pep") || m.includes("orçamento") || m.includes("orcamento") ||
    m.includes("wbs") || m.includes("componente") || m.includes("produto") ||
    m.includes("subproduto") || m.includes("plano de trabalho") ||
    m.includes("execução") || m.includes("execucao")
  ) tables.push("pep_entries");

  if (
    m.includes("risco") || m.includes("ameaça") || m.includes("ameaca") ||
    m.includes("vulnerabilidade")
  ) tables.push("riscos");

  if (
    m.includes("aquisição") || m.includes("aquisicao") ||
    m.includes("contrato") || m.includes("licitação") ||
    m.includes("licitacao") || m.includes("compra") ||
    m.includes("fornecedor")
  ) tables.push("aquisicoes");

  if (
    m.includes("pmr") || m.includes("indicador") || m.includes("output") ||
    m.includes("meta") || m.includes("resultado")
  ) {
    tables.push("pmr_outputs");
    tables.push("pmr_outcomes");
  }

  if (
    m.includes("atividade") || m.includes("ação") || m.includes("acao") ||
    m.includes("tarefa")
  ) tables.push("atividades");

  if (
    m.includes("marco") || m.includes("prazo") || m.includes("cronograma") ||
    m.includes("data")
  ) tables.push("marcos");

  if (
    m.includes("ponto de atenção") || m.includes("ponto de atencao") ||
    m.includes("alerta") || m.includes("problema")
  ) tables.push("pontos_atencao");

  if (
    m.includes("não-objeção") || m.includes("nao-objecao") ||
    m.includes("aprovação bid") || m.includes("aprovacao bid")
  ) tables.push("nao_objecoes");

  return [...new Set(tables)];
}

// ── Structured data queries ─────────────────────────────────────────────────

const TABLE_QUERIES: Record<string, string> = {
  pep_entries: "ref,comp,prod,subp,pct,descricao,n_atual,o_atual,p_atual,r_base,t_base",
  riscos: "*",
  aquisicoes: "*",
  pmr_outputs: "*",
  pmr_outcomes: "*",
  atividades: "*",
  marcos: "*",
  pontos_atencao: "*",
  nao_objecoes: "*",
};

const TABLE_LIMITS: Record<string, number> = {
  pep_entries: 80,
  riscos: 30,
  aquisicoes: 50,
  pmr_outputs: 30,
  pmr_outcomes: 30,
  atividades: 40,
  marcos: 20,
  pontos_atencao: 20,
  nao_objecoes: 20,
};

async function fetchStructuredContext(
  supabase: any,
  tables: string[],
): Promise<Record<string, unknown>> {
  const context: Record<string, unknown> = {};
  await Promise.all(
    tables.map(async (table) => {
      try {
        let query = supabase
          .from(table)
          .select(TABLE_QUERIES[table] ?? "*")
          .limit(TABLE_LIMITS[table] ?? 30);

        if (table === "pep_entries") query = query.eq("versao", "v2");
        if (table === "riscos") query = query.order("nivel", { ascending: false });
        if (table === "marcos") query = query.order("data_marco", { ascending: true });

        const { data, error } = await query;
        context[table] = error
          ? { error: error.message }
          : { total: data?.length ?? 0, amostra: (data ?? []).slice(0, 15) };
      } catch (e) {
        context[table] = { error: String(e) };
      }
    }),
  );
  return context;
}

// ── Embedding generation via Supabase built-in gte-small ────────────────────

async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const model = new Supabase.ai.Session("gte-small");
    const output = await model.run(text, {
      mean_pool: true,
      normalize: true,
    });
    return Array.from(output as Float32Array);
  } catch (e) {
    console.error("Embedding generation failed:", e);
    return null;
  }
}

// ── Semantic search ─────────────────────────────────────────────────────────

async function semanticSearch(
  supabase: any,
  embedding: number[],
  matchCount = 8,
  threshold = 0.3,
): Promise<{ chunks: any[]; sources: any[] }> {
  const { data, error } = await supabase.rpc("match_chunks", {
    query_embedding: JSON.stringify(embedding),
    match_threshold: threshold,
    match_count: matchCount,
  });

  if (error || !data?.length) {
    return { chunks: [], sources: [] };
  }

  // Fetch document info for sources
  const docIds = [...new Set(data.map((c: any) => c.document_id))];
  const { data: docs } = await supabase
    .from("rag_documents")
    .select("id, title, source_type, source_url")
    .in("id", docIds) as { data: any[] | null };

  const docMap = new Map((docs ?? []).map((d: any) => [d.id, d]));

  const sources = docIds.map((id: any) => {
    const doc = docMap.get(id);
    return doc
      ? { title: doc.title, type: doc.source_type, url: doc.source_url }
      : { title: "Desconhecido", type: "manual", url: null };
  });

  return { chunks: data, sources };
}

// ── System prompt builder ───────────────────────────────────────────────────

function buildSystemPrompt(
  ragChunks: any[],
  structuredContext: Record<string, unknown>,
): string {
  const ragSection = ragChunks.length > 0
    ? `\n════════════════════════════════════════════════════
DOCUMENTOS RECUPERADOS (RAG - busca semântica):
════════════════════════════════════════════════════
${ragChunks.map((c, i) => `[Trecho ${i + 1}] (similaridade: ${(c.similarity * 100).toFixed(0)}%)\n${c.content}`).join("\n\n")}`
    : "";

  const structuredSection = Object.keys(structuredContext).length > 0
    ? `\n════════════════════════════════════════════════════
DADOS ESTRUTURADOS DO BANCO DE DADOS:
════════════════════════════════════════════════════
${JSON.stringify(structuredContext, null, 2)}`
    : "";

  return `Você é o Assistente de Dados do programa POA+SOCIAL BID, um programa de desenvolvimento urbano em Porto Alegre - RS.

Responda perguntas sobre o programa com base nos DADOS FIXOS, nos DOCUMENTOS RECUPERADOS (RAG) e nos DADOS ESTRUTURADOS abaixo.
Seja conciso e objetivo. Use valores numéricos quando relevante.
Cite as fontes dos dados quando usar dados dos documentos RAG.
Responda SEMPRE em português brasileiro.
Formate suas respostas usando Markdown (negrito, tabelas, listas).

════════════════════════════════════════════════════
DADOS FIXOS DO PROGRAMA
════════════════════════════════════════════════════
- Nome oficial: Programa POA+SOCIAL
- Número do contrato / operação BID: BR-L1597
- Mutuário: Prefeitura Municipal de Porto Alegre (PMPA)
- Financiador: Banco Interamericano de Desenvolvimento (BID)
- Valor total do programa: R$ 725,9 milhões (US$ 132 milhões)
- Taxa de câmbio de referência: R$ 5,50 por US$
- Componentes:
    C1 — Interoperabilidade e Transformação Digital: US$ 27 milhões
    C2 — Reabilitação Urbana e Habitação: US$ 130 milhões
    C3 — Administração e Gestão: US$ 4 milhões
- Secretarias executoras: SMPG, SMOI, ASD, SMS, SMAS, SMED
- Unidade de Gestão do Projeto (UGP): coordenada pela SMPG
- Interlocutores BID: Marcelo Alfaro (especialista líder), Gabriela Couto (analista)
- Interlocutor PMPA / UGP: Neusa Kempfer
- Período de execução: 2024–2029 (com encerramento operacional — EOP)
- Modalidade: Empréstimo de Investimento Específico (EIE)
${ragSection}
${structuredSection}

REGRAS IMPORTANTES:
- Para perguntas sobre dados fixos, responda diretamente
- Para perguntas operacionais, use os dados dinâmicos e documentos RAG
- Quando usar informações de documentos RAG, indique a fonte
- Se os dados dinâmicos estiverem vazios, informe que os registros ainda não foram cadastrados
- Nunca invente dados que não estejam no contexto
- Valores financeiros: use formato US$ X.XXX.XXX ou R$ X.XXX.XXX
- Máximo 4 parágrafos por resposta
- Listas e tabelas Markdown são bem-vindas
- Não mencione limitações técnicas ao usuário`;
}

// ── Claude API call ─────────────────────────────────────────────────────────

async function callClaude(
  systemPrompt: string,
  conversationMessages: Array<{ role: string; content: string }>,
  apiKey: string,
): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: systemPrompt,
      messages: conversationMessages.map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      })),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text ?? "Sem resposta do assistente.";
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
    const { message, conversation_id } = await req.json();

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Campo 'message' é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY não configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Load existing conversation or create new
    let conversationMessages: Array<{ role: string; content: string }> = [];
    let convId = conversation_id;

    if (convId) {
      const { data: conv } = await supabase
        .from("chat_conversations")
        .select("messages")
        .eq("id", convId)
        .single();
      if (conv?.messages) {
        conversationMessages = conv.messages as any[];
      }
    }

    // Add user message to history
    conversationMessages.push({ role: "user", content: message });

    // 2. Generate embedding for semantic search
    let ragChunks: any[] = [];
    let ragSources: any[] = [];

    const embedding = await generateEmbedding(message);
    if (embedding) {
      const result = await semanticSearch(supabase, embedding);
      ragChunks = result.chunks;
      ragSources = result.sources;
    }

    // 3. Detect intent and fetch structured data
    const tables = detectTables(message);
    const structuredContext = tables.length > 0
      ? await fetchStructuredContext(supabase, tables)
      : {};

    // 4. Build prompt and call Claude
    const systemPrompt = buildSystemPrompt(ragChunks, structuredContext);

    // Only send last 10 messages for context window management
    const recentMessages = conversationMessages.slice(-10);
    const answer = await callClaude(systemPrompt, recentMessages, ANTHROPIC_API_KEY);

    // 5. Save conversation
    conversationMessages.push({ role: "assistant", content: answer });

    if (convId) {
      await supabase
        .from("chat_conversations")
        .update({ messages: conversationMessages, updated_at: new Date().toISOString() })
        .eq("id", convId);
    } else {
      const { data: newConv } = await supabase
        .from("chat_conversations")
        .insert({
          messages: conversationMessages,
          title: message.slice(0, 100),
        })
        .select("id")
        .single();
      convId = newConv?.id;
    }

    // 6. Merge sources from RAG + structured tables
    const allSources = [
      ...ragSources,
      ...tables.map((t) => ({ title: t, type: "database", url: null })),
    ];

    return new Response(
      JSON.stringify({ answer, sources: allSources, conversation_id: convId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("RAG chat error:", err);
    return new Response(
      JSON.stringify({
        answer: "Não foi possível processar sua pergunta. Tente novamente em alguns instantes.",
        error: String(err),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
