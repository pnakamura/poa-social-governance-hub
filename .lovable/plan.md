

## Plano: Remodelar /pep/analise — Dashboard Analítico Visual

### Objetivo
Reescrever a página de análise PEP com dados reais do Supabase, gráficos interativos com filtros próprios, explicações contextuais e UX moderna.

### Dados Disponíveis (Supabase)
- `pep_entries` — hierarquia WBS completa (C/P/SP/PT), valores financeiros (BID/Local/Total atual vs base), desembolsos anuais, entregas físicas, tipo/método aquisição
- `pep_gestao` — status, progresso, nível risco, visibilidade por item
- `pep_impedimentos` — bloqueios pendentes/resolvidos
- `pep_riscos` — riscos operacionais por item
- `pmr_outputs` / `pmr_outcomes` — indicadores PMR com correlação via `pmr_ref`

### Arquitetura da Nova Página

**Filtros Globais (barra superior sticky)**
- Componente (C1..Cn ou Todos)
- Secretaria Responsável (dropdown)
- Lote (dropdown)
- Os filtros afetam todos os gráficos e KPIs simultaneamente

**Seções da Página (com explicações inline)**

| # | Seção | Conteúdo | Tipo Visual |
|---|-------|----------|-------------|
| 1 | KPIs Executivos | Total PTs, entregas 2025, variação vs base, desembolso 2025, impedimentos abertos, PTs sem método | Cards com ícones e trend |
| 2 | Entregas Físicas por Ano | Distribuição de PTs com entrega por ano | BarChart com destaque 2025 |
| 3 | Curva de Desembolso | Fluxo anual + acumulado | AreaChart combo |
| 4 | Variação Orçamentária | Delta % por componente (atual vs base) | Horizontal BarChart com referência zero |
| 5 | Pipeline Aquisições | Por método BID (count + valor) | BarChart horizontal + legenda expandida |
| 6 | Distribuição Tipo Aquisição | Donut chart com legenda lateral | PieChart + lista |
| 7 | Saúde da Execução | Progresso médio por componente (dados pep_gestao), impedimentos abertos, riscos ativos | BarChart + mini-cards |
| 8 | Concentração Financeira | Top 8 PTs por valor | Lista rankeada com barras |
| 9 | Correlação PEP×PMR | Outputs mapeados vs não mapeados | Cards com listas |
| 10 | PTs Críticos 2025 | Tabela detalhada | Table responsiva |

**Melhorias UX/UI**
- Cada seção tem um `InfoTooltip` com explicação do que o gráfico mostra e por que importa
- Tooltips ricos nos gráficos (valor, %, contexto)
- Filtros com contadores de itens afetados
- Loading skeletons por seção (não tudo de uma vez)
- Cards com hover-lift e cores semânticas
- Seção "Saúde da Execução" nova — cruza dados de `pep_gestao` + `pep_impedimentos` + `pep_riscos`

### Dados Novos a Integrar
- `pep_gestao` (progresso médio, status distribution)
- `pep_impedimentos` (count abertos por componente)
- `pep_riscos` (count ativos por componente)

### Queries Necessárias
- Já existentes: `usePEPEntries`, `usePMROutputs`
- Novas queries inline (dentro do `useMemo`): agregar `pep_gestao`, `pep_impedimentos`, `pep_riscos` em batch
- Ou criar hooks dedicados: `useAllPepGestao()`, `useAllPepImpedimentos()`, `useAllPepRiscos()` em `pep-gestao.ts`

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/lib/queries/pep-gestao.ts` | Adicionar `useAllPepGestao()`, `useAllPepImpedimentos()`, `useAllPepRiscos()` |
| `src/pages/PEP/Analise.tsx` | Reescrever completamente com filtros, novas seções, tooltips, dados gestão |

### Não necessita migration SQL
Todos os dados já existem nas tabelas. Apenas novas queries de leitura.

