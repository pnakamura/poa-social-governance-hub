

## Plano: Página de Detalhes do Item PEP

### Visão Geral
Criar uma nova página `/pep/:wbs` que funciona como cockpit de gestão de cada item do PEP. Inclui dados financeiros read-only (da planilha), campos editáveis de gestão, controle de riscos/impedimentos, upload de evidências e histórico de alterações.

### 1. Migração SQL — Tabelas de Gestão

Três novas tabelas vinculadas pelo `pep_entry_id` (UUID da `pep_entries`):

```sql
-- Dados editáveis de gestão do item PEP
CREATE TABLE public.pep_gestao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pep_entry_id uuid NOT NULL REFERENCES public.pep_entries(id) ON DELETE CASCADE UNIQUE,
  status text NOT NULL DEFAULT 'nao_iniciado',  -- nao_iniciado, em_execucao, concluido, atrasado
  progresso integer NOT NULL DEFAULT 0 CHECK (progresso >= 0 AND progresso <= 100),
  data_inicio_real date,
  data_fim_previsto date,
  nivel_risco text DEFAULT 'baixo',  -- baixo, medio, alto
  notas text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Impedimentos / check-list
CREATE TABLE public.pep_impedimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pep_entry_id uuid NOT NULL REFERENCES public.pep_entries(id) ON DELETE CASCADE,
  descricao text NOT NULL,
  resolvido boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Histórico de alterações
CREATE TABLE public.pep_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pep_entry_id uuid NOT NULL REFERENCES public.pep_entries(id) ON DELETE CASCADE,
  campo text NOT NULL,
  valor_anterior text,
  valor_novo text,
  usuario text DEFAULT 'sistema',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.pep_gestao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pep_impedimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pep_historico ENABLE ROW LEVEL SECURITY;

-- RLS: acesso público (mesmo padrão de pep_entries)
CREATE POLICY "public_all" ON public.pep_gestao FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON public.pep_impedimentos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON public.pep_historico FOR ALL USING (true) WITH CHECK (true);
```

Storage bucket para evidências:
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('pep-evidencias', 'pep-evidencias', true);
CREATE POLICY "public_read" ON storage.objects FOR SELECT USING (bucket_id = 'pep-evidencias');
CREATE POLICY "public_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pep-evidencias');
CREATE POLICY "public_delete" ON storage.objects FOR DELETE USING (bucket_id = 'pep-evidencias');
```

### 2. Nova Página: `src/pages/PEP/Detalhe.tsx`

Rota: `/pep/:wbs` — recebe o código WBS via `useParams`.

**Seções da página:**

1. **Cabeçalho**: Código WBS em destaque, descrição, Badge de status (editável), secretaria responsável. Botão "Editar" / "Salvar".

2. **Painel Financeiro** (read-only, dados do `pep_entries`):
   - Cards: Total Planejado USD/BRL, BID vs Local
   - Tabela de cronograma financeiro anual (2025-2029)

3. **Gestão da Execução** (editável via `pep_gestao`):
   - Slider de progresso 0-100%
   - Campos de data: Início Real, Previsão de Término
   - Tipo e Método de Aquisição (editáveis)
   - Textarea para notas de gestão

4. **Controle de Riscos e Impedimentos** (via `pep_impedimentos`):
   - Nível de risco (Select: Baixo/Médio/Alto)
   - Check-list de impedimentos com add/toggle/delete

5. **Repositório de Evidências** (via Supabase Storage `pep-evidencias`):
   - Drag & Drop upload area
   - Galeria de imagens com lightbox
   - Lista de documentos PDF com download

6. **Subatividades vinculadas**: Se o item é um Componente/Produto/SP, listar os filhos com link para seus detalhes.

7. **Histórico de Alterações** (via `pep_historico`):
   - Log cronológico: campo alterado, valor anterior → novo, data

### 3. Navegação — WBS clicável

Na `HierarchyTab` e `CronogramaTab`, transformar o `codigo_wbs` em `<Link to={/pep/${encodeURIComponent(wbs)}>` com `useNavigate`. Manter o click na row para o DetailPanel, mas o WBS link navega para a página completa.

### 4. Rota no App.tsx

```tsx
<Route path="pep/:wbs" element={<PEPDetalhePage />} />
```

### 5. Query hooks

Novo arquivo `src/lib/queries/pep-gestao.ts` com hooks:
- `usePepGestao(entryId)` — fetch/upsert gestão
- `usePepImpedimentos(entryId)` — CRUD impedimentos
- `usePepHistorico(entryId)` — fetch histórico
- `usePepEvidencias(wbs)` — list/upload/delete no bucket

### Resumo de Arquivos

| Arquivo | Ação |
|---|---|
| Migration SQL | Criar `pep_gestao`, `pep_impedimentos`, `pep_historico` + bucket `pep-evidencias` |
| `src/pages/PEP/Detalhe.tsx` | Nova página completa (cockpit de gestão) |
| `src/lib/queries/pep-gestao.ts` | Hooks de dados para gestão, impedimentos, histórico, evidências |
| `src/pages/PEP/index.tsx` | WBS clicável com `Link` para `/pep/:wbs` |
| `src/App.tsx` | Adicionar rota `pep/:wbs` |

