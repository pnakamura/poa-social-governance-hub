

## Plano: Corrigir mapeamento da coluna Total Base (T → U)

### Problema
A planilha foi alterada e a coluna **Total Base** (campo `t_base`) mudou da coluna **T** (índice 19) para a coluna **U** (índice 20). O valor esperado é **149.690.000**.

### Alteração

**`supabase/functions/sync-pep-sheets/index.ts`** — linha 171:

```typescript
// Antes:
t_base: num(row[19]),

// Depois:
t_base: num(row[20]),
```

Verificar se as colunas adjacentes (R e S) também deslocaram. Se apenas T→U mudou, basta essa correção. Se R→S e S→T também deslocaram, ajustar `r_base` e `s_base` igualmente.

### Verificação após deploy
- Re-sincronizar via Settings
- Consultar no Supabase: soma de `t_base` para `ref='C'` deve ser ~149.690.000
- Confirmar que o KPI "Total Base" na página `/pep` exibe o valor correto

### Impacto em outros campos
Todos os índices de colunas após a 19 (secretaria, pmr_ref, física, desembolsos) precisam ser verificados — se uma coluna foi inserida antes de T, todos os índices subsequentes (24→25, 25→26, etc.) também precisam ser incrementados em 1.

