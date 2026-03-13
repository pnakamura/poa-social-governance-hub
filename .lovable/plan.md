

## Plano: Progresso integrado com Gantt + Histórico compacto

### 1. Progresso integrado com cronograma

Atualmente a barra de progresso (linha 336) usa `gestao?.progresso ?? 0`, que é um valor manual. Precisa ser calculado automaticamente a partir das tarefas do Gantt (`pep_tarefas`).

**`src/pages/PEP/Detalhe.tsx`**:
- Importar `usePepTarefas` de `pep-tarefas.ts`
- Calcular progresso como média ponderada dos progressos das tarefas (peso = duração em dias de cada tarefa)
- Se não houver tarefas, usar o valor manual de `gestao?.progresso`
- Substituir `const progresso = gestao?.progresso ?? 0` pelo valor calculado

### 2. Histórico compacto

Atualmente (linhas 982-994) o histórico mostra campo, valor anterior completo, valor novo completo e data. Precisa ser reformatado para exibir de forma concisa:

**Formato novo**: `13/03/2026 14:30 — campo: resumo do que mudou`

Regras:
- Data e hora no formato `dd/MM/aaaa HH:mm`
- Para textos longos (>60 chars): truncar com `...` e indicar ação (Inserido, Alterado, Removido)
- Se `valor_anterior` era vazio/null e `valor_novo` tem conteúdo → "Inserido"
- Se `valor_anterior` tinha conteúdo e `valor_novo` é vazio/null → "Removido"
- Se ambos têm conteúdo → "Alterado"
- Para valores curtos: mostrar `anterior → novo` normalmente
- Uma linha por alteração, sem repetir conteúdo extenso

### Arquivos a modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/PEP/Detalhe.tsx` | Calcular progresso a partir de tarefas; reformatar histórico |

