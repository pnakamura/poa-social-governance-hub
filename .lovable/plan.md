

## Plano: Filtro por Secretaria e revisão dos Desembolsos

### 1. Migração: adicionar coluna `secretaria` à tabela `pep_entries`

```sql
ALTER TABLE public.pep_entries ADD COLUMN IF NOT EXISTS secretaria text;
```

### 2. Edge Function: importar coluna Y (index 24)

Na função `sync-pep-sheets/index.ts`, adicionar no mapeamento de cada row:
```ts
secretaria: ncols > 24 ? txt(row[24]) : null,
```

### 3. Tipo PepEntry: adicionar campo

Em `src/lib/supabase.ts`, adicionar `secretaria: string | null` ao tipo `PepEntry`.

### 4. Filtro global por Secretaria no nível da página

Mover o estado `filtroSecretaria` para o componente `PEPPage` (junto com `moeda` e `versao`) e passá-lo como prop para todas as 4 abas. A lista de secretarias será derivada dos dados (`entries`). O Select ficará na barra de controles do topo (ao lado do toggle USD/BRL).

### 5. Aplicar filtro em cada aba

- **Hierarquia**: filtrar `rawEntries` por `secretaria` antes de processar. Como apenas PT rows terão secretaria, mostrar também as linhas-pai (C, P, SP) que contenham pelo menos um PT da secretaria selecionada.
- **Cronograma Físico**: filtrar `rows` por `secretaria`.
- **Desembolsos**: atualmente busca apenas ref='C' (componentes). Precisa ser revisado para usar dados de PT quando filtro de secretaria estiver ativo, ou filtrar os dados do `entries` já carregado.
- **PMR**: filtrar `pepByPmrRef` pela secretaria dos PepEntry associados.

### 6. Revisão dos Desembolsos

O tab Desembolsos atualmente só mostra linhas ref='C' com dados agregados por componente. Problemas:
- Não permite filtrar por secretaria (C rows não têm secretaria)
- Quando a moeda é BRL, continua mostrando valores USD (os campos `desembolso_*` são em USD)

Correção: alterar a query `usePEPDesembolhos` para buscar também linhas PT com desembolsos, permitindo agregação por secretaria. Quando não há filtro de secretaria, manter a visão por componente. Quando há filtro, agregar os PT da secretaria selecionada.

Alternativamente, usar `entries` (já carregados na página) para calcular desembolsos filtrados no frontend, evitando query adicional.

### Resumo das mudanças

| Arquivo | Mudança |
|---|---|
| Migration SQL | Adicionar coluna `secretaria` |
| `sync-pep-sheets/index.ts` | Importar `row[24]` como `secretaria` |
| `src/lib/supabase.ts` | Adicionar `secretaria` ao tipo |
| `src/pages/PEP/index.tsx` | Filtro global de secretaria no topo, passado como prop para todas as abas; Desembolsos revisado para usar entries filtrados |
| `src/lib/queries/pep.ts` | Ajustar `usePEPDesembolhos` para incluir `secretaria` no select |

