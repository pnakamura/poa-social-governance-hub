

## Reestruturação da Página /riscos — Níveis Estratégico, Tático e Operacional

### Situação Atual
- A tabela `riscos` contém riscos globais do programa, sem distinção de nível (estratégico/tático/operacional).
- A tabela `pep_riscos` contém riscos vinculados a itens PEP individuais (nível operacional).
- Não existe link entre `pep_riscos` e `riscos` (o campo `risco_global_id` em `pep_riscos` existe mas não é usado de forma sistemática).

### Arquitetura Proposta

```text
┌─────────────────────────────────────────────────┐
│  /riscos — Tabs: Estratégico │ Tático │ Operacional │
├─────────────────┬───────────────┬───────────────┤
│  Tab Estratégico│  Tab Tático   │ Tab Operac.   │
│  riscos onde    │  riscos onde  │ pep_riscos    │
│  tipo='Estrat.' │  tipo='Tático'│ (read-only,   │
│  CRUD normal    │  CRUD normal  │  link p/ PEP) │
│  + Heatmap      │  + Heatmap    │  + Heatmap    │
└─────────────────┴───────────────┴───────────────┘
```

### Alterações

**1. Migration SQL** — adicionar coluna `tipo` à tabela `riscos`:
```sql
ALTER TABLE public.riscos 
  ADD COLUMN tipo text NOT NULL DEFAULT 'Estratégico';
-- Valores: 'Estratégico', 'Tático', 'Operacional'
```

**2. `src/lib/supabase.ts`** — atualizar tipo `Risco`:
- Adicionar campo `tipo: 'Estratégico' | 'Tático' | 'Operacional'`

**3. `src/lib/queries/risks.ts`** — novo hook `useRiscosByTipo(tipo)`:
- Filtra riscos por tipo
- Hook separado `usePepRiscosAll()` que busca todos os `pep_riscos` com join em `pep_entries` para obter `codigo_wbs` e `descricao`

**4. `src/pages/Risks.tsx`** — reestruturar com Tabs:
- **Tab Estratégico**: heatmap 5x5 + registro CRUD (riscos onde `tipo='Estratégico'`). Categorias: Político, Institucional, Financeiro, etc.
- **Tab Tático**: heatmap 5x5 + registro CRUD (riscos onde `tipo='Tático'`). Categorias: mesmas.
- **Tab Operacional**: 
  - Dados vindos de `pep_riscos` (somente leitura nesta página)
  - Heatmap agregado convertendo probabilidade/impacto textual para numérico (Muito Baixa=1...Muito Alta=5)
  - Lista com link clicável para o cockpit PEP (`/pep/:wbs`)
  - Badge mostrando o WBS e descrição do item PEP associado
- Dialog de criação/edição ganha campo "Tipo" (Estratégico/Tático) — não permite criar Operacional aqui (esses vêm do cockpit PEP)
- KPI cards no topo: total por nível, separados por tab ativa

**5. Mapeamento de escala `pep_riscos` → numérico** (para heatmap operacional):
```text
Muito Baixa/o = 1, Baixa/o = 2, Média/o = 3, Alta/o = 4, Muito Alta/o = 5
```

### Arquivos Modificados (4)
1. Nova migration SQL (add `tipo` column)
2. `src/lib/supabase.ts` — tipo `Risco`
3. `src/lib/queries/risks.ts` — hooks por tipo + hook `usePepRiscosAll`
4. `src/pages/Risks.tsx` — layout com Tabs, tab operacional read-only com links PEP

