

## Plano: Melhorar UX/UI do Cockpit PEP + Deletar Histórico

### Mudanças Planejadas

**1. Histórico: Botão de deletar registros**
- Adicionar botão de lixeira em cada item do histórico (visível no hover, como nos impedimentos)
- Criar hook `useDeletePepHistorico` em `pep-gestao.ts` para deletar registros da tabela `pep_historico`
- Adicionar confirmação antes de deletar (para evitar exclusões acidentais)

**2. Melhorias de UX/UI no Cockpit**

| Seção | Melhoria |
|-------|----------|
| **Cabeçalho** | Adicionar breadcrumb navegável (PEP > Componente > Item) e lote/secretaria como badges |
| **Painel Financeiro** | Adicionar ícone no header, highlight visual para valores zerados, tooltips informativos |
| **Gestão da Execução** | Ícone de status colorido no header, visual de cards ao invés de grid simples no modo leitura |
| **Impedimentos** | Separar visualmente resolvidos dos pendentes, mostrar data de criação em cada item |
| **Riscos** | Indicador visual de severidade (P×I) com cor no card inteiro |
| **Evidências** | Counter no header, melhor empty state com ícone |
| **Histórico** | Ícones por tipo de alteração (status, progresso, impedimento, risco, etc.), botão deletar, melhor formatação de data |
| **Sidebar cards** | Consistent header styling com ícones gradient como impedimentos/riscos/SEI |
| **Entregas Físicas** | Usar checkmarks mais visuais, labels mais legíveis |

**3. Melhorias visuais gerais**
- Cards com hover states mais suaves e consistentes
- Espaçamento e tipografia mais refinados
- Scroll areas com fade-out visual nas bordas
- Empty states mais elaborados com ícones contextuais

### Arquivos a modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/lib/queries/pep-gestao.ts` | Adicionar `useDeletePepHistorico` mutation |
| `src/pages/PEP/Detalhe.tsx` | Botão deletar no histórico + melhorias visuais UX/UI em todas as seções |

