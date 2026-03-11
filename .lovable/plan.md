

## Diagnóstico: Valores zerados após sincronização

### Causa raiz

As funções `num()` e `numOrNull()` na Edge Function fazem `v.replace(/[^\d.\-]/g, "")` -- isto remove vírgulas mas **mantém pontos**. A planilha Google Sheets exporta CSV com formatação brasileira onde:

- Separador de milhar = ponto (`.`)
- Separador decimal = vírgula (`,`)

Exemplo: o valor `27.000.000,00` (27 milhões) após o regex vira `27.000.000.00` que é inválido para `Number()` → retorna `NaN` → vira `0`.

Para valores menores como `600.000,00`, o regex produz `600.000.00` → `NaN` → `0`. Para `600,00` sem ponto de milhar, produz `600` (vírgula removida) → 600 em vez de 600.00 (que coincidentemente funciona pois é inteiro).

### Solução

Corrigir as funções `num()` e `numOrNull()` para detectar e converter formatação brasileira:

1. Se o valor contém tanto pontos quanto vírgulas, o último separador é o decimal
2. Se contém apenas vírgula(s), a última vírgula é o decimal
3. Remover separadores de milhar e substituir vírgula decimal por ponto

```ts
function parseNum(v: string): number {
  if (!v) return 0;
  let s = v.replace(/[^\d.,-]/g, "").trim();
  if (!s) return 0;
  
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  
  if (lastComma > lastDot) {
    // Brazilian: 27.000.000,00 → remove dots, replace comma with dot
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (lastDot > lastComma) {
    // US/International: 27,000,000.00 → remove commas
    s = s.replace(/,/g, "");
  } else {
    // No separator or only one type
    s = s.replace(/,/g, "");
  }
  
  const n = Number(s);
  return isNaN(n) ? 0 : n;
}
```

Aplicar a mesma lógica para `numOrNull()`. Nenhuma mudança necessária no frontend ou banco de dados -- apenas a Edge Function precisa ser atualizada e re-deployada.

Após o fix, um novo sync via o botão "Sincronizar Planilha" trará os valores corretos.

