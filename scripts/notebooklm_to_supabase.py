#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
notebooklm_to_supabase.py — Extrai dados do NotebookLM e alimenta o Supabase.

3 passes de extração (notebook poa-social / 3be2fc63):
  1. pmr       — Atualiza pmr_outputs/pmr_outcomes com linha_base, meta_contrato, fonte_dados
  2. condicoes — Insere condições prévias ao desembolso em pontos_atencao
  3. compliance — Insere notas de compliance do contrato em notas_criticas

Uso:
  PYTHONUTF8=1 python scripts/notebooklm_to_supabase.py --pass all
  PYTHONUTF8=1 python scripts/notebooklm_to_supabase.py --pass pmr --dry-run
  PYTHONUTF8=1 python scripts/notebooklm_to_supabase.py --pass condicoes

Pré-requisitos:
  pip install notebooklm-py "supabase==2.15.0"
  notebooklm auth  (autenticação Google salva em ~/.notebooklm/storage_state.json)
"""

import asyncio
import os
import sys
import json
import re
import argparse
from datetime import datetime, timezone
from pathlib import Path

NOTEBOOK_ID_PREFIX = "3be2fc63"
FONTE              = "notebooklm_3be2fc63"
MEMORY_DIR         = Path(__file__).parent.parent / "memory"


# ─── Supabase ─────────────────────────────────────────────────────────────────

def get_supabase_client():
    try:
        from supabase import create_client
    except ImportError:
        print("ERRO: instale supabase: pip install 'supabase==2.15.0'")
        sys.exit(1)

    url = os.getenv("SUPABASE_URL") or "https://dvqnlnxkwcrxbctujajl.supabase.co"
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not key:
        env_file = Path(__file__).parent.parent / ".env.local"
        if env_file.exists():
            for line in env_file.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if line.startswith("SUPABASE_SERVICE_ROLE_KEY="):
                    key = line.split("=", 1)[1].strip().strip('"')
                    break
                if not key and line.startswith("VITE_SUPABASE_ANON_KEY="):
                    key = line.split("=", 1)[1].strip().strip('"')

    if not key:
        print("ERRO: Nenhuma chave Supabase encontrada.")
        print("  Defina SUPABASE_SERVICE_ROLE_KEY ou adicione ao .env.local")
        sys.exit(1)

    return create_client(url, key)


def log_sync(client, tabela: str, lidos: int, inseridos: int, atualizados: int, erros: int,
             status: str, msg_erro: str = None):
    try:
        client.table("sync_log").insert({
            "tabela_destino": tabela,
            "fonte":          FONTE,
            "versao":         datetime.now(timezone.utc).strftime("%Y%m%d-%H%M"),
            "registros_lidos":       lidos,
            "registros_inseridos":   inseridos,
            "registros_atualizados": atualizados,
            "registros_erro":        erros,
            "status":         status,
            "mensagem_erro":  msg_erro,
            "executado_por":  "notebooklm_to_supabase.py",
        }).execute()
    except Exception as e:
        print(f"  (aviso: sync_log não atualizado: {e})")


# ─── NotebookLM helpers ───────────────────────────────────────────────────────

async def resolve_notebook_id(client) -> str:
    """Resolve ID completo do notebook a partir do prefixo."""
    notebooks = await client.notebooks.list()
    for nb in notebooks:
        if nb.id.startswith(NOTEBOOK_ID_PREFIX):
            return nb.id
    raise ValueError(f"Notebook com prefixo {NOTEBOOK_ID_PREFIX} não encontrado")


async def query_notebook(client, notebook_id: str, question: str) -> str:
    response = await client.chat.ask(notebook_id=notebook_id, question=question)
    return response.answer if hasattr(response, "answer") else str(response)


def extract_json(text: str):
    """Extrai lista ou dict JSON da resposta (bloco ```json``` ou inline)."""
    m = re.search(r"```json\s*([\s\S]*?)\s*```", text)
    if m:
        try:
            return json.loads(m.group(1))
        except json.JSONDecodeError:
            pass
    m = re.search(r"(\[[\s\S]*?\]|\{[\s\S]*?\})", text)
    if m:
        try:
            return json.loads(m.group(1))
        except json.JSONDecodeError:
            pass
    return None


def save_raw(tag: str, text: str) -> Path:
    MEMORY_DIR.mkdir(exist_ok=True)
    ts  = datetime.now().strftime("%Y%m%d-%H%M%S")
    out = MEMORY_DIR / f"notebooklm-{tag}-{ts}.txt"
    out.write_text(text, encoding="utf-8")
    return out


# ─── Pass 1: Enriquecimento PMR ───────────────────────────────────────────────

PMR_PROMPT = """
Liste todos os indicadores de PMR (Outputs e Outcomes) do programa POA+SOCIAL BID BR-L1597.
Para cada indicador retorne:
- codigo (ex: "1.1", "OC-1")
- descricao (breve)
- linha_base (número ou null)
- meta_contrato (número ou null)
- unidade (ex: "unidades", "%", "famílias")
- fonte_dados (sistema ou órgão que gera o dado)
- tipo: "output" ou "outcome"

