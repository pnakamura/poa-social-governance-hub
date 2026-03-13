

## Plano: Toggle de visibilidade por item PEP

### Objetivo
Cada item PEP no cockpit terá um toggle para controlar se ele aparece ou não na página `/pep`. Por padrão, todos são visíveis.

### Abordagem

**1. Migration: adicionar coluna `visivel_pep` na tabela `pep_gestao`**

```sql
ALTER TABLE pep_gestao ADD COLUMN visivel_pep boolean NOT NULL DEFAULT true;
```

Usar `pep_gestao` porque já existe uma relação 1:1 com `pep_entry_id` e é onde ficam os dados de gestão do cockpit.

**2. Atualizar tipos e hooks em `src/lib/queries/pep-gestao.ts`**
- Adicionar `visivel_pep: boolean` à interface `PepGestao`
- O hook `useUpsertPepGestao` já suporta upsert parcial, então o toggle funcionará naturalmente

**3. Adicionar Switch no cockpit (`src/pages/PEP/Detalhe.tsx`)**
- Colocar um `Switch` no cabeçalho do cockpit (ao lado do breadcrumb ou título) com label "Visível no PEP"
- Ao alternar, chama `upsertGestao.mutate({ pep_entry_id, visivel_pep: valor })`

**4. Filtrar itens ocultos na página `/pep` (`src/pages/PEP/index.tsx`)**
- Criar query adicional para buscar todos os `pep_gestao` onde `visivel_pep = false` (lista de IDs ocultos)
- Filtrar `entries` removendo os que têm `pep_entry_id` na lista de ocultos
- Aplicar antes dos filtros existentes (secretaria/lote)

### Arquivos a modificar

| Arquivo | Alteração |
|---------|-----------|
| Migration SQL | `ALTER TABLE pep_gestao ADD COLUMN visivel_pep boolean NOT NULL DEFAULT true` |
| `src/lib/queries/pep-gestao.ts` | Adicionar campo na interface + novo hook `useHiddenPepIds()` |
| `src/pages/PEP/Detalhe.tsx` | Switch "Visível no PEP" no cabeçalho |
| `src/pages/PEP/index.tsx` | Filtrar entries pelos IDs ocultos |

