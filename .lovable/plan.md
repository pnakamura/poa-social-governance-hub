

## Diagnóstico

O gráfico usa `stackId="1"` em todas as `<Area>`, o que empilha os valores. Como o Componente 3 (Administração) tem valores muito menores (~1-4M) comparado ao C2 (~14-56M), a área de Administração fica como uma faixa fina em cima do C2, parecendo "acompanhar" a mesma linha.

## Correção

Remover o `stackId="1"` das áreas e reduzir a opacidade do preenchimento para que as linhas individuais de cada componente sejam claramente distinguíveis. Isso fará com que cada componente mostre sua própria curva independente.

### Mudança em `src/pages/PEP/index.tsx`

Na seção do AreaChart (linhas ~819-829), remover `stackId="1"` e reduzir `fillOpacity` para 0.15:

```tsx
<Area
  key={label}
  type="monotone"
  dataKey={label}
  stroke={COMP_COLORS[i % COMP_COLORS.length]}
  fill={COMP_COLORS[i % COMP_COLORS.length]}
  fillOpacity={0.15}
/>
```

Isso mostrará cada componente como uma linha/área independente, permitindo ver claramente que Administração (~US$ 1M/ano) é muito menor que C2 (~US$ 45M/ano).