Responda SOMENTE com um array JSON válido, sem explicações adicionais:
[{"codigo":"1.1","descricao":"...","linha_base":0,"meta_contrato":100,"unidade":"unidades","fonte_dados":"SMAS","tipo":"output"}]
"""

async def pass_pmr(nb_client, notebook_id: str, sb_client, dry_run: bool):
    print("\n── Pass 1: Enriquecimento PMR ──────────────────────────────")
    print("  Consultando NotebookLM...")

    answer = await query_notebook(nb_client, notebook_id, PMR_PROMPT)
    data   = extract_json(answer)

    if not data or not isinstance(data, list):
        path = save_raw("pmr", answer)
        print(f"  ✗ JSON não extraído. Resposta bruta salva em: {path}")
        if not dry_run:
            log_sync(sb_client, "pmr_outputs", 0, 0, 0, 1, "erro", "JSON não extraído — ver memory/")
        return

    outputs  = [d for d in data if d.get("tipo") == "output"]
    outcomes = [d for d in data if d.get("tipo") == "outcome"]
    print(f"  Extraídos: {len(outputs)} outputs + {len(outcomes)} outcomes")

    if dry_run:
        for d in data[:8]:
            print(f"  [{d.get('tipo','?'):7s}] {d.get('codigo','?'):6s} — {d.get('descricao','?')[:50]}")
        print("  (não gravado)")
        return

    def update_table(table: str, items: list) -> tuple[int, int]:
        upd, err = 0, 0
        for item in items:
            if not item.get("codigo"):
                continue
            patch = {}
            if item.get("linha_base")    is not None: patch["linha_base"]    = item["linha_base"]
            if item.get("meta_contrato") is not None: patch["meta_contrato"] = item["meta_contrato"]
            if item.get("fonte_dados")   and table == "pmr_outcomes":
                patch["fonte_dados"] = item["fonte_dados"]
            if patch:
                try:
                    sb_client.table(table).update(patch).eq("codigo", item["codigo"]).execute()
                    upd += 1
                except Exception as e:
                    err += 1
                    print(f"  ✗ {table} [{item['codigo']}]: {e}")
        return upd, err

    upd_o, err_o = update_table("pmr_outputs",  outputs)
    upd_c, err_c = update_table("pmr_outcomes", outcomes)
    log_sync(sb_client, "pmr_outputs",  len(outputs),  0, upd_o, err_o, "ok" if err_o == 0 else "parcial")
    log_sync(sb_client, "pmr_outcomes", len(outcomes), 0, upd_c, err_c, "ok" if err_c == 0 else "parcial")
    print(f"  ✓ {upd_o} outputs + {upd_c} outcomes atualizados  |  {err_o + err_c} erros")


# ─── Pass 2: Condições Prévias ao Desembolso ─────────────────────────────────

CONDICOES_PROMPT = """
Liste todas as condições prévias ao primeiro desembolso e condições especiais do contrato
5750-OC / BR-L1597 (POA+SOCIAL BID — Porto Alegre).

Para cada condição retorne:
- tema: nome curto
- descricao: descrição detalhada
- area: uma de ["obras","digital","social","governanca","juridico","socioambiental","aquisicoes","financeiro"]
- criticidade: "critico" se pendente, "alerta" se em andamento, "ok" se cumprida
- status_texto: "Pendente", "Em andamento" ou "Cumprida"

Responda SOMENTE com um array JSON válido:
[{"tema":"...","descricao":"...","area":"financeiro","criticidade":"critico","status_texto":"Pendente"}]
"""

async def pass_condicoes(nb_client, notebook_id: str, sb_client, dry_run: bool):
    print("\n── Pass 2: Condições Prévias ao Desembolso ─────────────────")
    print("  Consultando NotebookLM...")

    answer = await query_notebook(nb_client, notebook_id, CONDICOES_PROMPT)
    data   = extract_json(answer)

    if not data or not isinstance(data, list):
        path = save_raw("condicoes", answer)
        print(f"  ✗ JSON não extraído. Resposta bruta salva em: {path}")
        if not dry_run:
            log_sync(sb_client, "pontos_atencao", 0, 0, 0, 1, "erro", "JSON não extraído — ver memory/")
        return

    print(f"  Extraídas: {len(data)} condições")

    if dry_run:
        icons = {"critico": "🔴", "alerta": "🟡", "ok": "🟢"}
        for d in data:
            print(f"  {icons.get(d.get('criticidade',''),'?')} [{d.get('area','?'):14s}] {d.get('tema','?')[:50]}")
        print("  (não gravado)")
        return

    ins, err = 0, 0
    for cond in data:
        try:
            sb_client.table("pontos_atencao").insert({
                "tema":         cond.get("tema", "Condição contratual"),
                "descricao":    cond.get("descricao"),
                "area":         cond.get("area", "financeiro"),
                "criticidade":  cond.get("criticidade", "alerta"),
                "status_texto": cond.get("status_texto", "Em andamento"),
                "responsavel":  "UGP / DPF",
                "ativo":        True,
            }).execute()
            ins += 1
            icons = {"critico": "🔴", "alerta": "🟡", "ok": "🟢"}
            print(f"  {icons.get(cond.get('criticidade',''),'?')} {cond.get('tema','?')[:55]}")
        except Exception as e:
            err += 1
            print(f"  ✗ ERRO [{cond.get('tema','?')[:40]}]: {e}")

    log_sync(sb_client, "pontos_atencao", len(data), ins, 0, err, "ok" if err == 0 else "parcial")
    print(f"  ✓ {ins} condições inseridas  |  {err} erros")


# ─── Pass 3: Notas de Compliance ─────────────────────────────────────────────

COMPLIANCE_PROMPT = """
Liste as principais observações, ressalvas e notas de compliance do programa POA+SOCIAL BID BR-L1597.
Inclua: cláusulas especiais do contrato 5750-OC, requisitos BID não-negociáveis, salvaguardas socioambientais,
observações de missões BID, notas de auditoria, e condições de elegibilidade de gastos.

