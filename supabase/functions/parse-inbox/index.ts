import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Claude API ───────────────────────────────────────────────────────────────

async function callClaude(
  systemPrompt: string,
  userText: string,
  apiKey: string
): Promise<string> {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userText }],
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Claude API error ${resp.status}: ${err}`);
  }

  const data = await resp.json();
  return data.content?.[0]?.text ?? "[]";
}

// ── Extraction prompt ────────────────────────────────────────────────────────

const EXTRACTION_PROMPT = `Você é especialista em gestão de projetos de financiamento externo (BID/Banco Mundial).

Analise o texto fornecido e extraia TODOS os itens acionáveis identificados: ações a tomar, decisões tomadas, pendências, alertas e informações relevantes que demandam acompanhamento.

Para cada item extraído, retorne um objeto JSON com os seguintes campos:
- tipo: "acao" | "decisao" | "pendencia" | "informacao" | "alerta"
  (acao = algo que alguém precisa fazer; decisao = algo que foi decidido; pendencia = item aguardando resolução; alerta = risco ou problema identificado; informacao = contexto relevante)
- titulo: string (máximo 100 caracteres, começa com verbo no infinitivo: "Enviar...", "Verificar...", "Elaborar...")
- descricao: string ou null (contexto adicional que enriquece o título)
- responsavel: string ou null (nome ou área responsável, null se não identificado no texto)
- prazo: string (formato YYYY-MM-DD se uma data for mencionada, null caso contrário)
- prioridade: "Alta" | "Media" | "Baixa"
  (Alta = urgente/crítico/atrasado; Baixa = informacional/sem urgência)
- contexto_original: string (trecho exato ou próximo do texto original que originou este item — máximo 300 caracteres)

Regras:
1. Extraia TODOS os itens acionáveis, mesmo que implícitos
2. Se houver datas relativas ("semana que vem", "próxima terça"), converta para data absoluta considerando hoje como ${new Date().toISOString().split("T")[0]}
3. Não invente informações — use apenas o que está no texto
4. Retorne APENAS um array JSON válido, sem texto adicional, sem markdown, sem explicações

Contexto do programa: BR-L1597 POA+SOCIAL BID, Porto Alegre, RS. Executores: SMPG, SMOI, ASD, SMS, SMAS, SMED. Interlocutores BID: Marcelo Alfaro, Gabriela Couto. UGP: Neusa Kempfer.`;

// ── Helpers ──────────────────────────────────────────────────────────────────

interface ExtractedDemanda {
  tipo: string;
  titulo: string;
  descricao: string | null;
  responsavel: string | null;
  prazo: string | null;
  prioridade: string;
  contexto_original: string | null;
}

function parseExtracted(raw: string): ExtractedDemanda[] {
  // Remove possíveis blocos markdown antes de parsear
  const cleaned = raw
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Tenta encontrar array JSON dentro do texto
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return [];
      }
    }
    return [];
  }
}

// ── Handler principal ─────────────────────────────────────────────────────────

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
    const body = await req.json();

    const {
      texto,
      tipo_fonte = "outro",
      titulo = null,
      autor_fonte = null,
      data_fonte = null,
      salvar = true,
      projeto = "BR-L1597",
    } = body;

    if (!texto || typeof texto !== "string" || texto.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "Campo 'texto' obrigatório (mínimo 10 caracteres)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY não configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ── Chamar Claude para extrair demandas ─────────────────────────────────
    const rawResponse = await callClaude(EXTRACTION_PROMPT, texto.trim(), ANTHROPIC_API_KEY);
    const demandas_extraidas = parseExtracted(rawResponse);

    if (!salvar) {
      // Apenas retorna a prévia sem salvar
      return new Response(
        JSON.stringify({
          captura_id: null,
          demandas_extraidas,
          total: demandas_extraidas.length,
          salvo: false,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Salvar captura ──────────────────────────────────────────────────────
    const { data: capturaData, error: capturaError } = await supabase
      .from("inbox_capturas")
      .insert({
        tipo_fonte,
        titulo,
        texto_bruto: texto.trim(),
        autor_fonte,
        data_fonte: data_fonte || null,
        processado: demandas_extraidas.length > 0,
        demandas_geradas: demandas_extraidas.length,
        projeto,
      })
      .select("id")
      .single();

    if (capturaError) throw capturaError;
    const captura_id = capturaData.id;

    // ── Salvar demandas extraídas ───────────────────────────────────────────
    let demandas_salvas = 0;
    if (demandas_extraidas.length > 0) {
      const rows = demandas_extraidas.map((d) => ({
        inbox_captura_id: captura_id,
        tipo: d.tipo ?? "acao",
        titulo: d.titulo ?? "(sem título)",
        descricao: d.descricao ?? null,
        responsavel: d.responsavel ?? null,
        prazo: d.prazo ?? null,
        prioridade: d.prioridade ?? "Media",
        status: "aberta",
        fonte_tipo: tipo_fonte,
        fonte_descricao: titulo ?? `${tipo_fonte} ${data_fonte ?? ""}`.trim(),
        data_fonte: data_fonte ?? null,
        contexto_original: d.contexto_original ?? null,
        projeto,
        extraido_por_ia: true,
      }));

      // Inserir em lotes de 50
      const BATCH = 50;
      for (let i = 0; i < rows.length; i += BATCH) {
        const { error: insertError } = await supabase
          .from("demandas")
          .insert(rows.slice(i, i + BATCH));
        if (insertError) throw insertError;
        demandas_salvas += Math.min(BATCH, rows.length - i);
      }
    }

    // ── Logar no sync_log ───────────────────────────────────────────────────
    await supabase.from("sync_log").insert({
      tabela_destino: "demandas",
      fonte: "parse-inbox",
      registros_lidos: 1,
      registros_inseridos: demandas_salvas,
      status: "ok",
      executado_por: "edge-function",
    });

    return new Response(
      JSON.stringify({
        captura_id,
        demandas_extraidas,
        total: demandas_extraidas.length,
        salvo: true,
        demandas_salvas,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("parse-inbox error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
