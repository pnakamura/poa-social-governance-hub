#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Import Contexto — popula programa_contexto com indicadores socioeconômicos de Porto Alegre.
Fonte: resumo-executivo-poa-social.html (dados extraídos manualmente)

Uso:
    PYTHONUTF8=1 python scripts/import_contexto.py [--dry-run]
"""

import os
import sys
import argparse
from datetime import datetime, timezone

# ─── Dados de contexto (fonte: resumo-executivo-poa-social.html, BID/IBGE) ───
DADOS_CONTEXTO = [
    # Demográficos
    {
        "categoria": "demografico",
        "indicador": "População total de Porto Alegre",
        "valor": 1500000,
        "valor_texto": "~1,5 milhão",
        "unidade": "habitantes",
        "fonte": "IBGE 2022",
        "ano_referencia": 2022,
        "notas": "7º maior PIB entre capitais brasileiras",
    },
    {
        "categoria": "economico",
        "indicador": "Ranking PIB entre capitais",
        "valor": 7,
        "valor_texto": "7º lugar",
        "unidade": "posição",
        "fonte": "IBGE 2021",
        "ano_referencia": 2021,
        "notas": None,
    },
    # Sociais
    {
        "categoria": "social",
        "indicador": "Famílias em pobreza extrema",
        "valor": 64395,
        "valor_texto": "64.395",
        "unidade": "famílias",
        "fonte": "PMPA 2021",
        "ano_referencia": 2021,
        "notas": "Equivale a ~13% da população",
    },
    {
        "categoria": "social",
        "indicador": "Taxa de pobreza extrema",
        "valor": 13.0,
        "valor_texto": "13%",
        "unidade": "%",
        "fonte": "PMPA 2021",
        "ano_referencia": 2021,
        "notas": None,
    },
    {
        "categoria": "social",
        "indicador": "Moradores de rua",
        "valor": 3368,
        "valor_texto": "3.368",
        "unidade": "pessoas",
        "fonte": "Censo de população de rua 2020",
        "ano_referencia": 2020,
        "notas": "Aumento de 59,2% entre 2016 e 2020",
    },
    {
        "categoria": "social",
        "indicador": "Crescimento de moradores de rua 2016-2020",
        "valor": 59.2,
        "valor_texto": "+59,2%",
        "unidade": "%",
        "fonte": "Censo de população de rua 2020",
        "ano_referencia": 2020,
        "notas": None,
    },
    {
        "categoria": "social",
        "indicador": "Crianças e adolescentes fora da escola (7-17 anos)",
        "valor": 6749,
        "valor_texto": "6.749",
        "unidade": "pessoas",
        "fonte": "SMED 2021",
        "ano_referencia": 2021,
        "notas": None,
    },
    {
        "categoria": "social",
        "indicador": "Jovens nem-nem (não estudam, não trabalham)",
        "valor": 8.7,
        "valor_texto": "8,7%",
        "unidade": "%",
        "fonte": "PMPA 2021",
        "ano_referencia": 2021,
        "notas": "Jovens que não estudam e não trabalham",
    },
    # Climático
    {
        "categoria": "climatico",
        "indicador": "Ano das enchentes que motivaram o programa",
        "valor": 2024,
        "valor_texto": "2024",
        "unidade": "ano",
        "fonte": "Prefeitura de Porto Alegre",
        "ano_referencia": 2024,
        "notas": "Enchentes de 2024 agravaram vulnerabilidades sociais e infraestrutura",
    },
    # Financeiro do programa
    {
        "categoria": "financeiro",
        "indicador": "Valor total do programa (BID + Local)",
        "valor": 161.0,
        "valor_texto": "US$ 161M",
        "unidade": "US$ milhões",
        "fonte": "Contrato N. 5750/OC-BR",
        "ano_referencia": 2024,
        "notas": None,
    },
    {
        "categoria": "financeiro",
        "indicador": "Financiamento BID",
        "valor": 128.8,
        "valor_texto": "US$ 128,8M",
        "unidade": "US$ milhões",
        "fonte": "Contrato N. 5750/OC-BR",
        "ano_referencia": 2024,
        "notas": "80% do valor total",
    },
    {
        "categoria": "financeiro",
        "indicador": "Contrapartida local PMPA",
        "valor": 32.2,
        "valor_texto": "US$ 32,2M",
        "unidade": "US$ milhões",
        "fonte": "Contrato N. 5750/OC-BR",
        "ano_referencia": 2024,
        "notas": "20% do valor total",
    },
    {
        "categoria": "financeiro",
        "indicador": "Prazo de execução do programa",
        "valor": 5,
        "valor_texto": "5 anos",
        "unidade": "anos",
        "fonte": "Contrato N. 5750/OC-BR",
        "ano_referencia": 2024,
        "notas": "Início: dezembro de 2024",
    },
    {
        "categoria": "financeiro",
        "indicador": "Prazo de amortização",
        "valor": 24.5,
        "valor_texto": "24,5 anos",
        "unidade": "anos",
        "fonte": "Contrato N. 5750/OC-BR",
        "ano_referencia": 2024,
        "notas": "Com 72 meses de carência; juros semestrais",
    },
]


def get_supabase_client():
    """Cria client Supabase com service role key."""
    try:
        from supabase import create_client
    except ImportError:
        print("ERRO: instale supabase: pip install 'supabase==2.15.0'")
        sys.exit(1)

    url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not url or not key:
        # Tentar .env.local
        env_file = os.path.join(os.path.dirname(__file__), "..", ".env.local")
        if os.path.exists(env_file):
            with open(env_file) as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("VITE_SUPABASE_URL="):
                        url = url or line.split("=", 1)[1].strip().strip('"')
                    elif line.startswith("SUPABASE_SERVICE_ROLE_KEY="):
                        key = key or line.split("=", 1)[1].strip().strip('"')

    if not url:
        url = "https://dvqnlnxkwcrxbctujajl.supabase.co"
    if not key:
        print("AVISO: SUPABASE_SERVICE_ROLE_KEY não encontrada. Usando anon key.")
        env_file2 = os.path.join(os.path.dirname(__file__), "..", ".env.local")
        if os.path.exists(env_file2):
            with open(env_file2) as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("VITE_SUPABASE_ANON_KEY="):
                        key = line.split("=", 1)[1].strip().strip('"')
                        break

    if not key:
        print("ERRO: Nenhuma chave Supabase encontrada.")
        sys.exit(1)

    return create_client(url, key)


def import_contexto(dry_run: bool = False):
    print(f"\n{'=' * 55}")
    print("  Import Contexto — POA+SOCIAL BID (BR-L1597)")
    print(f"{'=' * 55}")
    print(f"  Registros a importar: {len(DADOS_CONTEXTO)}")
    print(f"  Modo: {'DRY-RUN (sem escrita)' if dry_run else 'PRODUÇÃO'}")
    print(f"{'=' * 55}\n")

    if dry_run:
        for i, d in enumerate(DADOS_CONTEXTO, 1):
            print(f"  [{i:02d}] {d['categoria']:12s} | {d['indicador'][:50]}")
        print(f"\n  Total: {len(DADOS_CONTEXTO)} registros (não gravados)")
        return

    client = get_supabase_client()
    inseridos = 0
    atualizados = 0
    erros = 0

    for registro in DADOS_CONTEXTO:
        try:
            # Upsert por (indicador, ano_referencia) — constraint UNIQUE
            resp = (
                client.table("programa_contexto")
                .upsert(registro, on_conflict="indicador,ano_referencia")
                .execute()
            )
            if resp.data:
                atualizados += 1
            else:
                inseridos += 1
            print(f"  ✓ {registro['indicador'][:55]}")
        except Exception as e:
            erros += 1
            print(f"  ✗ ERRO [{registro['indicador'][:40]}]: {e}")

    # Registrar em sync_log
    try:
        client.table("sync_log").insert({
            "tabela_destino": "programa_contexto",
            "fonte": "script_manual",
            "versao": datetime.now(timezone.utc).strftime("%Y%m%d"),
            "registros_lidos": len(DADOS_CONTEXTO),
            "registros_inseridos": inseridos,
            "registros_atualizados": atualizados,
            "registros_erro": erros,
            "status": "ok" if erros == 0 else "parcial",
            "executado_por": "import_contexto.py",
        }).execute()
    except Exception as e:
        print(f"  (aviso: sync_log não atualizado: {e})")

    print(f"\n{'─' * 55}")
    print(f"  Resultado: {inseridos+atualizados} processados | {erros} erros")
    print(f"{'─' * 55}\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Importar contexto socioeconômico para Supabase")
    parser.add_argument("--dry-run", action="store_true", help="Apenas listar, sem gravar")
    args = parser.parse_args()
    import_contexto(dry_run=args.dry_run)
