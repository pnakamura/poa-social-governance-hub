#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Import Aquisições BID — popula tabela `aquisicoes` a partir da aba BID da planilha DPF.
Fonte: Google Sheets ID 1gaeY_iQFwYBB-byKFETBz54FcfRVm5mFvuMLfIR7E9Y, aba BID

Uso:
    PYTHONUTF8=1 python scripts/import_aquisicoes_bid.py [--dry-run] [--limpar]

Dependências:
    pip install gspread google-auth "supabase==2.15.0"
"""

import os
import sys
import argparse
from datetime import datetime, timezone

# ─── Mapeamento de colunas (0-based, linha 2 = header, dados linha 3+) ───────
COL_BANCO        = 0   # Banco (filtrar 'BID')
COL_ID_PROCESSO  = 2   # NOVO ID
COL_EXECUTOR     = 5   # Executor (→ secretaria)
COL_COMPONENTE   = 7   # Componente
COL_TITULO       = 8   # Investimento/Produto
COL_VALOR_USD    = 15  # Valor Aquisição US$
COL_LOTE         = 18  # LOTE
COL_TIPO         = 19  # TIPO
COL_FASE         = 23  # Fase (→ status via mapeamento)
COL_DATA_INICIO  = 25  # Data Início Previsto
COL_DATA_FIM     = 26  # Data Término Previsto

SPREADSHEET_ID = "1gaeY_iQFwYBB-byKFETBz54FcfRVm5mFvuMLfIR7E9Y"
ABA = "BID"

# Mapeamento Fase → enum status
FASE_MAP = {
    "planejado":    "planejado",
    "preparação":   "preparacao",
    "preparacao":   "preparacao",
    "publicado":    "publicado",
    "adjudicado":   "adjudicado",
    "contratado":   "contratado",
    "em execução":  "em_execucao",
    "em execucao":  "em_execucao",
    "concluído":    "concluido",
    "concluido":    "concluido",
    "cancelado":    "cancelado",
}

# Mapeamento tipo (normalização)
TIPO_MAP = {
    "obra":         "obra",
    "obras":        "obra",
    "consultoria":  "consultoria",
    "bem":          "bem",
    "bens":         "bem",
    "serviço":      "servico",
    "servico":      "servico",
    "serviços":     "servico",
    "fidic":        "fidic",
}


def get_supabase_client():
    try:
        from supabase import create_client
    except ImportError:
        print("ERRO: instale supabase: pip install 'supabase==2.15.0'")
        sys.exit(1)

    url = os.getenv("SUPABASE_URL") or "https://dvqnlnxkwcrxbctujajl.supabase.co"
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not key:
        env_file = os.path.join(os.path.dirname(__file__), "..", ".env.local")
        if os.path.exists(env_file):
            with open(env_file) as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("SUPABASE_SERVICE_ROLE_KEY="):
                        key = line.split("=", 1)[1].strip().strip('"')
                        break
                    elif not key and line.startswith("VITE_SUPABASE_ANON_KEY="):
                        key = line.split("=", 1)[1].strip().strip('"')

    if not key:
        key = (
            os.getenv("SUPABASE_ANON_KEY")
            or "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2cW5sbnhrd2NyeGJjdHVqYWpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NzM4OTIsImV4cCI6MjA2NzE0OTg5Mn0.9mzrQC2B9Kp_ZNyLt-Gpe_0HkVE-bioR7sFWsviru40"
        )

    return create_client(url, key)


def get_gspread_client():
    """Autentica no Google Sheets via OAuth token existente."""
    try:
        import gspread
        from google.oauth2.credentials import Credentials
        from google.auth.transport.requests import Request
        import json
    except ImportError:
        print("ERRO: instale dependências: pip install gspread google-auth")
        sys.exit(1)

    # Localizar token.json na pasta BID_POA
    bid_dir = os.path.join(os.path.dirname(__file__), "..", "..", "BID_POA")
    token_path = os.path.join(bid_dir, "token.json")

    if not os.path.exists(token_path):
        print(f"ERRO: token.json não encontrado em {token_path}")
        print("  Execute: node src/auth.js na pasta BID_POA para autenticar")
        sys.exit(1)

    with open(token_path) as f:
        token_data = json.load(f)

    # Localizar client_secret
    creds_path = None
    for fname in os.listdir(bid_dir):
        if fname.startswith("client_secret") and fname.endswith(".json"):
            creds_path = os.path.join(bid_dir, fname)
            break

    if not creds_path:
        print(f"ERRO: client_secret*.json não encontrado em {bid_dir}")
        sys.exit(1)

    with open(creds_path) as f:
        creds_data = json.load(f)

    installed = creds_data.get("installed") or creds_data.get("web", {})
    client_id = installed.get("client_id")
    client_secret = installed.get("client_secret")

    scopes = [
        "https://www.googleapis.com/auth/spreadsheets.readonly",
        "https://www.googleapis.com/auth/drive.readonly",
    ]

    creds = Credentials(
        token=token_data.get("access_token"),
        refresh_token=token_data.get("refresh_token"),
        token_uri="https://oauth2.googleapis.com/token",
        client_id=client_id,
        client_secret=client_secret,
        scopes=scopes,
    )

    if creds.expired and creds.refresh_token:
        creds.refresh(Request())

    return gspread.authorize(creds)


def parse_date(val: str) -> str | None:
    """Normaliza data para formato ISO YYYY-MM-DD."""
    if not val or not str(val).strip():
        return None
    val = str(val).strip()
    for fmt in ("%d/%m/%Y", "%d/%m/%y", "%Y-%m-%d", "%d-%m-%Y"):
        try:
            return datetime.strptime(val, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None


def parse_float(val) -> float | None:
    """Converte string numérica para float."""
    if val is None or str(val).strip() in ("", "-", "—"):
        return None
    try:
        return float(str(val).replace(".", "").replace(",", ".").replace("$", "").strip())
    except ValueError:
        return None


def map_status(fase: str) -> str:
    """Mapeia fase textual para enum de status."""
    if not fase:
        return "planejado"
    return FASE_MAP.get(fase.lower().strip(), "planejado")


def map_tipo(tipo: str) -> str:
    """Normaliza tipo de aquisição."""
    if not tipo:
        return "servico"
    return TIPO_MAP.get(tipo.lower().strip(), "servico")


def read_bid_sheet() -> list[list]:
    """Lê todas as linhas da aba BID do Google Sheets."""
    print("  Conectando ao Google Sheets...")
    gc = get_gspread_client()
    sh = gc.open_by_key(SPREADSHEET_ID)
    ws = sh.worksheet(ABA)
    rows = ws.get_all_values()
    print(f"  Total de linhas lidas: {len(rows)}")
    return rows


def parse_rows(rows: list[list]) -> list[dict]:
    """Filtra e converte linhas BID em dicts para upsert."""
    registros = []
    skipped = 0

    # Header real na linha 2 (índice 1), dados a partir da linha 3 (índice 2)
    for i, row in enumerate(rows[2:], start=3):
        # Garantir que a linha tem colunas suficientes
        def cell(col: int) -> str:
            return row[col].strip() if col < len(row) else ""

        banco = cell(COL_BANCO)
        id_processo = cell(COL_ID_PROCESSO)

        # Filtrar: apenas BID e com NOVO ID preenchido
        if banco.upper() != "BID" or not id_processo:
            skipped += 1
            continue

        titulo = cell(COL_TITULO)
        if not titulo:
            skipped += 1
            continue

        secretaria = cell(COL_EXECUTOR) or "Não informado"
        componente = cell(COL_COMPONENTE)
        lote = cell(COL_LOTE) or None
        tipo_raw = cell(COL_TIPO)
        fase_raw = cell(COL_FASE)
        valor_raw = cell(COL_VALOR_USD)
        data_inicio_raw = cell(COL_DATA_INICIO)
        data_fim_raw = cell(COL_DATA_FIM)

        # Detectar se FIDIC
        fidic = "fidic" in (tipo_raw + titulo + fase_raw).lower()
        tipo = "fidic" if fidic else map_tipo(tipo_raw)

        registros.append({
            "id_processo":        id_processo,
            "titulo":             titulo[:500],
            "tipo":               tipo,
            "secretaria":         secretaria[:100],
            "componente":         componente[:20] if componente else None,
            "valor_usd":          parse_float(valor_raw),
            "financiador":        "BID",
            "status":             map_status(fase_raw),
            "lote":               lote[:50] if lote else None,
            "fidic_aplicavel":    fidic,
            "data_inicio_previsto": parse_date(data_inicio_raw),
            "data_fim_previsto":    parse_date(data_fim_raw),
        })

    print(f"  Registros BID válidos: {len(registros)} | Ignorados: {skipped}")
    return registros


def import_aquisicoes(dry_run: bool = False, limpar: bool = False):
    print(f"\n{'=' * 65}")
    print("  Import Aquisições BID — POA+SOCIAL (BR-L1597)")
    print(f"{'=' * 65}")
    print(f"  Planilha: {SPREADSHEET_ID}")
    print(f"  Aba: {ABA}")
    print(f"  Modo: {'DRY-RUN' if dry_run else 'PRODUÇÃO'}")
    print(f"{'=' * 65}\n")

    rows = read_bid_sheet()
    registros = parse_rows(rows)

    if not registros:
        print("  Nenhum registro BID encontrado para importar.")
        return

    if dry_run:
        print("\n  Prévia dos registros (primeiros 10):")
        for r in registros[:10]:
            print(f"  [{r['status']:12s}] {r['id_processo']:20s} | {r['secretaria'][:20]:20s} | {r['titulo'][:40]}")
        print(f"\n  Total: {len(registros)} (não gravados)")
        return

    sb = get_supabase_client()

    if limpar:
        print("  Limpando registros existentes com financiador='BID'...")
        sb.table("aquisicoes").delete().eq("financiador", "BID").execute()
        print("  ✓ Limpeza concluída\n")

    erros = 0
    inseridos = 0
    atualizados = 0

    for r in registros:
        try:
            result = sb.table("aquisicoes").upsert(
                r, on_conflict="id_processo"
            ).execute()

            # Verificar se foi insert ou update
            if result.data:
                # Se o registro já existia, é update (simplificado)
                inseridos += 1
            print(f"  ✓ {r['id_processo']:20s} | {r['status']:12s} | {r['titulo'][:35]}")
        except Exception as e:
            print(f"  ✗ ERRO em {r['id_processo']}: {e}")
            erros += 1

    # Registrar no sync_log
    try:
        sb.table("sync_log").insert({
            "tabela_destino":      "aquisicoes",
            "fonte":               "google_sheets_dfp_bid",
            "versao":              datetime.now(timezone.utc).strftime("%Y%m%d"),
            "registros_lidos":     len(registros),
            "registros_inseridos": inseridos,
            "registros_atualizados": atualizados,
            "registros_erro":      erros,
            "status":              "ok" if erros == 0 else "parcial",
            "executado_por":       "import_aquisicoes_bid.py",
        }).execute()
    except Exception as e:
        print(f"  AVISO: Não foi possível registrar no sync_log: {e}")

    print(f"\n{'─' * 65}")
    print(f"  Resultado: {inseridos} upserted | {erros} erros")
    print(f"{'─' * 65}\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Importa aquisições BID do Google Sheets para o Supabase")
    parser.add_argument("--dry-run", action="store_true", help="Simula sem gravar")
    parser.add_argument("--limpar",  action="store_true", help="Remove registros BID antes de inserir")
    args = parser.parse_args()
    import_aquisicoes(dry_run=args.dry_run, limpar=args.limpar)
