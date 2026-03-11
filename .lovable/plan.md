

## Renomear campo `descricao` em `pep_riscos` para `titulo_risco`

### Problema
O campo `descricao` na tabela `pep_riscos` gera confusão com o campo `descricao` do item PEP (`pep_entries`). Ambos aparecem no cockpit.

### Solução
Renomear a coluna `descricao` para `titulo_risco` no banco e em todo o código.

### Alterações

**1. Migration SQL** — renomear coluna no banco:
```sql
ALTER TABLE public.pep_riscos RENAME COLUMN descricao TO titulo_risco;
```

**2. `src/lib/queries/pep-gestao.ts`**:
- Interface `PepRisco`: `descricao` → `titulo_risco`
- `useAddPepRisco`: payload field `descricao` → `titulo_risco`

**3. `src/pages/PEP/Detalhe.tsx`**:
- Estado `riscoForm`: `{ descricao: '' ... }` → `{ titulo_risco: '' ... }`
- `handleAddRisco`: referências a `riscoForm.descricao` → `riscoForm.titulo_risco`
- `handleVincularRiscoGlobal`: `descricao: risco.descricao` → `titulo_risco: risco.descricao` (mapeia do risco global)
- Input placeholder: "Descrição do risco..." → "Título do risco..."
- Renderização na lista: `risco.descricao` → `risco.titulo_risco`
- Botão disabled check: `!riscoForm.descricao.trim()` → `!riscoForm.titulo_risco.trim()`

### Arquivos (3)
1. Nova migration SQL
2. `src/lib/queries/pep-gestao.ts`
3. `src/pages/PEP/Detalhe.tsx`

