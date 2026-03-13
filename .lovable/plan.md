

## Plano: Cronograma Físico-Financeiro com Gantt no Cockpit PEP

### Contexto

O dicionário de dados confirma que a planilha tem colunas de datas mensais (ex: 2025-01-01, 2025-02-01...) representando séries temporais de desembolso planejado. Atualmente esses dados estão "pivotados" em colunas anuais (`desembolso_2025..2029`). A solicitação é normalizar isso e criar uma visualização Gantt no cockpit de cada item PEP.

### 1. Novas tabelas no Supabase (migration)

**`pep_cronograma_financeiro`** — série temporal normalizada (unpivot):
```sql
CREATE TABLE pep_cronograma_financeiro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pep_entry_id UUID NOT NULL REFERENCES pep_entries(id) ON DELETE CASCADE,
  periodo DATE NOT NULL,            -- ex: 2025-01-01, 2025-02-01
  valor_planejado NUMERIC DEFAULT 0,
  valor_realizado NUMERIC DEFAULT 0,
  moeda TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(pep_entry_id, periodo, moeda)
);
```

**`pep_tarefas`** — tarefas/fases do Gantt por item PEP:
```sql
CREATE TABLE pep_tarefas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pep_entry_id UUID NOT NULL REFERENCES pep_entries(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  fase TEXT NOT NULL,               -- 'planejamento', 'licitacao', 'contratacao', 'execucao', 'entrega'
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  progresso INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pendente',   -- 'pendente', 'em_andamento', 'concluida', 'atrasada'
  responsavel TEXT,
  notas TEXT,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

RLS: `public_all` (mesmo padrão das tabelas existentes).

### 2. Dados de simulação para WBS 2.1.1.1 (Beco do Adelar — UBS)

Inserir via migration/insert:

**Tarefas Gantt** (fases típicas de obra BID):
| Fase | Título | Início | Fim | Cor |
|------|--------|--------|-----|-----|
| Planejamento | Elaboração do TR | 2025-01 | 2025-03 | azul |
| Planejamento | Aprovação Não-Objeção BID | 2025-03 | 2025-04 | azul |
| Licitação | Publicação do edital (LPN) | 2025-04 | 2025-05 | amarelo |
| Licitação | Avaliação de propostas | 2025-05 | 2025-07 | amarelo |
| Contratação | Adjudicação e contrato | 2025-07 | 2025-08 | laranja |
| Execução | Mobilização e canteiro | 2025-08 | 2025-09 | verde |
| Execução | Construção da UBS | 2025-09 | 2026-06 | verde |
| Execução | Instalações e acabamento | 2026-06 | 2026-09 | verde |
| Entrega | Vistoria e aceite provisório | 2026-09 | 2026-10 | roxo |
| Entrega | Aceite definitivo | 2026-10 | 2026-12 | roxo |

**Cronograma financeiro**: distribuir valores mensais planejados ao longo de 2025-2026.

### 3. Queries e hooks (`src/lib/queries/pep-gestao.ts`)

Adicionar:
- `usePepTarefas(entryId)` — lista tarefas do item
- `useCreatePepTarefa()`, `useUpdatePepTarefa()`, `useDeletePepTarefa()` — CRUD
- `usePepCronogramaFinanceiro(entryId)` — série temporal

### 4. Componente Gantt (`src/components/PepGanttChart.tsx`)

Gantt chart renderizado com HTML/CSS puro (barras horizontais):
- Eixo X = timeline mensal
- Cada linha = uma tarefa
- Cores por fase (azul, amarelo, laranja, verde, roxo)
- Barra de progresso dentro de cada task
- Tooltip com detalhes ao hover

### 5. Integração no cockpit (`src/pages/PEP/Detalhe.tsx`)

Adicionar nova seção "Cronograma Físico-Financeiro" entre o Painel Financeiro e a Gestão da Execução:
- Gantt chart com as fases
- Botões para criar/editar/excluir tarefas (dialog modal)
- Mini-gráfico de barras com desembolso mensal planejado vs realizado abaixo do Gantt

### Resumo de arquivos a criar/modificar

| Arquivo | Ação |
|---------|------|
| `supabase/migrations/` | Nova migration (2 tabelas + RLS + dados simulados) |
| `src/lib/queries/pep-gestao.ts` | Adicionar hooks de tarefas e cronograma |
| `src/components/PepGanttChart.tsx` | Novo componente Gantt |
| `src/pages/PEP/Detalhe.tsx` | Integrar seção de cronograma |

