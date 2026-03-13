import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SPREADSHEET_ID = "1zk6KJCvbr7HKlDYIAIDKDBCyZ_rR3ZW2Kck1gYqrQyY";

// ── CSV helpers ────────────────────────────────────────────────────────────

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(current.trim());
        current = "";
      } else if (ch === "\n" || (ch === "\r" && text[i + 1] === "\n")) {
        row.push(current.trim());
        rows.push(row);
        row = [];
        current = "";
        if (ch === "\r") i++;
      } else {
        current += ch;
      }
    }
  }
  if (current || row.length > 0) {
    row.push(current.trim());
    rows.push(row);
  }
  return rows;
}

function normalizeBrNum(v: string): string {
  let s = v.replace(/[^\d.,-]/g, "").trim();
  if (!s) return "";
  const commas = (s.match(/,/g) || []).length;
  const dots = (s.match(/\./g) || []).length;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");

  if (dots > 1 && commas === 0) s = s.replace(/\./g, "");
  else if (commas > 1 && dots === 0) s = s.replace(/,/g, "");
  else if (dots === 1 && commas === 0) {
    if (s.substring(lastDot + 1).length === 3) s = s.replace(".", "");
  } else if (lastComma > lastDot) s = s.replace(/\./g, "").replace(",", ".");
  else s = s.replace(/,/g, "");
  return s;
}

function numOrNull(v: string): number | null {
  if (!v) return null;
  const s = normalizeBrNum(v);
  if (!s) return null;
  const n = Number(s);
  return isNaN(n) ? null : n;
}

function txt(v: string): string | null {
  const s = (v ?? "").trim();
  return s || null;
}

async function fetchSheet(sheetName: string): Promise<string[][]> {
  const csvUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  console.log(`Fetching: ${csvUrl}`);
  const resp = await fetch(csvUrl);
  if (!resp.ok) throw new Error(`Fetch ${sheetName} failed: ${resp.status}`);
  return parseCSV(await resp.text());
}

// ── Main handler ──────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const client = createClient(supabaseUrl, supabaseKey);

    const results: Record<string, { read: number; upserted: number }> = {};

    // ── PMR-Outputs (data starts at row 5 = index 4) ──
    const outputRows = await fetchSheet("PMR-Outputs");
    console.log(`PMR-Outputs: ${outputRows.length} total rows`);

    const outputRecords: Record<string, unknown>[] = [];
    for (let i = 4; i < outputRows.length; i++) {
      const row = outputRows[i];
      const codigo = txt(row[1]); // col B
      if (!codigo) continue;

      outputRecords.push({
        codigo,
        descricao: txt(row[2]),       // col C
        unidade: txt(row[3]),         // col D
        linha_base: numOrNull(row[4]),// col E
        componente: txt(row[5]),      // col F
        produto: txt(row[6]),         // col G
        meta_periodo: numOrNull(row[7]),  // col H
        meta_contrato: numOrNull(row[12]),// col M
        // realizado and pct_realizado are NOT included — preserves manual edits
      });
    }

    for (let i = 0; i < outputRecords.length; i += 50) {
      const batch = outputRecords.slice(i, i + 50);
      const { error } = await client
        .from("pmr_outputs")
        .upsert(batch, { onConflict: "codigo", ignoreDuplicates: false });
      if (error) throw new Error(`Upsert pmr_outputs failed: ${error.message}`);
    }

    results.outputs = { read: outputRecords.length, upserted: outputRecords.length };
    console.log(`✅ PMR-Outputs: ${outputRecords.length} upserted`);

    // ── PMR-Outcomes (data starts at row 6 = index 5) ──
    const outcomeRows = await fetchSheet("PMR-Outcomes");
    console.log(`PMR-Outcomes: ${outcomeRows.length} total rows`);

    const outcomeRecords: Record<string, unknown>[] = [];
    for (let i = 5; i < outcomeRows.length; i++) {
      const row = outcomeRows[i];
      const codigo = txt(row[1]); // col B
      if (!codigo) continue;

      outcomeRecords.push({
        codigo,
        objetivo: txt(row[2]),        // col C
        descricao: txt(row[3]),       // col D
        unidade: txt(row[4]),         // col E
        linha_base: numOrNull(row[5]),// col F
        componente: txt(row[6]),      // col G
        meta_contrato: numOrNull(row[12]),// col M
        fonte_dados: txt(row[13]),    // col N
        // realizado and pct_realizado are NOT included — preserves manual edits
      });
    }

    for (let i = 0; i < outcomeRecords.length; i += 50) {
      const batch = outcomeRecords.slice(i, i + 50);
      const { error } = await client
        .from("pmr_outcomes")
        .upsert(batch, { onConflict: "codigo", ignoreDuplicates: false });
      if (error) throw new Error(`Upsert pmr_outcomes failed: ${error.message}`);
    }

    results.outcomes = { read: outcomeRecords.length, upserted: outcomeRecords.length };
    console.log(`✅ PMR-Outcomes: ${outcomeRecords.length} upserted`);

    // ── Log ──
    await client.from("sync_log").insert({
      tabela_destino: "pmr_outputs,pmr_outcomes",
      fonte: `google_sheets:${SPREADSHEET_ID}`,
      registros_lidos: outputRecords.length + outcomeRecords.length,
      registros_inseridos: outputRecords.length + outcomeRecords.length,
      registros_atualizados: 0,
      registros_erro: 0,
      status: "ok",
      executado_por: "edge_function:sync-pmr-sheets",
    });

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Sync PMR error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";

    try {
      const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      await client.from("sync_log").insert({
        tabela_destino: "pmr_outputs,pmr_outcomes",
        fonte: `google_sheets:${SPREADSHEET_ID}`,
        status: "erro",
        mensagem_erro: msg,
        executado_por: "edge_function:sync-pmr-sheets",
      });
    } catch (_) { /* ignore */ }

    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
