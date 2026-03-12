

## Conectar dados do cockpit PEP à IA do Chat

### Problema

Quando o usuário pergunta "O que existe sobre o Beco do Adelar", a IA não encontra nada porque:

1. **Intent detection falha**: "Beco do Adelar" não contém nenhuma palavra-chave (pep, orçamento, wbs, etc.), então `detectTables()` retorna lista vazia e nenhum dado estruturado é buscado.
2. **Cockpit tables ausentes**: Mesmo quando `pep_entries` é buscado, as tabelas complementares do cockpit (`pep_gestao`, `pep_impedimentos`, `pep_riscos`, `pep_historico`) nunca são incluídas.
3. **Busca textual inexistente**: Não há busca por texto livre nas descrições/resumos do PEP — a IA depende apenas de keywords pré-definidas.

### Solução

Modificar a Edge Function `rag-chat/index.ts` em 3 pontos:

#### 1. Fallback inteligente — sempre buscar PEP quando nenhum intent é detectado

Quando `detectTables()` retorna vazio, ao invés de não buscar nada, fazer uma busca textual (ILIKE) em `pep_entries.descricao` e `pep_entries.resumo_executivo` usando a mensagem do usuário. Isso permite encontrar itens como "Beco do Adelar" que estão nas descrições.

#### 2. Adicionar tabelas do cockpit ao contexto estruturado

Adicionar `pep_gestao`, `pep_impedimentos` e `pep_riscos` ao `TABLE_QUERIES` e `TABLE_LIMITS`. Quando `pep_entries` é detectado (ou no fallback), buscar também essas tabelas para dar contexto completo sobre status, impedimentos e riscos operacionais de cada item WBS.

#### 3. Busca textual no PEP como fallback

Criar uma função `searchPepByText()` que faz `ilike` em `descricao` e `resumo_executivo` e retorna os itens PEP encontrados junto com seus dados de gestão vinculados.

### Alterações

| Arquivo | Ação |
|---|---|
| `supabase/functions/rag-chat/index.ts` | (1) Adicionar `pep_gestao`, `pep_impedimentos`, `pep_riscos` em TABLE_QUERIES/LIMITS; (2) Criar `searchPepByText()` que busca por ILIKE em descricao/resumo_executivo; (3) Quando nenhum intent é detectado, executar busca textual no PEP + fallback para pep_entries; (4) Atualizar system prompt para orientar a IA sobre dados do cockpit |

### Lógica do fallback

```text
mensagem do usuário
    ↓
detectTables() → tabelas encontradas?
    SIM → busca normal (+ inclui cockpit tables se pep_entries presente)
    NÃO → searchPepByText(mensagem) → encontrou itens?
        SIM → retorna itens + gestao/impedimentos/riscos vinculados
        NÃO → fallback vazio (RAG semântico pode ainda responder)
```

