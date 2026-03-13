

## Plano de Migração: Supabase como Fonte Única (PEP + PMR)

### Fonte de dados

A planilha consolidada para sincronização é:

**URL**: `https://docs.google.com/spreadsheets/d/1XRIb1og8sphXhOtdkbOd8U1G3OuL8508`

**ID**: `1XRIb1og8sphXhOtdkbOd8U1G3OuL8508`

Esta planilha substitui a anterior (`1C6uIqjqwpgToNWm3YqliqKzb2gPb8cHC`) e contém 3 abas relevantes:
- **PEP RS** — hierarquia, financeiro, cronograma
- **PMR-Outputs** — indicadores de produto (dados a partir da linha 5, colunas B-N)
- **PMR-Outcomes** — indicadores de resultado (dados a partir da linha 6, colunas B-N)

---

### Fase 1: Migration SQL — UNIQUE constraints

Arquivo: `supabase/migrations/xxx_upsert_constraints.sql`

```sql
ALTER TABLE pep_entries 
  ADD CONSTRAINT pep_entries_wbs_versao_uk UNIQUE (codigo_wbs, versao);

ALTER TABLE pmr_outputs 
  ADD CONSTRAINT pmr_outputs_codigo_uk UNIQUE (codigo);

ALTER TABLE pmr_outcomes 
  ADD CONSTRAINT pmr_outcomes_codigo_uk UNIQUE (codigo);
```

---

### Fase 2: Refatorar `sync-pep-sheets` → UPSERT

Arquivo: `supabase/functions/sync-pep-sheets/index.ts`

- Atualizar `SPREADSHEET_ID` para `1XRIb1og8sphXhOtdkbOd8U1G3OuL8508`
- Substituir `DELETE + INSERT` por `UPSERT` com `onConflict: 'codigo_wbs,versao'`
- Excluir `resumo_executivo` do payload para preservar edições manuais
- Manter registro em `sync_log`

---

### Fase 3: Nova Edge Function `sync-pmr-sheets`

Arquivo: `supabase/functions/sync-pmr-sheets/index.ts`

Lê as abas PMR-Outputs e PMR-Outcomes da **mesma planilha** (`1XRIb1og8sphXhOtdkbOd8U1G3OuL8508`) via CSV e faz UPSERT:

**Outputs** (aba "PMR-Outputs", dados linha 5+):
- Colunas: B=codigo, C=descricao, D=unidade, E=linha_base, H=meta_periodo, M=meta_contrato
- UPSERT por `codigo`, **não sobrescreve** `realizado` e `pct_realizado`

**Outcomes** (aba "PMR-Outcomes", dados linha 6+):
- Colunas: B=codigo, D=descricao(PT), E=unidade, F=linha_base, M=meta_contrato, N=fonte_dados
- UPSERT por `codigo`, **não sobrescreve** `realizado` e `pct_realizado`

Registrar em `supabase/config.toml`:
```toml
[functions.sync-pmr-sheets]
verify_jwt = false
```

---

### Fase 4: Mutations PMR + Edição inline

Arquivo: `src/lib/queries/pmr.ts`
- `useUpdatePMROutput(id, { realizado, pct_realizado })`
- `useUpdatePMROutcome(id, { realizado, pct_realizado })`

Arquivos: `src/pages/PMR/Outputs.tsx` e `Outcomes.tsx`
- Clique na linha → campos `realizado` e `pct_realizado` editáveis inline
- Auto-cálculo: `pct_realizado = (realizado / meta_contrato) * 100`

---

### Fase 5: Botão Sync PMR no Settings

Arquivo: `src/pages/Settings.tsx`
- Adicionar botão "Sincronizar PMR" que chama `sync-pmr-sheets`
- Atualizar link da planilha para a nova URL
- Mostrar resultado (sucesso/erro) com toast

---

### Resumo de arquivos

| Arquivo | Ação |
|---|---|
| `supabase/migrations/xxx_upsert_constraints.sql` | **Novo** — UNIQUE constraints |
| `supabase/functions/sync-pep-sheets/index.ts` | Atualizar SPREADSHEET_ID + UPSERT |
| `supabase/functions/sync-pmr-sheets/index.ts` | **Novo** — sync PMR Outputs/Outcomes |
| `supabase/config.toml` | Registrar `sync-pmr-sheets` |
| `src/lib/queries/pmr.ts` | Mutations de update |
| `src/pages/PMR/Outputs.tsx` | Edição inline |
| `src/pages/PMR/Outcomes.tsx` | Edição inline |
| `src/pages/Settings.tsx` | Botão sync PMR + nova URL |

