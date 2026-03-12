

## Correção de Cor + Checklist nos Cards

### Problema da Cor

O card usa `style={{ borderLeftWidth: 4, borderLeftColor: atv.cor }}` mas a classe Tailwind `border` no Card component define `border-color` para todos os lados via CSS custom properties, que pode conflitar com o inline style em certos contextos. A correção é usar a shorthand `borderLeft: '4px solid <cor>'` que é mais robusta, e remover o border padrão do lado esquerdo.

### Checklist Feature

Nova tabela e UI para checklist dentro de cada card de atividade.

### Migração de Banco

```text
atividade_checklist
  id UUID PK DEFAULT gen_random_uuid()
  atividade_id UUID FK → atividades.id ON DELETE CASCADE
  texto TEXT NOT NULL
  concluido BOOLEAN DEFAULT false
  ordem INTEGER DEFAULT 0
  criado_em TIMESTAMPTZ DEFAULT now()
```

RLS: política pública (mesmo padrão).

### Arquivos alterados

| Arquivo | Ação |
|---|---|
| Migration SQL | CREATE TABLE atividade_checklist |
| `src/lib/queries/activities.ts` | Adicionar queries/mutations para checklist (CRUD + toggle + reorder) |
| `src/lib/supabase.ts` | Adicionar tipo `AtividadeChecklist` |
| `src/pages/Activities.tsx` | (1) Corrigir estilo da cor para usar `borderLeft` shorthand; (2) Mostrar progresso do checklist no card (ex: "3/5 ✓"); (3) Adicionar opção "Checklist" no menu do card; (4) Criar `ChecklistSheet` lateral para gerenciar itens |

### Detalhes da UI

- **No card**: ícone de checklist com contagem (ex: `☐ 2/5`) se houver itens
- **Sheet lateral**: lista de itens com checkbox, campo para adicionar novo item, botão de excluir em cada item
- **No dialog de edição**: sem alteração (checklist fica no sheet separado)
- **Cor corrigida**: `style={{ borderLeft: '4px solid #hex' }}` substituindo a abordagem atual

