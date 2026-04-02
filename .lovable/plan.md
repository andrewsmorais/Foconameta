

## Adicionar Shopee/Mercado Livre e trocar label para "Quantidade de Entregas"

### O que sera feito

**Arquivos: `AddTurnoDialog.tsx` e `EditTurnoDialog.tsx`**

1. Adicionar "Shopee" e "Mercado Livre" na lista `fontesGanho` (antes de "Outros")

2. Trocar dinamicamente o label "Quantidade de Corridas" para "Quantidade de Entregas" quando a fonte selecionada for: `ifood`, `keeta`, `shopee` ou `mercado_livre`

### Detalhes tecnicos

- Novas entradas: `{ value: "shopee", label: "Shopee" }` e `{ value: "mercado_livre", label: "Mercado Livre" }`
- Criar constante `fontesEntrega = ["ifood", "keeta", "shopee", "mercado_livre"]`
- No label do campo quantidade, usar: `fontesEntrega.includes(fonte.fonte_ganho) ? "Quantidade de Entregas" : "Quantidade de Corridas"`
- Aplicar a mesma logica nos dois dialogs (Add e Edit)

