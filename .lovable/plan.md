

## Reduzir ruído informacional nos KPIs da página /pep

### Problema identificado
Quando um filtro está ativo, a página exibe **três linhas** de cartões KPI:
1. **Totais Globais do Programa** (linhas 1184-1202 do `PEPPage`)
2. **Totais Filtrados** (linhas 1204-1227 do `PEPPage`)
3. **Totais do componente** dentro do `HierarchyTab` (linhas 421-434) — uma terceira linha redundante que recalcula totais a partir dos C rows filtrados

### Solução
Remover o bloco de KPI cards interno do `HierarchyTab` (linhas 421-434). Os totais globais e filtrados já são exibidos no nível da página principal, tornando a terceira linha redundante.

### Arquivo alterado
- `src/pages/PEP/index.tsx` — remover o grid de KPI cards (linhas ~421-434) e o `useMemo` de `totals` (linhas ~397-413) dentro do `HierarchyTab`

