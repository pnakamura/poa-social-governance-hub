

## Corrigir rolagem do chat para respostas longas

### Problema
O `ScrollArea` (linha 173) tem `className="flex-1"` mas o Radix ScrollArea precisa que seu container tenha uma altura definida para ativar o scroll. Como o painel do chat usa `flex` com `maxHeight` no container externo, o `ScrollArea` não recebe uma altura fixa e o conteúdo transborda sem scroll.

### Solução
Adicionar `overflow-hidden` ao `ScrollArea` e garantir que ele respeite o layout flex adicionando `min-h-0` (truque padrão de flexbox para permitir que filhos flex encolham abaixo do conteúdo).

### Alteração — `src/components/ChatAssistant.tsx`

Na linha 173, mudar:
```tsx
<ScrollArea className="flex-1 px-3 py-3">
```
Para:
```tsx
<ScrollArea className="flex-1 min-h-0 overflow-hidden px-3 py-3">
```

Isso é suficiente: `min-h-0` permite que o flex item encolha, e o Radix ScrollArea já gerencia o overflow internamente via o Viewport.

### Arquivo modificado (1)
- `src/components/ChatAssistant.tsx` — uma linha

