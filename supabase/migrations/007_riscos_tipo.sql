-- Migration 007: Adicionar coluna componente à tabela riscos
-- (tipo já existe via migration 20260311193229 — ADD COLUMN IF NOT EXISTS é idempotente)

ALTER TABLE riscos
  ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'Estratégico';

ALTER TABLE riscos
  ADD COLUMN IF NOT EXISTS componente TEXT DEFAULT 'Geral';
