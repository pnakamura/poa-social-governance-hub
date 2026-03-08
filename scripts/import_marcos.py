#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Import Marcos — popula a tabela `marcos` com a timeline de eventos do programa BR-L1597.
Fonte: resumo-executivo-poa-social.html + documentação do programa

Uso:
    PYTHONUTF8=1 python scripts/import_marcos.py [--dry-run] [--limpar]
"""

import os
import sys
import argparse
from datetime import datetime, timezone

# ─── Dados da timeline (fonte: resumo-executivo-poa-social.html) ─────────────
MARCOS = [
    {
        "data_marco": "2024-10-01",
        "tipo": "legislativo",
        "titulo": "Lei Municipal n. 14.095 aprovada",
        "descricao": "Aprovação da lei municipal habilitando a contratação do empréstimo BID.",
        "area": "governanca",
        "status": "concluido",
        "referencia_doc": "Lei Municipal 14.095/2024",
    },
    {
        "data_marco": "2024-12-01",
        "tipo": "contratual",
        "titulo": "Contrato de Empréstimo publicado no DOU — entrada em vigor",
        "descricao": "Contrato N. 5750/OC-BR assinado entre BID e PMPA. Início formal do programa.",
        "area": "financeiro",
        "status": "concluido",
        "referencia_doc": "Contrato N. 5750/OC-BR",
    },
    {
        "data_marco": "2025-05-01",
        "tipo": "entrega_doc",
        "titulo": "ROP — Regulamento Operativo do Programa concluído",
        "descricao": "Documento que estabelece as normas operacionais, responsabilidades e procedimentos do programa.",
        "area": "governanca",
        "status": "concluido",
        "referencia_doc": None,
    },
    {
        "data_marco": "2025-07-01",
        "tipo": "missao_bid",
        "titulo": "Missão BID — Jul/2025",
        "descricao": "Primeira missão de acompanhamento do BID após entrada em vigor do contrato.",
        "area": "governanca",
        "status": "concluido",
        "referencia_doc": None,
    },
    {
        "data_marco": "2025-08-01",
        "tipo": "entrega_doc",
        "titulo": "NOP SEI DPF 001 — Padronização de aquisições no SEI",
        "descricao": "Norma Operacional Padrão para registro e tramitação de processos de aquisição no SEI.",
        "area": "aquisicoes",
        "status": "concluido",
        "referencia_doc": "NOP SEI DPF 001",
    },
    {
        "data_marco": "2025-10-01",
        "tipo": "outro",
        "titulo": "Reuniões de planejamento: lotes de obras, FIDIC, PEP, PMR",
        "descricao": "Série de reuniões técnicas para definição de lotes de obras, contratos FIDIC, estrutura do PEP e PMR.",
        "area": "obras",
        "status": "concluido",
        "referencia_doc": None,
    },
    {
        "data_marco": "2025-11-01",
        "tipo": "outro",
        "titulo": "Treinamento BID: políticas de aquisição e gestão de riscos",
        "descricao": "Capacitação da equipe UGP e ULPs nas políticas de aquisição GN-2349-15 do BID.",
        "area": "aquisicoes",
        "status": "concluido",
        "referencia_doc": None,
    },
    {
        "data_marco": "2025-12-01",
        "tipo": "outro",
        "titulo": "Núcleo de Engenharia estruturado",
        "descricao": "Equipe técnica de engenharia da UGP organizada e operacional para supervisão de obras.",
        "area": "obras",
        "status": "concluido",
        "referencia_doc": None,
    },
    {
        "data_marco": "2025-12-01",
        "tipo": "entrega_doc",
        "titulo": "Relatório Semestral 2025 entregue",
        "descricao": "Primeiro relatório semestral de progresso do programa entregue ao BID.",
        "area": "governanca",
        "status": "concluido",
        "referencia_doc": None,
    },
    {
        "data_marco": "2025-12-01",
        "tipo": "missao_bid",
        "titulo": "Missão BID — Dez/2025",
        "descricao": "Missão de acompanhamento semestral do BID.",
        "area": "governanca",
        "status": "concluido",
        "referencia_doc": None,
    },
    {
        "data_marco": "2026-01-01",
        "tipo": "missao_bid",
        "titulo": "Missão BID — Jan/2026",
        "descricao": "Missão técnica do BID com foco em aquisições e obras.",
        "area": "governanca",
        "status": "concluido",
        "referencia_doc": None,
    },
    {
        "data_marco": "2026-01-01",
        "tipo": "outro",
        "titulo": "Oficina socioambiental — MPAS/PDAS",
        "descricao": "Workshop de elaboração do Marco e Plano de Gestão Ambiental e Social do programa.",
        "area": "socioambiental",
        "status": "concluido",
        "referencia_doc": "MPAS/PDAS",
    },
    {
        "data_marco": "2026-01-15",
        "tipo": "contratual",
        "titulo": "Contratos FIDIC para HPS — início de preparação",
        "descricao": "Início da estruturação dos contratos FIDIC (Yellow Book) para o Hospital de Pronto Socorro.",
        "area": "obras",
        "status": "em_andamento",
        "referencia_doc": "FIDIC Yellow Book",
    },
    {
        "data_marco": "2026-03-01",
        "tipo": "outro",
        "titulo": "Padronização construtiva e aglutinação de lotes",
        "descricao": "Definição dos padrões construtivos para Clinicas de Familia, UBS e CAPS. Consolidação de lotes de obras.",
        "area": "obras",
        "status": "em_andamento",
        "referencia_doc": None,
    },
    {
        "data_marco": "2026-03-01",
        "tipo": "outro",
        "titulo": "Planejamento Policlínica IAPI",
        "descricao": "Início do planejamento técnico para reabilitação da Policlínica IAPI.",
        "area": "obras",
        "status": "em_andamento",
        "referencia_doc": None,
    },
    # Marcos futuros (previstos)
    {
        "data_marco": "2026-06-01",
        "tipo": "outro",
        "titulo": "Primeira licitação de obras publicada",
        "descricao": "Publicação da primeira licitação de obras do Componente C2.",
        "area": "obras",
        "status": "previsto",
        "referencia_doc": None,
    },
    {
        "data_marco": "2026-06-01",
        "tipo": "missao_bid",
        "titulo": "Missão BID — Jun/2026 (prevista)",
        "descricao": "Missão semestral de acompanhamento prevista.",
        "area": "governanca",
        "status": "previsto",
        "referencia_doc": None,
    },
    {
        "data_marco": "2026-12-01",
        "tipo": "entrega_doc",
        "titulo": "Primeiro desembolso BID previsto",
        "descricao": "Após cumprimento das condições prévias, realização do primeiro desembolso do empréstimo.",
        "area": "financeiro",
        "status": "previsto",
        "referencia_doc": None,
    },
]


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
        print("ERRO: Nenhuma chave Supabase encontrada.")
        sys.exit(1)

    return create_client(url, key)


def import_marcos(dry_run: bool = False, limpar: bool = False):
    print(f"\n{'=' * 60}")
    print("  Import Marcos — Timeline POA+SOCIAL BID (BR-L1597)")
    print(f"{'=' * 60}")
    print(f"  Registros: {len(MARCOS)}")
    print(f"  Modo: {'DRY-RUN' if dry_run else 'PRODUÇÃO'}")
    if limpar:
        print("  ⚠ --limpar: apagará registros existentes antes de inserir")
    print(f"{'=' * 60}\n")

    if dry_run:
        for m in MARCOS:
            status_icon = {"concluido": "✓", "em_andamento": "→", "previsto": "○", "atrasado": "✗"}.get(m["status"], "?")
            print(f"  {status_icon} {m['data_marco']} | {m['tipo']:12s} | {m['titulo'][:50]}")
        print(f"\n  Total: {len(MARCOS)} marcos (não gravados)")
        return

    client = get_supabase_client()

    if limpar:
        print("  Limpando tabela marcos...")
        client.table("marcos").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()

    inseridos = 0
    erros = 0

    for marco in MARCOS:
        try:
            client.table("marcos").insert(marco).execute()
            inseridos += 1
            icon = {"concluido": "✓", "em_andamento": "→", "previsto": "○"}.get(marco["status"], "?")
            print(f"  {icon} {marco['data_marco']} — {marco['titulo'][:55]}")
        except Exception as e:
            erros += 1
            print(f"  ✗ ERRO [{marco['titulo'][:40]}]: {e}")

    # sync_log
    try:
        client.table("sync_log").insert({
            "tabela_destino": "marcos",
            "fonte": "script_manual",
            "versao": datetime.now(timezone.utc).strftime("%Y%m%d"),
            "registros_lidos": len(MARCOS),
            "registros_inseridos": inseridos,
            "registros_erro": erros,
            "status": "ok" if erros == 0 else "parcial",
            "executado_por": "import_marcos.py",
        }).execute()
    except Exception as e:
        print(f"  (aviso: sync_log não atualizado: {e})")

    print(f"\n{'─' * 60}")
    print(f"  Resultado: {inseridos} inseridos | {erros} erros")
    print(f"{'─' * 60}\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Importar marcos/timeline para Supabase")
    parser.add_argument("--dry-run", action="store_true", help="Listar sem gravar")
    parser.add_argument("--limpar", action="store_true", help="Apagar registros existentes antes de inserir")
    args = parser.parse_args()
    import_marcos(dry_run=args.dry_run, limpar=args.limpar)