Para cada nota retorne:
- componente: componente afetado ("C1", "C2", "ADM" ou "Geral")
- nota: texto completo da observação (mínimo 2 frases)
- autor: fonte (ex: "Contrato 5750-OC", "BID Missão Análise", "PMR 2025", "PGAS")

Responda SOMENTE com um array JSON válido:
[{"componente":"C2","nota":"...","autor":"Contrato 5750-OC"}]
"""

async def pass_compliance(nb_client, notebook_id: str, sb_client, dry_run: bool):
    print("\n── Pass 3: Notas de Compliance ──────────────────────────────")
    print("  Consultando NotebookLM...")

    answer = await query_notebook(nb_client, notebook_id, COMPLIANCE_PROMPT)
    data   = extract_json(answer)

    if not data or not isinstance(data, list):
        path = save_raw("compliance", answer)
        print(f"  ✗ JSON não extraído. Resposta bruta salva em: {path}")
        if not dry_run:
            log_sync(sb_client, "notas_criticas", 0, 0, 0, 1, "erro", "JSON não extraído — ver memory/")
        return

    print(f"  Extraídas: {len(data)} notas")

    if dry_run:
        for d in data[:5]:
            print(f"  [{d.get('componente','?'):4s}] {d.get('nota','?')[:60]}")
        print("  (não gravado)")
        return

    ins, err = 0, 0
    for nota in data:
        try:
            sb_client.table("notas_criticas").insert({
                "componente": nota.get("componente"),
                "nota":       nota.get("nota", ""),
                "autor":      nota.get("autor", f"notebooklm_{NOTEBOOK_ID_PREFIX}"),
            }).execute()
            ins += 1
        except Exception as e:
            err += 1
            print(f"  ✗ ERRO nota: {e}")

    log_sync(sb_client, "notas_criticas", len(data), ins, 0, err, "ok" if err == 0 else "parcial")
    print(f"  ✓ {ins} notas inseridas  |  {err} erros")


# ─── Main ─────────────────────────────────────────────────────────────────────

async def main(passes: list, dry_run: bool):
    try:
        from notebooklm import NotebookLMClient
    except ImportError:
        print("ERRO: notebooklm-py não instalado.")
        print("  Execute: pip install notebooklm-py")
        sys.exit(1)

    print(f"\n{'=' * 65}")
    print("  NotebookLM → Supabase — POA+SOCIAL BID (BR-L1597)")
    print(f"{'=' * 65}")
    print(f"  Notebook : {NOTEBOOK_ID_PREFIX}... (poa-social)")
    print(f"  Passes   : {', '.join(passes)}")
    print(f"  Modo     : {'DRY-RUN (sem gravação)' if dry_run else 'PRODUÇÃO'}")
    print(f"{'=' * 65}")

    sb_client = None if dry_run else get_supabase_client()

    async with await NotebookLMClient.from_storage() as nb_client:
        notebook_id = await resolve_notebook_id(nb_client)
        print(f"\n  ✓ Notebook conectado: {notebook_id[:24]}...")

        if "pmr"        in passes: await pass_pmr(nb_client,        notebook_id, sb_client, dry_run)
        if "condicoes"  in passes: await pass_condicoes(nb_client,  notebook_id, sb_client, dry_run)
        if "compliance" in passes: await pass_compliance(nb_client, notebook_id, sb_client, dry_run)

    print(f"\n{'─' * 65}")
    print("  Concluído.")
    print(f"{'─' * 65}\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Extrai dados do NotebookLM poa-social e alimenta o Supabase (3 passes)"
    )
    parser.add_argument(
        "--pass", dest="passes", default="all",
        choices=["pmr", "condicoes", "compliance", "all"],
        help="Pass a executar (default: all)",
    )
    parser.add_argument("--dry-run", action="store_true", help="Listar sem gravar no Supabase")
    args = parser.parse_args()

    passes = ["pmr", "condicoes", "compliance"] if args.passes == "all" else [args.passes]
    asyncio.run(main(passes, args.dry_run))
