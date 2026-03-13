

## Plano: Atualizar sincronização PEP para nova planilha

### Contexto

O SPREADSHEET_ID atual na Edge Function `sync-pep-sheets` é `1XRIb1og8sphXhOtdkbOd8U1G3OuL8508` e sincroniza 238 registros com sucesso. A solicitação é trocar para `1zk6KJCvbr7HKlDYIAIDKDBCyZ_rR3ZW2Kck1gYqrQyY`.

Ambas as planilhas são arquivos .xlsx carregados no Google Drive. Não consegui visualizar o conteúdo completo da nova planilha via fetch (limitação da ferramenta), mas a estrutura do gviz API é idêntica. O plano é atualizar o ID e testar.

O mapeamento de colunas permanece o mesmo — o usuário confirmou que **coluna S = Total US$ BID (arranque)** (`s_base` = `row[18]`), o que já é o mapeamento atual.

### Critério de aceite

WBS `2.9.4.1` — valores nas colunas K a P devem ser zeros ou nulos. Dados atuais no Supabase:
- `k_reais_bid`: null, `l_reais_local`: null, `m_reais_total`: null
- `n_atual`: 0, `o_atual`: 0, `p_atual`: 0
- `s_base`: 228.000 (confirmando coluna S com valor)

### Alterações

**1. Edge Function `sync-pep-sheets`** — trocar `SPREADSHEET_ID`:
```
const SPREADSHEET_ID = "1zk6KJCvbr7HKlDYIAIDKDBCyZ_rR3ZW2Kck1gYqrQyY";
```

**2. Edge Function `sync-pmr-sheets`** — trocar o mesmo ID (se usar planilha compartilhada).

**3. Settings e links** — atualizar referências à URL da planilha em `src/pages/Settings.tsx`.

**4. Teste** — após deploy, invocar a edge function e:
- Verificar que retorna ~238 registros
- Consultar WBS `2.9.4.1` para confirmar K-P zerados/nulos
- Confirmar que `/pep` exibe dados corretamente

### Risco

Se a nova planilha realmente contém menos dados (apenas o resumo de 5 linhas que eu visualizei), a sync retornará 0 linhas PEP válidas. Nesse caso, o edge function retorna erro sem apagar dados existentes (UPSERT não deleta).

