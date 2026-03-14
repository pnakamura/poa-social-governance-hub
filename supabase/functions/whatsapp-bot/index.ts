import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface EvolutionWebhook {
  event: string;
  instance: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    pushName?: string;
    message?: {
      conversation?: string;
      extendedTextMessage?: { text: string };
      imageMessage?: { caption?: string };
    };
    messageTimestamp: number;
    participant?: string; // presente em grupos
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractText(data: EvolutionWebhook["data"]): string | null {
  return (
    data.message?.conversation ??
    data.message?.extendedTextMessage?.text ??
    data.message?.imageMessage?.caption ??
    null
  );
}

function isGroup(jid: string): boolean {
  return jid.endsWith("@g.us");
}

function formatForWhatsApp(text: string): string {
  // Converte Markdown para formato WhatsApp
  return text
    .replace(/\*\*(.+?)\*\*/g, "*$1*")   // **bold** → *bold*
    .replace(/#{1,6}\s+(.+)/g, "*$1*")    // ## Header → *Header*
    .replace(/`([^`]+)`/g, "_$1_")         // `code` → _code_
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [text](url) → text
    .trim();
}

// ── Supabase helpers ──────────────────────────────────────────────────────────

// deno-lint-ignore no-explicit-any
type SupabaseClient = ReturnType<typeof createClient<any>>;

async function getOrCreateSession(
  supabase: SupabaseClient,
  phone: string,
  pushName: string | undefined
) {
  const { data } = await supabase
    .from("whatsapp_sessions")
    .select("*")
    .eq("phone", phone)
    .maybeSingle();

  if (data) {
    await supabase
      .from("whatsapp_sessions")
      .update({
        ultima_mensagem: new Date().toISOString(),
        push_name: pushName ?? data.push_name,
      })
      .eq("phone", phone);
    return data;
  }

  const { data: created } = await supabase
    .from("whatsapp_sessions")
    .insert({ phone, push_name: pushName, autorizado: false })
    .select()
    .single();

  return created;
}

async function checkGroupAuthorized(
  supabase: SupabaseClient,
  groupJid: string
): Promise<{ autorizado: boolean; mencionar_apenas: boolean } | null> {
  const { data } = await supabase
    .from("whatsapp_grupos")
    .select("autorizado, mencionar_apenas")
    .eq("group_jid", groupJid)
    .maybeSingle();
  return data;
}

// ── Evolution API ─────────────────────────────────────────────────────────────

async function sendMessage(
  to: string,
  text: string,
  evolutionUrl: string,
  evolutionKey: string,
  instanceName: string
): Promise<void> {
  try {
    await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: evolutionKey,
      },
      body: JSON.stringify({ number: to, textMessage: { text } }),
    });
  } catch (e) {
    console.error("sendMessage error:", e);
  }
}

// ── Supabase Edge Function calls ──────────────────────────────────────────────

async function callRagChat(
  message: string,
  conversationId: string | null,
  supabaseUrl: string,
  supabaseKey: string
): Promise<{ answer: string; conversation_id: string }> {
  const resp = await fetch(`${supabaseUrl}/functions/v1/rag-chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({ message, conversation_id: conversationId }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`rag-chat ${resp.status}: ${err}`);
  }

  return resp.json();
}

async function callParseInbox(
  texto: string,
  autor: string,
  supabaseUrl: string,
  supabaseKey: string
): Promise<number> {
  const resp = await fetch(`${supabaseUrl}/functions/v1/parse-inbox`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({
      texto,
      tipo_fonte: "whatsapp",
      autor_fonte: autor,
      salvar: true,
    }),
  });

  if (!resp.ok) return 0;
  const data = await resp.json();
  return data.total ?? 0;
}

// ── Comandos estruturados ─────────────────────────────────────────────────────

