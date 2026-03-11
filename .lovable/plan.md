

## Corrigir link da planilha PEP no DataSourcePanel

### Problema
O `DataSourcePanel` em `/pep` aponta para uma pasta do Google Drive que não funciona. O dado real vem da Google Sheets `1C6uIqjqwpgToNWm3YqliqKzb2gPb8cHC` (mesma usada pela Edge Function `sync-pep-sheets`).

### Correção

**Arquivo**: `src/pages/PEP/index.tsx` (linha 1135)

Alterar a URL de:
```
https://drive.google.com/drive/folders/1NQKPrkIWBUBcR0tQUU3vwOKDc5_YkuYl
```
Para:
```
https://docs.google.com/spreadsheets/d/1C6uIqjqwpgToNWm3YqliqKzb2gPb8cHC
```

Também atualizar o label do botão no `DataSourcePanel` de "Abrir no Google Drive" para "Abrir no Google Sheets" — isso requer uma pequena alteração no componente `src/components/DataSourcePanel.tsx` (linha onde diz "Abrir no Google Drive"), ou passar uma prop para customizar o texto. A solução mais simples: mudar o texto fixo no componente para algo genérico como "Abrir fonte" ou detectar automaticamente pelo URL se é Sheets vs Drive.

### Arquivos a editar
1. `src/pages/PEP/index.tsx` — corrigir URL
2. `src/components/DataSourcePanel.tsx` — ajustar texto do botão (opcional, melhoria)

