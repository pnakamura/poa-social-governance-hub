import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Intent detection ────────────────────────────────────────────────────────

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

  // Fallback
  if (tables.length === 0) {
    tables.push("pep_entries", "riscos");
  }

  return [...new Set(tables)];
}

// ── Supabase queries ────────────────────────────────────────────────────────

const TABLE_QUERIES: Record<string, string> = {
  pep_entries:
    "ref,comp,prod,subp,pct,descricao,n_atual,o_atual,p_atual,r_base,t_base",
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

async function fetchContext(
  supabase: ReturnType<typeof createClient>,
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

        if (table === "pep_entries") {
          query = query.eq("versao", "v2");
        }
        if (table === "riscos") {
          query = query.order("nivel", { ascending: false });
        }
        if (table === "marcos") {
          query = query.order("data_prevista", { ascending: true });
        }

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

// ── Claude API call ─────────────────────────────────────────────────────────

async function callClaude(
  systemPrompt: string,
  userMessage: string,
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
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text ?? "Sem resposta do assistente.";
}

// ── System prompt ───────────────────────────────────────────────────────────

function buildSystemPrompt(context: Record<string, unknown>): string {
  const contextJson = JSON.stringify(context, null, 2);
  return `Você é o Assistente de Dados do programa POA+SOCIAL BID (BR-L1597), um programa de desenvolvimento urbano em Porto Alegre - RS.

Responda perguntas sobre o programa com base EXCLUSIVAMENTE nos dados reais fornecidos abaixo.
Seja conciso e objetivo. Use valores numéricos quando relevante.
Cite as fontes dos dados (tabela e ids quando disponíveis).
Responda SEMPRE em português brasileiro.

INFORMAÇÕES DO PROGRAMA:
- Valor total: R$ 725,9M (US$ 132M) | Taxa de câmbio: R$ 5,50/US$
- Componentes: C1-Interoperabilidade (US$27M), C2-Reabilitação (US$130M), C3-Admin (US$4M)
- Executores: SMPG, SMOI, ASD, SMS, SMAS, SMED
- Interlocutores BID: Marcelo Alfaro, Gabriela Couto

DADOS ATUAIS DO PROGRAMA:
${contextJson}

REGRAS IMPORTANTES:
- Nunca invente dados que não estejam no contexto acima
- Se não tiver dados suficientes, diga: "Não tenho dados suficientes sobre isso no momento"
- Valores financeiros: use formato US$ X.XXX.XXX ou R$ X.XXX.XXX
- Máximo 3 parágrafos por resposta
- Listas são bem-vindas para comparações
- Não mencione limitações técnicas ou detalhes do sistema ao usuário`;
}

// ── Main handler ────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // CORS preflight
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
    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Campo 'message' é obrigatório" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Credenciais via Supabase Secrets (supabase secrets set ANTHROPIC_API_KEY=...)
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({
          error:
            "ANTHROPIC_API_KEY não configurada. Execute: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Cliente Supabase com service role (acesso total, server-side only)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Detectar tabelas relevantes
    const tables = detectTables(message);

    // 2. Buscar contexto
    const context = await fetchContext(supabase, tables);

    // 3. Montar prompt e chamar Claude
    const systemPrompt = buildSystemPrompt(context);
    const answer = await callClaude(systemPrompt, message, ANTHROPIC_API_KEY);

    return new Response(
      JSON.stringify({ answer, sources: tables }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("Chat webhook error:", err);
    return new Response(
      JSON.stringify({
        answer:
          "Não foi possível processar sua pergunta. Tente novamente em alguns instantes.",
        error: String(err),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
