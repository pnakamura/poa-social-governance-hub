#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Import Pontos de Atenção — popula `pontos_atencao` com riscos institucionais do programa BR-L1597.
Fonte: resumo-executivo-poa-social.html (seção "Pontos de Atenção")

Uso:
    PYTHONUTF8=1 python scripts/import_pontos_atencao.py [--dry-run] [--limpar]
"""

import os
import sys
import argparse
from datetime import datetime, timezone

# ─── Dados (fonte: resumo-executivo-poa-social.html) ─────────────────────────
PONTOS_ATENCAO = [
    # Críticos
    {
        "tema": "Definição de terrenos para obras",
        "descricao": (
            "Vários projetos de obras do C2 dependem da definição e disponibilização de "
            "terrenos pelo poder público. Atrasos na regularização fundiária podem bloquear "
            "o início das obras."
        ),
        "area": "obras",
        "criticidade": "critico",
        "status_texto": "Crítico",
        "responsavel": "SMPG / UGP",
        "prazo_previsto": None,
        "ativo": True,
    },
    # Alertas
    {
        "tema": "Contratos FIDIC — jurisprudência TCU",
        "descricao": (
            "A adoção do modelo contratual FIDIC (Yellow Book) para obras complexas requer "
            "análise aprofundada da jurisprudência do TCU. Há risco de questionamentos na "
            "fase de licitação."
        ),
        "area": "juridico",
        "criticidade": "alerta",
        "status_texto": "Em estudo",
        "responsavel": "UGP / Jurídico",
        "prazo_previsto": None,
        "ativo": True,
    },
    {
        "tema": "Conformidade socioambiental — MPAS/PDAS",
        "descricao": (
            "Elaboração e aprovação do Marco de Política Ambiental e Social (MPAS) e "
            "Plano de Gestão Ambiental e Social (PDAS). Condição necessária para início de "
            "obras com financiamento BID."
        ),
        "area": "socioambiental",
        "criticidade": "alerta",
        "status_texto": "Em andamento",
        "responsavel": "UGP / Especialista Socioambiental",
        "prazo_previsto": None,
        "ativo": True,
    },
    {
        "tema": "Licenciamento ambiental (LEED/EDGE)",
        "descricao": (
            "As obras financiadas pelo BID devem atender a padrões de sustentabilidade. "
            "O processo de certificação LEED ou EDGE está em andamento e deve ser "
            "concluído antes do início das obras."
        ),
        "area": "socioambiental",
        "criticidade": "alerta",
        "status_texto": "Em andamento",
        "responsavel": "Núcleo de Engenharia",
        "prazo_previsto": None,
        "ativo": True,
    },
    # OK / Concluídos
    {
        "tema": "Portal do Cliente BID (Client Portal)",
        "descricao": "Sistema do BID para acompanhamento do programa, registro de documentos e comunicação com a equipe do banco.",
        "area": "digital",
        "criticidade": "ok",
        "status_texto": "Operacional",
        "responsavel": "UGP",
        "prazo_previsto": None,
        "ativo": True,
    },
    {
        "tema": "Estruturação do Núcleo de Engenharia",
        "descricao": (
            "Equipe técnica de engenharia da UGP responsável pela supervisão e "
            "acompanhamento das obras do C2."
        ),
        "area": "obras",
        "criticidade": "ok",
        "status_texto": "Concluído",
        "responsavel": "UGP",
        "prazo_previsto": None,
        "ativo": True,
    },
    {
        "tema": "Padronização de processos SEI (NOP DPF 001)",
        "descricao": "Norma Operacional Padrão para registro e tramitação de processos de aquisição no SEI implementada.",
        "area": "governanca",
        "criticidade": "ok",
        "status_texto": "Concluído",
        "responsavel": "DPF",
        "prazo_previsto": None,
        "ativo": True,
    },
    {
        "tema": "Relatório Semestral 2025",
        "descricao": "Primeiro relatório semestral de progresso do programa entregue ao BID dentro do prazo.",
        "area": "governanca",
        "criticidade": "ok",
        "status_texto": "Entregue",
        "responsavel": "UGP",
        "prazo_previsto": None,
        "ativo": True,
    },
    # Itens adicionais com base no programa
    {
        "tema": "Condições prévias ao primeiro desembolso",
        "descricao": (
            "O contrato exige o cumprimento de condições específicas antes da realização "
            "do primeiro desembolso BID. Algumas condições ainda pendentes de verificação."
        ),
        "area": "financeiro",
        "criticidade": "alerta",
        "status_texto": "Em andamento",
        "responsavel": "UGP / DPF",
        "prazo_previsto": None,
        "ativo": True,
    },
    {
        "tema": "Interoperabilidade dos sistemas sociais (InterPOA)",
        "descricao": (
            "Componente C1 — Transformação Digital. Desenvolvimento da arquitetura empresarial "
            "e início do desenvolvimento do ambiente integrado InterPOA."
        ),
        "area": "digital",
        "criticidade": "alerta",
        "status_texto": "Em preparação",
        "responsavel": "SMPG / PROCEMPA",
        "prazo_previsto": None,
        "ativo": True,
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


def import_pontos(dry_run: bool = False, limpar: bool = False):
    crit_icons = {"critico": "🔴", "alerta": "🟡", "ok": "🟢", "info": "🔵"}

    print(f"\n{'=' * 65}")
    print("  Import Pontos de Atenção — POA+SOCIAL BID (BR-L1597)")
    print(f"{'=' * 65}")
    print(f"  Registros: {len(PONTOS_ATENCAO)}")
    criticos = sum(1 for p in PONTOS_ATENCAO if p["criticidade"] == "critico")
    alertas  = sum(1 for p in PONTOS_ATENCAO if p["criticidade"] == "alerta")
    oks      = sum(1 for p in PONTOS_ATENCAO if p["criticidade"] == "ok")
    print(f"  Críticos: {criticos} | Alertas: {alertas} | OK: {oks}")
    print(f"  Modo: {'DRY-RUN' if dry_run else 'PRODUÇÃO'}")
    print(f"{'=' * 65}\n")

    if dry_run:
        for p in PONTOS_ATENCAO:
            icon = crit_icons.get(p["criticidade"], "?")
            print(f"  {icon} [{p['area']:14s}] {p['tema'][:55]}")
        print(f"\n  Total: {len(PONTOS_ATENCAO)} pontos (não gravados)")
        return

    client = get_supabase_client()

    if limpar:
        print("  Limpando tabela pontos_atencao...")
        client.table("pontos_atencao").delete().neq(
            "id", "00000000-0000-0000-0000-000000000000"
        ).execute()

    inseridos = 0
    erros = 0

    for ponto in PONTOS_ATENCAO:
        try:
            client.table("pontos_atencao").insert(ponto).execute()
            inseridos += 1
            icon = crit_icons.get(ponto["criticidade"], "?")
            print(f"  {icon} [{ponto['area']:14s}] {ponto['tema'][:55]}")
        except Exception as e:
            erros += 1
            print(f"  ✗ ERRO [{ponto['tema'][:40]}]: {e}")

    # sync_log
    try:
        client.table("sync_log").insert({
            "tabela_destino": "pontos_atencao",
            "fonte": "script_manual",
            "versao": datetime.now(timezone.utc).strftime("%Y%m%d"),
            "registros_lidos": len(PONTOS_ATENCAO),
            "registros_inseridos": inseridos,
            "registros_erro": erros,
            "status": "ok" if erros == 0 else "parcial",
            "executado_por": "import_pontos_atencao.py",
        }).execute()
    except Exception as e:
        print(f"  (aviso: sync_log não atualizado: {e})")

    print(f"\n{'─' * 65}")
    print(f"  Resultado: {inseridos} inseridos | {erros} erros")
    print(f"{'─' * 65}\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Importar pontos de atenção para Supabase")
    parser.add_argument("--dry-run", action="store_true", help="Listar sem gravar")
    parser.add_argument("--limpar", action="store_true", help="Apagar registros existentes")
    args = parser.parse_args()
    import_pontos(dry_run=args.dry_run, limpar=args.limpar)
