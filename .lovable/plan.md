

## Melhorias no Painel do Chat Assistant

### Problemas atuais
1. **Scroll**: `ScrollArea` do Radix pode não estar funcionando bem para scroll — o viewport precisa de height explícita
2. **Nova conversa**: só há o botão de limpar (lixeira), sem label claro de "Nova conversa"
3. **UX geral**: faltam sugestões rápidas, textarea para mensagens longas, contador de mensagens, confirmação antes de limpar

### Melhorias planejadas

**1. Corrigir scroll da conversa**
- Substituir `ScrollArea` por uma `div` com `overflow-y-auto` e `flex-1` para garantir scroll nativo confiável
- Auto-scroll ao receber nova mensagem

**2. Botão "Nova Conversa" explícito**
- Adicionar botão com ícone `SquarePen` no header ao lado do lixeira
- Adicionar confirmação (dialog simples inline) antes de limpar conversa com mensagens

**3. Textarea expansível no lugar do input**
- Trocar `<input>` por `<textarea>` com auto-resize (max 4 linhas)
- Enter envia, Shift+Enter quebra linha

**4. Sugestões rápidas (quick prompts)**
- Exibir chips clicáveis quando só há a mensagem inicial: "Resumo do PEP", "Riscos críticos", "Status das aquisições", "Indicadores PMR"
- Ao clicar, envia a pergunta automaticamente

**5. Timestamp nas mensagens**
- Adicionar horário discreto (ex: "14:32") abaixo de cada bolha

**6. Botão scroll-to-bottom**
- Quando o usuário rola para cima, exibir um botão flutuante "↓" para voltar ao fim

### Arquivos alterados

| Arquivo | Ação |
|---|---|
| `src/components/ChatAssistant.tsx` | Reescrever com todas as melhorias acima |

### Detalhes técnicos
- Textarea auto-resize via `useEffect` no `scrollHeight`
- Scroll container: `div` com `overflow-y-auto flex-1 min-h-0`
- IntersectionObserver no `bottomRef` para detectar se o usuário está no fundo (mostrar/ocultar botão ↓)
- Quick prompts: array estático de strings, renderizado como `Badge` clicáveis
- Timestamp: campo `timestamp: number` adicionado à interface `Message`, formatado com `date-fns/format`

