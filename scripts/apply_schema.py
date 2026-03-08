#!/usr/bin/env python3
"""
Aplica o schema SQL inicial no Supabase via pg connection.

Uso:
  pip install psycopg2-binary
  python scripts/apply_schema.py

Alternativa (sem psycopg2):
  Copiar conteúdo de supabase/migrations/001_initial_schema.sql
  e colar no Supabase Dashboard → SQL Editor → Run
"""
import os, sys, pathlib

MIGRATION_FILE = pathlib.Path(__file__).parent.parent / "supabase/migrations/001_initial_schema.sql"

# Supabase project info
PROJECT_REF = "dvqnlnxkwcrxbctujajl"
DB_PASSWORD = os.environ.get("SUPABASE_DB_PASSWORD", "")

if not DB_PASSWORD:
    print("=" * 60)
    print("INSTRUÇÃO: Aplique o schema manualmente no Supabase Dashboard")
    print("=" * 60)
    print()
    print("1. Acesse: https://supabase.com/dashboard/project/dvqnlnxkwcrxbctujajl")
    print("2. Vá em: SQL Editor → New query")
    print("3. Cole o conteúdo do arquivo:")
    print(f"   {MIGRATION_FILE}")
    print("4. Clique em 'Run'")
    print()
    print("OU defina a variável SUPABASE_DB_PASSWORD e execute novamente:")
    print("  $env:SUPABASE_DB_PASSWORD='sua-senha' ; python scripts/apply_schema.py")
    print()

    # Show the SQL
    print("-" * 60)
    print("CONTEÚDO DO SCHEMA (para copiar):")
    print("-" * 60)
    print(MIGRATION_FILE.read_text(encoding="utf-8"))
    sys.exit(0)

try:
    import psycopg2
    conn_str = f"postgresql://postgres.{PROJECT_REF}:{DB_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
    print(f"Conectando ao Supabase...")
    conn = psycopg2.connect(conn_str)
    conn.autocommit = True
    cur = conn.cursor()
    sql = MIGRATION_FILE.read_text(encoding="utf-8")
    cur.execute(sql)
    print("✓ Schema aplicado com sucesso!")
    conn.close()
except ImportError:
    print("psycopg2 não encontrado. Instale com: pip install psycopg2-binary")
    sys.exit(1)
except Exception as e:
    print(f"Erro: {e}")
    sys.exit(1)
