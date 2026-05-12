## Plano: Filtro por Data + Histórico em Ganhos & Despesas

Replicar a estrutura visual e funcional do menu KM (Turnos) na página Ganhos & Despesas.

### Arquivo afetado
- `src/pages/GanhosDespesas.tsx` (apenas frontend, sem mudanças de banco)

### Mudanças

**1. Adicionar Filtro por Data (idêntico ao KM)**
- Novo estado `filtroData` inicializado com `new Date()` (data de hoje).
- Card "Filtrar por Data" com `Popover` + `Calendar` (locale ptBR), igual ao KM.
- Texto auxiliar: "Exibindo transações de {data}".
- `useEffect` recarrega ao mudar `filtroData`.

**2. Filtragem das transações**
Uma transação é exibida na data selecionada quando:
- `data` é igual à data filtrada, OU
- É recorrente e `data` ≤ data filtrada, OU
- Tem intervalo (`data_inicio` ≤ data filtrada ≤ `data_fim`).

Quando o filtro estiver vazio (usuário limpar), mostrar todas (comportamento atual com limite de 4 mais recentes — manter apenas quando sem filtro).

**3. Histórico de Ganhos e Despesas (espelhando "Histórico de Turnos")**
- Substituir a listagem atual (cards genéricos) pelo padrão visual do KM:
  - Título: `Histórico de Ganhos e Despesas ({dd/MM/yyyy})`.
  - Cada item em um `Card` com header (nome/categoria + botões editar/excluir à direita) e body com grid de campos em destaque verde (`text-[#15a249]`) seguindo o estilo do KM.
  - Manter badges (Recorrente, Dashboard, Até dd/MM/yyyy) acima do grid.
- Atualizar a frase de cabeçalho da página para refletir que agora há filtro por data (remover o texto "Exibindo os 4 Relatórios... mais recentes").
- Cards de resumo opcionais (Ganhos do dia / Despesas do dia / Saldo) ao final, no mesmo estilo dos cards azul/vermelho/verde do KM — apenas se houver transações no dia.

### Sem alterações
- Schema do banco, RLS, edge functions, dialogs de criação/edição.
- Outras páginas.

### Resultado esperado
Página Ganhos & Despesas com layout e UX idênticos ao Menu KM (Turnos): filtro de data no topo, histórico filtrado por data, mesmo padrão visual de cards.