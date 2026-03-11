

## Diagnóstico e Plano de Correção

### Problemas Identificados

**1. Valores de Desembolso anuais estão errados (bug `normalizeBrNum`)**

Os valores anuais dos PT estão ~1000x menores que deveriam. Exemplo:
- "Licenças de software": `desembolso_total = 1,300,000` (correto), mas `desembolso_2026 = 211.63` (deveria ser 211,630)
- O CSV exporta "211.630" (formato BR para 211.630 mil). A função `normalizeBrNum` trata como decimal US → 211.63

A heurística falha quando há **1 ponto e 0 vírgulas com exatamente 3 dígitos após o ponto** (ex: "211.630", "1085.714"). Esses são separadores de milhar BR, não decimais.

Correção: se `dots === 1 && commas === 0` e há exatamente 3 dígitos após o ponto → remover o ponto (é milhar BR).

**2. Coluna Secretaria está vazia (NULL para todas as linhas)**

A coluna `secretaria` está mapeada para `row[24]` (coluna Y), mas retorna NULL para todos os registros. Provável causa: a planilha tem colunas ocultas/diferentes do esperado, ou a coluna Y está vazia. Preciso adicionar logging na Edge Function para imprimir o conteúdo das colunas 20-30 de uma linha de exemplo, para identificar o offset correto.

**3. Gráfico não diferencia por componentes**

Consequência do problema 1: como os valores anuais dos PT são ~1000x menores, a agregação por componente gera valores próximos de zero para todos. Com os valores corrigidos, o gráfico de AreaChart já diferenciará corretamente (cada componente terá sua área proporcional).

### Mudanças Técnicas

| Arquivo | Mudança |
|---|---|
| `sync-pep-sheets/index.ts` | Corrigir `normalizeBrNum`: tratar 1 ponto + 3 dígitos após como milhar BR. Adicionar log de debug das colunas 20-30 para diagnosticar a coluna secretaria |
| `src/pages/PEP/index.tsx` | Ajustar `DesembolsosTab`: usar valores das linhas C diretamente quando não há filtro de secretaria (os C rows têm os totais corretos da planilha), e só agregar PTs quando filtro de secretaria está ativo |

### Detalhe da correção `normalizeBrNum`

```ts
function normalizeBrNum(v: string): string {
  let s = v.replace(/[^\d.,-]/g, "").trim();
  if (!s) return "";
  const commas = (s.match(/,/g) || []).length;
  const dots = (s.match(/\./g) || []).length;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");

  if (dots > 1 && commas === 0) {
    s = s.replace(/\./g, "");  // BR thousands: 27.000.000
  } else if (commas > 1 && dots === 0) {
    s = s.replace(/,/g, "");   // US thousands: 27,000,000
  } else if (dots === 1 && commas === 0) {
    // Ambiguous: "211.630" vs "3.50"
    const afterDot = s.substring(lastDot + 1);
    if (afterDot.length === 3) {
      s = s.replace(".", "");  // BR thousands: 211.630 → 211630
    }
    // else: US decimal: 3.50 → keep as is
  } else if (lastComma > lastDot) {
    s = s.replace(/\./g, "").replace(",", ".");  // BR decimal: 1.234,56
  } else {
    s = s.replace(/,/g, "");   // US decimal: 1,234.56
  }
  return s;
}
```

### Detalhe do Desembolsos Tab

Quando `filtroSecretaria === 'todos'`, usar os dados das linhas C diretamente (já contêm os totais corretos). Quando há filtro ativo, agregar a partir dos PTs filtrados.

### Diagnóstico da Secretaria

Adicionar `console.log` temporário na Edge Function para imprimir colunas 20-30 de algumas linhas PT, permitindo identificar qual índice realmente contém a Secretaria. Após identificar, ajustar o mapeamento.

