

## Painel de Impedimentos no Dashboard + Melhorias UX/UI

### O que será feito

1. **Novo painel "Impedimentos PEP"** na seção Execução — busca todos os impedimentos não resolvidos de `pep_impedimentos`, cruza com `pep_entries` para mostrar o código WBS e descrição, e exibe como lista com link para o cockpit.

2. **Nova query `useImpedimentosAbertos`** em `src/lib/queries/pep-gestao.ts` — faz join de `pep_impedimentos` (resolvido=false) com `pep_entries` para trazer `codigo_wbs` e `descricao`.

3. **Melhorias gerais de UX/UI no Dashboard**:
   - Reorganizar seção Execução para grid de 3 colunas (PMR | Atividades | Impedimentos)
   - Adicionar contagem de impedimentos abertos no KPI bar (substituir ou adicionar ao lado de "Em Atraso")
   - Melhorar espaçamento e consistência visual dos cards
   - Adicionar ícone de link nos marcos para navegação

### Alterações por arquivo

| Arquivo | Ação |
|---|---|
| `src/lib/queries/pep-gestao.ts` | Adicionar hook `useImpedimentosAbertos()` que busca impedimentos não resolvidos com WBS |
| `src/pages/Dashboard.tsx` | (1) Importar e usar `useImpedimentosAbertos`; (2) Adicionar card de impedimentos na seção Execução; (3) Reorganizar grid para acomodar 3 cards; (4) Melhorias visuais gerais |

### UI do painel de Impedimentos

Card com lista dos impedimentos abertos, cada item mostrando:
- Código WBS como badge linkável para `/pep/:wbs`
- Texto do impedimento (truncado)
- Data de criação
- Contagem total no header

Se não houver impedimentos, exibir estado vazio positivo ("Nenhum impedimento ativo").

