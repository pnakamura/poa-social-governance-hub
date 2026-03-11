

## Diagnóstico: Valores zero nas linhas de Componente (ref='C')

### Problema confirmado

As 3 linhas de Componente (C1, C2, C3) estão com `n_atual=0` no banco, enquanto as linhas de detalhe (P, SP, PT) têm valores corretos. A causa é um bug na função `normalizeBrNum()` da Edge Function.

### Causa raiz

O Google Sheets CSV export (`gviz/tq?tqx=out:csv`) usa formato US para números grandes: `27,000,000` (vírgulas como separador de milhar). Para as linhas de Componente, os valores são grandes (milhões), então contêm vírgulas.

A função `normalizeBrNum` detecta erroneamente esses valores como formato brasileiro (porque `lastComma > lastDot`) e faz:

```text
Input:  "27,000,000"
Step 1: remove dots  → "27,000,000" (sem mudança)
Step 2: replace ","  → "27.000,000" (só a 1ª vírgula!)
Result: Number("27.000,000") → NaN → 0
```

O `.replace(",", ".")` substitui **apenas a primeira** vírgula. Para linhas de detalhe com valores pequenos (80, 600, 550), não há separador, então funciona. Para C rows com milhões, falha.

### Solução

Corrigir `normalizeBrNum` para distinguir entre:
- **Múltiplas vírgulas sem ponto** (`27,000,000`): separadores de milhar US → remover todas
- **Uma vírgula sem ponto** (`1.234,56` ou `600,50`): decimal brasileiro → substituir por ponto
- **Pontos e vírgula** (`27.000.000,00`): formato BR completo → remover pontos, substituir vírgula

A lógica corrigida:

```ts
function normalizeBrNum(v: string): string {
  let s = v.replace(/[^\d.,-]/g, "").trim();
  if (!s) return "";
  const commas = (s.match(/,/g) || []).length;
  const dots = (s.match(/\./g) || []).length;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");

  if (commas > 1 && dots === 0) {
    // US thousands: 27,000,000 → remove all commas
    s = s.replace(/,/g, "");
  } else if (lastComma > lastDot) {
    // Brazilian: 27.000,50 → remove dots, replace comma
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    // US decimal or no separator: 27,000.50 or 27000
    s = s.replace(/,/g, "");
  }
  return s;
}
```

Após a correção, re-deploy da Edge Function e re-sincronizar. Os KPIs devem mostrar os valores corretos (Total BID Atual ≈ US$ 132.161.750).

