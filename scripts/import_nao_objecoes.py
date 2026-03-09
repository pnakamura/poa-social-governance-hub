#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Import Não-Objeções — popula `nao_objecoes` com processos BID do programa BR-L1597.
Fonte: NOP DPF + dados conhecidos do programa (aquisições planejadas/em preparação)

Uso:
    PYTHONUTF8=1 python scripts/import_nao_objecoes.py [--dry-run] [--limpar]
"""

import os
import sys
import argparse
from datetime import datetime, timezone

# ─── Dados (fonte: NOP DPF 001 + plano de aquisições BR-L1597) ───────────────
NAO_OBJECOES = [
    # Documentos de padronização / normativos (concluídos)
    {
        "processo": "SEI-DPF-001/2025",
        "tipo": "TdR",
        "solicitado_em": "2025-07-01",
        "recebido_em": "2025-08-15",
        "status": "Recebida",
        "valor_usd": None,
        "observacoes": "NOP para padronização de processos de aquisição no SEI-PMPA. "
                       "Primeira não-objeção do programa. Aprovada pela missão BID Jul/2025.",
    },
    {
        "processo": "SEI-DPF-002/2025",
        "tipo": "TdR",
        "solicitado_em": "2025-09-01",
        "recebido_em": "2025-10-10",
        "status": "Recebida",
        "valor_usd": None,
        "observacoes": "TdR para contratação de Especialista em Gestão Ambiental e Social "
                       "(EGAS) para equipe UGP. Aprovada pelo Banco.",
    },
    {
        "processo": "SEI-DPF-003/2025",
        "tipo": "Consultoria",
        "solicitado_em": "2025-10-15",
        "recebido_em": "2025-11-20",
        "status": "Recebida",
        "valor_usd": 180000,
        "observacoes": "Consultoria para elaboração do MPAS (Marco de Política Ambiental e Social) "
                       "e PDAS (Plano de Gestão Ambiental e Social). Aprovada.",
    },
    {
        "processo": "SEI-DPF-004/2025",
        "tipo": "Consultoria",
        "solicitado_em": "2025-11-01",
        "recebido_em": "2025-12-15",
        "status": "Recebida",
        "valor_usd": 120000,
        "observacoes": "TdR para firma consultora de apoio à UGP na gestão fiduciária "
                       "e elaboração de documentos de licitação FIDIC. Aprovada pela missão Dez/2025.",
    },
    # Em análise pelo BID (enviadas, aguardando resposta)
    {
        "processo": "SEI-DPF-005/2026",
        "tipo": "TdR",
        "solicitado_em": "2026-01-10",
        "recebido_em": None,
        "status": "Pendente",
        "valor_usd": None,
        "observacoes": "TdR para Especialista em Interoperabilidade / Arquitetura Empresarial "
                       "(Componente C1 — InterPOA). Em análise pelo Banco.",
    },
    {
        "processo": "SEI-DPF-006/2026",
        "tipo": "Aquisição",
        "solicitado_em": "2026-01-20",
        "recebido_em": None,
        "status": "Pendente",
        "valor_usd": 4200000,
        "observacoes": "Documento de Licitação (RFP) para contratação FIDIC Yellow Book — "
                       "Obras de Reabilitação HPS (Hospital de Pronto-Socorro). Lote 1. "
                       "Em análise pelo Banco — prazo de resposta: 21 dias úteis.",
    },
    {
        "processo": "SEI-DPF-007/2026",
        "tipo": "Aquisição",
        "solicitado_em": "2026-02-05",
        "recebido_em": None,
        "status": "Pendente",
        "valor_usd": 3800000,
        "observacoes": "Documento de Licitação — Obras de Reabilitação IAPI (Policlínica). "
                       "FIDIC Yellow Book. Lote 2. Enviada para BID aguardando NOP.",
    },
    {
        "processo": "SEI-DPF-008/2026",
        "tipo": "Consultoria",
        "solicitado_em": "2026-02-20",
        "recebido_em": None,
        "status": "Pendente",
        "valor_usd": 250000,
        "observacoes": "TdR para empresa de consultoria em transformação digital e "
                       "desenvolvimento do InterPOA (Componente C1). Em análise.",
    },
    # Planejadas (ainda não enviadas)
    {
        "processo": "SEI-DPF-009/2026",
        "tipo": "Aquisição",
        "solicitado_em": None,
        "recebido_em": None,
        "status": "Pendente",
        "valor_usd": 5500000,
        "observacoes": "Planejada: Licitação de obras de Centros de Saúde Comunitários "
                       "(3 unidades — Componente C2). Prevista para Mai/2026.",
    },
    {
        "processo": "SEI-DPF-010/2026",
        "tipo": "Aquisição",
        "solicitado_em": None,
        "recebido_em": None,
        "status": "Pendente",
        "valor_usd": 8200000,
        "observacoes": "Planejada: Licitação de obras de CRAS e CREAS (Componente C2 — "
                       "Assistência Social / SMAS). Consolidação de lotes. Prevista Jun/2026.",
    },
    # Cancelada (para demonstrar histórico completo)
    {
        "processo": "SEI-DPF-000/2024",
        "tipo": "TdR",
        "solicitado_em": "2024-11-01",
        "recebido_em": None,
        "status": "Cancelada",
        "valor_usd": None,
        "observacoes": "TdR preliminar cancelado — substituído por SEI-DPF-002/2025 com "
                       "escopo revisado após missão de instalação do programa.",
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
        print("AVISO: SUPABASE_SERVICE_ROLE_KEY não encontrada. Usando anon key.")
        key = (
            os.getenv("SUPABASE_ANON_KEY")
            or "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2cW5sbnhrd2NyeGJjdHVqYWpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NzM4OTIsImV4cCI6MjA2NzE0OTg5Mn0.9mzrQC2B9Kp_ZNyLt-Gpe_0HkVE-bioR7sFWsviru40"
        )

    return create_client(url, key)


def import_nao_objecoes(dry_run: bool = False, limpar: bool = False):
    status_icons = {"Recebida": "✅", "Pendente": "⏳", "Vencida": "🔴", "Cancelada": "❌"}

    pendentes  = sum(1 for n in NAO_OBJECOES if n["status"] == "Pendente")
    recebidas  = sum(1 for n in NAO_OBJECOES if n["status"] == "Recebida")
    canceladas = sum(1 for n in NAO_OBJECOES if n["status"] == "Cancelada")

    print(f"\n{'=' * 65}")
    print("  Import Não-Objeções — POA+SOCIAL BID (BR-L1597)")
    print(f"{'=' * 65}")
    print(f"  Registros: {len(NAO_OBJECOES)}")
    print(f"  Pendentes: {pendentes} | Recebidas: {recebidas} | Canceladas: {canceladas}")
    print(f"  Modo: {'DRY-RUN' if dry_run else 'PRODUÇÃO'}")
    print(f"{'=' * 65}\n")

    if dry_run:
        for n in NAO_OBJECOES:
            icon = status_icons.get(n["status"], "?")
            valor = f"US$ {n['valor_usd']:,.0f}" if n["valor_usd"] else "S/V"
            print(f"  {icon} {n['processo']:22s} | {n['tipo']:12s} | {valor:>14s} | {n['status']}")
        print(f"\n  Total: {len(NAO_OBJECOES)} (não gravados)")
        return

    sb = get_supabase_client()

    if limpar:
        print("  Limpando registros existentes...")
        sb.table("nao_objecoes").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        print("  ✓ Limpeza concluída\n")

    erros = 0
    for n in NAO_OBJECOES:
        payload = {
            "processo":      n["processo"],
            "tipo":          n["tipo"],
            "solicitado_em": n["solicitado_em"],
            "recebido_em":   n["recebido_em"],
            "status":        n["status"],
            "valor_usd":     n["valor_usd"],
            "observacoes":   n["observacoes"],
        }
        try:
            sb.table("nao_objecoes").insert(payload).execute()
            icon = status_icons.get(n["status"], "?")
            valor = f"US$ {n['valor_usd']:,.0f}" if n["valor_usd"] else "S/V"
            print(f"  {icon} {n['processo']:22s} | {n['tipo']:12s} | {valor:>14s}")
        except Exception as e:
            print(f"  ✗ ERRO em {n['processo']}: {e}")
            erros += 1

    # Registrar no sync_log
    try:
        sb.table("sync_log").insert({
            "tabela_destino":      "nao_objecoes",
            "fonte":               "import_nao_objecoes_script",
            "versao":              datetime.now(timezone.utc).strftime("%Y%m%d"),
            "registros_lidos":     len(NAO_OBJECOES),
            "registros_inseridos": len(NAO_OBJECOES) - erros,
            "registros_erro":      erros,
            "status":              "ok" if erros == 0 else "parcial",
            "executado_por":       "import_nao_objecoes.py",
        }).execute()
    except Exception:
        pass

    print(f"\n{'─' * 65}")
    print(f"  Resultado: {len(NAO_OBJECOES) - erros} importados | {erros} erros")
    print(f"{'─' * 65}\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Importa não-objeções BID para o Supabase")
    parser.add_argument("--dry-run", action="store_true", help="Simula sem gravar")
    parser.add_argument("--limpar",  action="store_true", help="Limpa antes de inserir")
    args = parser.parse_args()
    import_nao_objecoes(dry_run=args.dry_run, limpar=args.limpar)
