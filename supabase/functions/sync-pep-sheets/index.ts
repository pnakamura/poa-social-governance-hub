import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SPREADSHEET_ID = "1C6uIqjqwpgToNWm3YqliqKzb2gPb8cHC";
const SHEET_NAME = "PEP RS";
const VALID_REFS = new Set(["C", "SC", "P", "SP", "PT"]);

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

  if (dots > 1 && commas === 0) {
    // BR thousands only: 27.000.000 → remove all dots
    s = s.replace(/\./g, "");
  } else if (commas > 1 && dots === 0) {
    // US thousands only: 27,000,000 → remove all commas
    s = s.replace(/,/g, "");
  } else if (dots === 1 && commas === 0) {
    // Ambiguous: "211.630" (BR thousands) vs "3.50" (US decimal)
    const afterDot = s.substring(lastDot + 1);
    if (afterDot.length === 3) {
      s = s.replace(".", ""); // BR thousands: 211.630 → 211630
    }
    // else: US decimal: 3.50 → keep as is
  } else if (lastComma > lastDot) {
    // Brazilian decimal: 27.000,50 → remove dots, replace comma with dot
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    // US decimal or no separator: 27,000.50 or 27000
    s = s.replace(/,/g, "");
  }
  return s;
}

function num(v: string): number {
  if (!v) return 0;
  const n = Number(normalizeBrNum(v));
  return isNaN(n) ? 0 : n;
}

function numOrNull(v: string): number | null {
  if (!v) return null;
  const s = normalizeBrNum(v);
  if (!s) return null;
  const n = Number(s);
  return isNaN(n) || n === 0 ? null : n;
}

function intOrNull(v: string): number | null {
  if (!v) return null;
  const n = parseInt(v, 10);
  return isNaN(n) ? null : n;
}

function flag(v: string): number {
  if (!v) return 0;
  const lower = v.toLowerCase().trim();
  if (["1", "x", "sim", "yes", "true"].includes(lower)) return 1;
  const n = Number(v);
  return !isNaN(n) && n ? 1 : 0;
}

function txt(v: string): string | null {
  const s = (v ?? "").trim();
  return s || null;
}

// ── Main handler ──────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = req.url;
    const params = new URL(url).searchParams;
    const versao = params.get("versao") ?? "v2";

    // 1. Fetch CSV from Google Sheets
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;
    console.log(`Fetching CSV from: ${csvUrl}`);

    const csvResp = await fetch(csvUrl);
    if (!csvResp.ok) {
      throw new Error(`Google Sheets fetch failed: ${csvResp.status} ${csvResp.statusText}`);
    }
    const csvText = await csvResp.text();
    const allRows = parseCSV(csvText);
    console.log(`Parsed ${allRows.length} CSV rows`);

    // 2. Parse PEP rows (data starts at row 4 = index 3, ends at row 246 = index 245)
    const pepRows: Record<string, unknown>[] = [];

    for (let i = 3; i < Math.min(allRows.length, 246); i++) {
      const row = allRows[i];
      if (!row || row.length < 10) continue;

      const ref = txt(row[0]);
      if (!ref || !VALID_REFS.has(ref)) continue;

      const ncols = row.length;

      pepRows.push({
        ref,
        comp: intOrNull(row[1]),
        prod: intOrNull(row[2]),
        subp: intOrNull(row[3]),
        pct: intOrNull(row[4]),
        lote: txt(row[7]),
        codigo_wbs: txt(row[8]),
        descricao: txt(row[9]),
        k_reais_bid: numOrNull(row[10]),
        l_reais_local: numOrNull(row[11]),
        m_reais_total: numOrNull(row[12]),
        n_atual: num(row[13]),
        o_atual: num(row[14]),
        p_atual: num(row[15]),
        r_base: num(row[17]),
        s_base: num(row[18]),
        t_base: num(row[19]),
        secretaria: ncols > 24 ? txt(row[24]) : null,
        pmr_ref: ncols > 25 ? txt(row[25]) : null,
        pa_ref: ncols > 26 ? txt(row[26]) : null,
        tipo_aquisicao: ncols > 27 ? txt(row[27]) : null,
        metodo_aquisicao: ncols > 28 ? txt(row[28]) : null,
        fisica_2025: ncols > 29 ? flag(row[29]) : 0,
        fisica_2026: ncols > 30 ? flag(row[30]) : 0,
        fisica_2027: ncols > 31 ? flag(row[31]) : 0,
        fisica_2028: ncols > 32 ? flag(row[32]) : 0,
        fisica_2029: ncols > 33 ? flag(row[33]) : 0,
        fisica_eop: ncols > 34 ? flag(row[34]) : 0,
        desembolso_2025: ncols > 35 ? numOrNull(row[35]) : null,
        desembolso_2026: ncols > 36 ? numOrNull(row[36]) : null,
        desembolso_2027: ncols > 37 ? numOrNull(row[37]) : null,
        desembolso_2028: ncols > 38 ? numOrNull(row[38]) : null,
        desembolso_2029: ncols > 39 ? numOrNull(row[39]) : null,
        desembolso_total: ncols > 40 ? numOrNull(row[40]) : null,
        versao,
        linha_excel: i + 1,
      });
    }

    console.log(`Found ${pepRows.length} valid PEP entries`);

    // Debug: log columns 20-30 of first few PT rows to identify secretaria column
    const ptSamples = allRows.slice(3, Math.min(allRows.length, 246))
      .filter(r => r[0]?.trim() === 'PT')
      .slice(0, 3);
    ptSamples.forEach((row, idx) => {
      const cols: Record<string, string> = {};
      for (let c = 20; c <= Math.min(35, row.length - 1); c++) {
        cols[`col${c}`] = row[c]?.substring(0, 30) ?? '';
      }
      console.log(`PT sample ${idx} (row desc: ${row[9]?.substring(0, 40)}):`, JSON.stringify(cols));
    });

    if (pepRows.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Nenhuma linha PEP encontrada na planilha", rows: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Supabase: delete old + insert new
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const client = createClient(supabaseUrl, supabaseKey);

    // Delete existing version
    await client.from("pep_entries").delete().eq("versao", versao);

    // Batch insert (50 at a time)
    let inserted = 0;
    for (let i = 0; i < pepRows.length; i += 50) {
      const batch = pepRows.slice(i, i + 50);
      const { error } = await client.from("pep_entries").insert(batch);
      if (error) {
        console.error(`Insert batch error at ${i}:`, error.message);
        throw new Error(`Insert failed: ${error.message}`);
      }
      inserted += batch.length;
    }

    // 4. Log to sync_log
    await client.from("sync_log").insert({
      tabela_destino: "pep_entries",
      fonte: `google_sheets:${SPREADSHEET_ID}`,
      versao,
      registros_lidos: pepRows.length,
      registros_inseridos: inserted,
      registros_atualizados: 0,
      registros_erro: 0,
      status: "ok",
      executado_por: "edge_function:sync-pep-sheets",
    });

    console.log(`✅ Sync complete: ${inserted} rows inserted for versão ${versao}`);

    return new Response(
      JSON.stringify({ success: true, rows: inserted, versao }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Sync error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";

    // Try to log failure
    try {
      const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      await client.from("sync_log").insert({
        tabela_destino: "pep_entries",
        fonte: `google_sheets:${SPREADSHEET_ID}`,
        status: "erro",
        mensagem_erro: msg,
        executado_por: "edge_function:sync-pep-sheets",
      });
    } catch (_) { /* ignore logging error */ }

    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
