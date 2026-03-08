#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Aplica a migration 002 (novas tabelas: marcos, pontos_atencao, aquisicoes, sync_log,
programa_contexto) no Supabase via conexão PostgreSQL direta.

Uso:
  $env:SUPABASE_DB_PASSWORD='sua-senha'
  PYTHONUTF8=1 python scripts/apply_migration_002.py

A senha do banco está em:
  Supabase Dashboard → Project Settings → Database → Connection string
  (campo "Password" ou use "Reset database password" para gerar uma nova)

Alternativa sem script:
  1. Acesse https://supabase.com/dashboard/project/dvqnlnxkwcrxbctujajl/sql/new
  2. Cole o conteúdo de supabase/migrations/002_contexto_marcos_temas.sql
  3. Clique em Run
"""
import os, sys, pathlib

MIGRATION_FILE = pathlib.Path(__file__).parent.parent / "supabase/migrations/002_contexto_marcos_temas.sql"
PROJECT_REF    = "dvqnlnxkwcrxbctujajl"
DB_PASSWORD    = os.environ.get("SUPABASE_DB_PASSWORD", "")

if not DB_PASSWORD:
    print("=" * 60)
    print("INSTRUÇÃO MANUAL — Supabase SQL Editor")
    print("=" * 60)
    print()
    print("1. Acesse:")
    print("   https://supabase.com/dashboard/project/dvqnlnxkwcrxbctujajl/sql/new")
    print()
    print("2. Cole TODO o conteúdo abaixo e clique em RUN:")
    print()
    print("-" * 60)
    print(MIGRATION_FILE.read_text(encoding="utf-8"))
    print("-" * 60)
    print()
    print("OU: defina SUPABASE_DB_PASSWORD e execute novamente:")
    print("  Windows PowerShell:")
    print("    $env:SUPABASE_DB_PASSWORD='sua-senha'")
    print("    PYTHONUTF8=1 python scripts/apply_migration_002.py")
    print()
    print("A senha está em: Supabase Dashboard → Settings → Database → Password")
    sys.exit(0)

try:
    import psycopg2
except ImportError:
    print("psycopg2 não encontrado. Instale com: pip install psycopg2-binary")
    sys.exit(1)

# Transaction pool (porta 6543) ou Session pool (porta 5432)
# Usar porta 5432 (session) para DDL
conn_str = (
    f"postgresql://postgres.{PROJECT_REF}:{DB_PASSWORD}"
    f"@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
)

print(f"Conectando ao Supabase ({PROJECT_REF})...")
try:
    conn = psycopg2.connect(conn_str)
    conn.autocommit = True
    cur  = conn.cursor()
    sql  = MIGRATION_FILE.read_text(encoding="utf-8")
    print(f"Aplicando migration 002...")
    cur.execute(sql)
    print("✓ Migration 002 aplicada com sucesso!")
    print("  Tabelas criadas: programa_contexto, marcos, pontos_atencao, aquisicoes, sync_log")
    print("  RLS habilitado com políticas de leitura pública")
    print("  Realtime habilitado em tabelas operacionais")
    conn.close()
except Exception as e:
    print(f"✗ Erro: {e}")
    print()
    print("Dica: Se a senha estiver errada, redefina em:")
    print("  Supabase Dashboard → Settings → Database → Reset database password")
    sys.exit(1)
