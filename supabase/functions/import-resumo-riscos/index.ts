import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RowData {
  codigo_wbs: string;
  resumo_executivo: string;
  titulo_risco: string;
  probabilidade: string;
  impacto: string;
  mitigacao: string;
  status: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rows } = (await req.json()) as { rows: RowData[] };
    if (!rows?.length) throw new Error("No rows provided");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const client = createClient(supabaseUrl, supabaseKey);

    // 1. Get WBS -> ID mapping
    const { data: entries, error: fetchErr } = await client
      .from("pep_entries")
      .select("id, codigo_wbs")
      .eq("versao", "v2")
      .not("codigo_wbs", "is", null);
    if (fetchErr) throw fetchErr;

    const wbsMap = new Map<string, string>();
    for (const e of entries ?? []) {
      if (e.codigo_wbs) wbsMap.set(e.codigo_wbs, e.id);
    }

    // 2. Group by WBS: update resumo, collect risks
    const resumoMap = new Map<string, string>();
    const risks: { pep_entry_id: string; titulo_risco: string; probabilidade: string; impacto: string; mitigacao: string; status: string }[] = [];

    let skippedWbs = 0;
    for (const row of rows) {
      const entryId = wbsMap.get(row.codigo_wbs);
      if (!entryId) {
        skippedWbs++;
        continue;
      }

      // Set resumo (same for all rows of same WBS)
      if (row.resumo_executivo && !resumoMap.has(row.codigo_wbs)) {
        resumoMap.set(row.codigo_wbs, row.resumo_executivo);
      }

      // Add risk
      if (row.titulo_risco) {
        risks.push({
          pep_entry_id: entryId,
          titulo_risco: row.titulo_risco,
          probabilidade: row.probabilidade || "Média",
          impacto: row.impacto || "Médio",
          mitigacao: row.mitigacao || null as any,
          status: ["Ativo", "Mitigado", "Aceito", "Eliminado"].includes(row.status) ? row.status : "Ativo",
        });
      }
    }

    // 3. Update resumo_executivo
    let resumoUpdated = 0;
    for (const [wbs, resumo] of resumoMap) {
      const entryId = wbsMap.get(wbs)!;
      const { error } = await client
        .from("pep_entries")
        .update({ resumo_executivo: resumo })
        .eq("id", entryId);
      if (!error) resumoUpdated++;
      else console.error(`Failed to update resumo for ${wbs}:`, error.message);
    }

    // 4. Delete existing pep_riscos for affected entries, then insert new
    const affectedEntryIds = [...new Set(risks.map(r => r.pep_entry_id))];
    
    if (affectedEntryIds.length > 0) {
      // Delete in batches
      for (let i = 0; i < affectedEntryIds.length; i += 50) {
        const batch = affectedEntryIds.slice(i, i + 50);
        await client.from("pep_riscos").delete().in("pep_entry_id", batch);
      }
    }

    // 5. Insert risks in batches
    let risksInserted = 0;
    for (let i = 0; i < risks.length; i += 50) {
      const batch = risks.slice(i, i + 50);
      const { error } = await client.from("pep_riscos").insert(batch);
      if (error) {
        console.error(`Insert risks batch error at ${i}:`, error.message);
      } else {
        risksInserted += batch.length;
      }
    }

    const result = {
      success: true,
      resumo_updated: resumoUpdated,
      risks_inserted: risksInserted,
      risks_total: risks.length,
      skipped_wbs: skippedWbs,
      unique_wbs_found: resumoMap.size,
    };
    console.log("Import result:", JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Import error:", msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
