

## Plano: Atualização automática em tempo real no cockpit PEP

### Problema
Quando uma alteração ocorre (gestão, impedimentos, histórico, riscos, tarefas, SEI), a página não reflete automaticamente — o usuário precisa recarregar manualmente.

### Solução
Adicionar um único `useEffect` no componente `PEPDetalhePage` que cria canais Supabase Realtime para todas as tabelas relevantes. Quando qualquer INSERT/UPDATE/DELETE ocorrer, os query keys correspondentes são invalidados e o React Query refaz o fetch automaticamente.

Tabelas monitoradas:
- `pep_gestao` → invalida `['pep_gestao', entryId]`
- `pep_impedimentos` → invalida `['pep_impedimentos', entryId]`
- `pep_historico` → invalida `['pep_historico', entryId]`
- `pep_riscos` → invalida `['pep_riscos', entryId]`
- `pep_tarefas` → invalida `['pep_tarefas', entryId]`
- `pep_sei` → invalida `['pep_sei', entryId]`
- `pep_cronograma_financeiro` → invalida `['pep_cronograma_financeiro', entryId]`

### Arquivo a modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/PEP/Detalhe.tsx` | Importar `useEffect`, `useQueryClient`, `supabase`; adicionar useEffect com subscriptions Realtime (antes dos early returns, após os hooks existentes) |

O hook `useRealtimeQuery` já existe mas não será usado aqui — é mais eficiente criar um único canal multi-tabela no componente do que converter cada hook individual.

