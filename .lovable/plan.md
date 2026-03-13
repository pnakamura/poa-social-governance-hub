

## Plano: Histórico de Alterações com Diff Word-Level

### Problema
Atualmente o histórico mostra o valor inteiro (truncado) com rótulo genérico "Inserido/Alterado/Removido". O usuário quer ver **exatamente o que mudou** a nível de palavra/frase.

### Solução

**1. Criar função `diffWords` em `src/lib/utils.ts`**

Uma função que compara `valor_anterior` e `valor_novo` palavra por palavra e retorna uma descrição precisa:
- Se palavras foram removidas: `palavra "Saúde" — Apagada` ou `frase "de Saúde" — Apagada`
- Se palavras foram adicionadas: `palavra "nova" — Adicionada` ou `frase "obra nova" — Adicionada`
- Se houve substituição: `"Saúde" substituído por "Educação"`
- Para valores curtos/simples (status, datas): manter formato `anterior → novo`
- Se não há `valor_anterior` (campo novo): `"texto..." — Inserido`
- Se não há `valor_novo` (campo apagado): `"texto..." — Removido`

Algoritmo: Longest Common Subsequence (LCS) simplificado sobre arrays de palavras para identificar inserções, remoções e substituições.

**2. Atualizar display do histórico em `src/pages/PEP/Detalhe.tsx`**

Substituir a lógica atual (linhas 1004-1017) pela chamada à função `diffWords(anterior, novo)` que retorna o resumo formatado.

### Arquivos a modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/lib/utils.ts` | Adicionar função `diffWords(old, new)` |
| `src/pages/PEP/Detalhe.tsx` | Usar `diffWords` no histórico (linhas 1004-1017) |