async function handleCommand(
  command: string,
  supabase: SupabaseClient
): Promise<string> {
  const cmd = command.toLowerCase().trim();

  if (cmd === "/help") {
    return [
      "🤖 *Assistente POA+SOCIAL BID — BR-L1597*",
      "",
      "Comandos disponíveis:",
      "• */status* — Resumo executivo do programa",
      "• */riscos* — Riscos críticos e altos",
      "• */pendencias* — Demandas em aberto",
      "• */marcos* — Próximos marcos do cronograma",
      "• */help* — Esta mensagem",
      "",
      "Ou envie qualquer *pergunta* sobre o programa.",
      "",
      "Para registrar uma ação:",
      "*capturar: <texto>*",
    ].join("\n");
  }

  if (cmd === "/status") {
    const [riscosRes, demandasRes, marcosRes] = await Promise.all([
      supabase.from("riscos").select("nivel").neq("nivel", "baixo").neq("nivel", "Baixo"),
      supabase
        .from("demandas")
        .select("status, prioridade")
        .in("status", ["aberta", "em_andamento"]),
      supabase
        .from("marcos")
        .select("titulo, data_prevista")
        .eq("status", "pendente")
        .order("data_prevista")
        .limit(1),
    ]);

    const totalRiscos = riscosRes.data?.length ?? 0;
    const totalDemandas = demandasRes.data?.length ?? 0;
    const demandasAlta =
      demandasRes.data?.filter((d) => d.prioridade === "Alta").length ?? 0;
    const proximoMarco = marcosRes.data?.[0];

    return [
      "📊 *Status POA+SOCIAL BID — BR-L1597*",
      "",
      `🔴 Riscos críticos/altos: *${totalRiscos}*`,
      `📋 Demandas abertas: *${totalDemandas}* (${demandasAlta} alta prioridade)`,
      `📅 Próximo marco: ${
        proximoMarco
          ? `*${proximoMarco.titulo}* (${proximoMarco.data_prevista})`
          : "N/A"
      }`,
    ].join("\n");
  }

  if (cmd === "/riscos") {
    const { data } = await supabase
      .from("riscos")
      .select("descricao, nivel, probabilidade, impacto")
      .in("nivel", ["crítico", "critico", "alto", "Crítico", "Critico", "Alto"])
      .order("nivel")
      .limit(5);

    if (!data || data.length === 0) {
      return "✅ Nenhum risco crítico ou alto identificado no momento.";
    }

    const lista = data
      .map(
        (r, i) =>
          `${i + 1}. *${r.descricao}*\n   Nível: ${r.nivel} | P: ${r.probabilidade} × I: ${r.impacto}`
      )
      .join("\n\n");

    return `⚠️ *Riscos Críticos/Altos — BR-L1597*\n\n${lista}`;
  }

  if (cmd === "/pendencias") {
    const hoje = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("demandas")
      .select("titulo, responsavel, prazo, prioridade")
      .in("status", ["aberta", "em_andamento"])
      .order("prazo", { ascending: true, nullsFirst: false })
      .limit(5);

    if (!data || data.length === 0) {
      return "✅ Sem demandas pendentes no momento.";
    }

    const lista = data
      .map((d, i) => {
        const atrasado = d.prazo && d.prazo < hoje ? " ⏰" : "";
        return `${i + 1}. *${d.titulo}*${atrasado}\n   ${d.responsavel ?? "Resp. N/A"} | Prazo: ${d.prazo ?? "N/D"} | ${d.prioridade}`;
      })
      .join("\n\n");

    return `📋 *Demandas em Aberto — BR-L1597*\n\n${lista}`;
  }

  if (cmd === "/marcos") {
    const { data } = await supabase
      .from("marcos")
      .select("titulo, data_prevista, tipo")
      .eq("status", "pendente")
      .order("data_prevista")
      .limit(3);

    if (!data || data.length === 0) {
      return "📅 Nenhum marco pendente encontrado.";
    }

    const lista = data
      .map((m, i) => `${i + 1}. *${m.titulo}*\n   📅 ${m.data_prevista} | ${m.tipo}`)
      .join("\n\n");

    return `📅 *Próximos Marcos — BR-L1597*\n\n${lista}`;
  }

  return "Comando não reconhecido. Envie */help* para ver os comandos disponíveis.";
}

