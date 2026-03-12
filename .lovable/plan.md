

## Kanban Completo de Atividades (atualizado)

### Migração de Banco de Dados

```text
atividades
  + descricao TEXT
  + cor TEXT DEFAULT null   ← NOVO (hex color, ex: "#3b82f6")

atividade_comentarios
  id UUID PK
  atividade_id UUID FK → atividades.id ON DELETE CASCADE
  texto TEXT NOT NULL
  autor TEXT
  criado_em TIMESTAMPTZ DEFAULT now()

atividade_alertas
  id UUID PK
  atividade_id UUID FK → atividades.id ON DELETE CASCADE
  tipo TEXT DEFAULT 'info' (info | warning | urgent)
  mensagem TEXT NOT NULL
  resolvido BOOLEAN DEFAULT false
  criado_em TIMESTAMPTZ DEFAULT now()
```

### Funcionalidades

1. **Drag-and-drop** nativo HTML5 para mover cards entre colunas
2. **Menu de ações** (`...`) em cada card: Editar, Alertas, Comentários, Excluir
3. **Dialog de edição** completo: título, descrição, componente, responsável, prazo, prioridade, progresso (slider), **cor do card**
4. **Sheet de comentários** lateral com lista e input
5. **Sheet de alertas** lateral com tipo + mensagem + checkbox resolvido
6. **Cor do card**: paleta de ~8 cores pré-definidas exibida no dialog de edição/criação como círculos clicáveis. A cor escolhida aplica uma borda lateral colorida (`border-l-4`) no card do Kanban. Valor `null` = sem cor especial.
7. **Indicadores visuais**: sino (alertas), chat (comentários), borda vermelha (atrasado)

### Paleta de cores

```text
[ #3b82f6 azul | #10b981 verde | #f59e0b amarelo | #ef4444 vermelho |
  #8b5cf6 roxo | #ec4899 rosa | #06b6d4 ciano | #6b7280 cinza ]
```

### Arquivos alterados

| Arquivo | Ação |
|---|---|
| Migration SQL | ALTER atividades + CREATE comentarios/alertas |
| `src/lib/supabase.ts` | Adicionar tipos (descricao, cor, AtividadeComentario, AtividadeAlerta) |
| `src/lib/queries/activities.ts` | Queries/mutations para comentários, alertas, update completo |
| `src/pages/Activities.tsx` | Reescrever com DnD, menu, sheets, color picker |