// ── Handler principal ─────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: EvolutionWebhook = await req.json();

    // Só processa eventos de mensagem recebida
    if (body.event !== "MESSAGES_UPSERT" || body.data?.key?.fromMe) {
      return new Response("ok", { status: 200 });
    }

    const text = extractText(body.data);
    if (!text || text.trim().length === 0) {
      return new Response("ok", { status: 200 });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
    const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");
    const EVOLUTION_INSTANCE_NAME =
      Deno.env.get("EVOLUTION_INSTANCE_NAME") ?? "poa-social";

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
      console.error("EVOLUTION_API_URL ou EVOLUTION_API_KEY não configuradas");
      return new Response(
        JSON.stringify({ error: "Evolution API não configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const remoteJid = body.data.key.remoteJid;
    const fromGroup = isGroup(remoteJid);
    const senderJid = fromGroup
      ? (body.data.participant ?? remoteJid)
      : remoteJid;
    const senderPhone = senderJid
      .replace("@s.whatsapp.net", "")
      .replace("@g.us", "");
    const pushName = body.data.pushName ?? senderPhone;

    // ── Verificar autorização ────────────────────────────────────────────────
    if (fromGroup) {
      const grupo = await checkGroupAuthorized(supabase, remoteJid);
      if (!grupo || !grupo.autorizado) {
        // Grupo não autorizado — ignorar silenciosamente
        return new Response("ok", { status: 200 });
      }
    } else {
      const session = await getOrCreateSession(supabase, senderPhone, pushName);
      if (!session?.autorizado) {
        await sendMessage(
          senderPhone,
          "⚠️ Contato não autorizado para acessar o Assistente POA+SOCIAL BID.\n\nSolicite acesso à equipe UGP (Neusa Kempfer).",
          EVOLUTION_API_URL,
          EVOLUTION_API_KEY,
          EVOLUTION_INSTANCE_NAME
        );
        return new Response("ok", { status: 200 });
      }
    }

    // ── Obter sessão do remetente ────────────────────────────────────────────
    const session = await getOrCreateSession(supabase, senderPhone, pushName);

    // ── Roteamento ───────────────────────────────────────────────────────────
    const trimmed = text.trim();
    let responseText: string;

    if (trimmed.startsWith("/")) {
      // Comandos estruturados (ex: /help, /status, /riscos...)
      responseText = await handleCommand(trimmed.split(" ")[0], supabase);
    } else if (/^capturar:\s*/i.test(trimmed)) {
      // Captura de texto → parse-inbox
      const conteudo = trimmed.replace(/^capturar:\s*/i, "").trim();
      if (conteudo.length < 10) {
        responseText =
          "⚠️ Texto muito curto para capturar. Descreva mais detalhes após *capturar:*";
      } else {
        const total = await callParseInbox(
          conteudo,
          pushName,
          SUPABASE_URL,
          SUPABASE_SERVICE_ROLE_KEY
        );
        responseText =
          total > 0
            ? `✅ Captura registrada! *${total} demanda(s)* extraída(s) pelo assistente.\n\nVeja em: /demandas no app de governança.`
            : "✅ Captura registrada! Texto salvo no inbox para revisão.";
      }
    } else {
      // Pergunta livre → rag-chat com histórico de conversa
      const result = await callRagChat(
        trimmed,
        session?.conversation_id ?? null,
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY
      );

      // Persistir conversation_id para manter contexto nas próximas mensagens
      if (
        result.conversation_id &&
        result.conversation_id !== session?.conversation_id
      ) {
        await supabase
          .from("whatsapp_sessions")
          .update({ conversation_id: result.conversation_id })
          .eq("phone", senderPhone);
      }

      responseText = formatForWhatsApp(result.answer);
    }

    // ── Enviar resposta via Evolution API ────────────────────────────────────
    // Em grupos: enviar para o JID do grupo; em DM: enviar para o número
    const destination = fromGroup ? remoteJid : senderPhone;
    await sendMessage(
      destination,
      responseText,
      EVOLUTION_API_URL,
      EVOLUTION_API_KEY,
      EVOLUTION_INSTANCE_NAME
    );

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("whatsapp-bot error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
