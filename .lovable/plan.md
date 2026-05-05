## Problema

No painel **Super Admin → Gerenciamento de Usuários**, ao clicar em **Editar** em qualquer usuário (exceto `dandtecno@gmail.com`, que é Super Admin sem assinatura), o dropdown "Plano" do diálogo mostra opções vindas da tabela `plans`, que contém **6 planos** (Free, mensal R$12,90, Basic, Premium, anual, Enterprise). O usuário espera ver apenas as 3 opções comerciais reais: **Free / Mensal R$ 19,90 / Anual R$ 97,90** — exatamente como já é exibido no diálogo de **Adicionar Usuário**.

Além disso, há uma inconsistência grave nos dados:
- A tabela `plans` tem o plano "mensal" com `price = 12,90`, enquanto a aplicação inteira (Landing, Planos, Cakto webhook, complete-registration, e até a coluna exportada do CSV) usa **R$ 19,90**.
- Existem 5 assinaturas ativas/canceladas apontando para esse `plan_id` "mensal" com preço errado (12,90).
- Isso faz com que o `planPrice` retornado por `get-admin-users` seja 12,90, e a badge na tabela ainda assim mostra "Mensal" porque a lógica usa `planPrice >= 90 ? Anual : planPrice > 0 ? Mensal : Free`. Mas qualquer outro lugar que dependa do preço do plano (MRR, relatórios, etc.) fica subestimado.

## Causa raiz

1. **`src/components/superadmin/UsersManagement.tsx`** (linhas 808–823): o `Select` do diálogo de edição usa `plans?.map(...)` em vez da lista fixa de 3 planos usada no diálogo de adição (linhas 530–534).
2. **Tabela `plans`**: o registro "mensal" tem `price = 12.90`, divergente do valor cobrado em produção (R$ 19,90).

## Plano de correção

### 1. Padronizar o Select do diálogo de Edição (frontend)
Substituir o `plans?.map` pelas mesmas 3 opções fixas usadas em "Adicionar Usuário" (Free, Mensal R$ 19,90, Anual R$ 97,90), garantindo consistência com a UI de criação e com o restante do app.

### 2. Corrigir o preço do plano "mensal" no banco
Atualizar via insert tool:
```sql
UPDATE public.plans SET price = 19.90, updated_at = now()
WHERE id = '49a734d8-af86-4a0b-accf-755d947cc1d8';
```
Isso alinha o valor com Landing, Planos, Cakto e cálculos de MRR.

### 3. (Opcional, recomendado) Limpar planos não utilizados
Os planos `Basic (29,90)`, `Premium (49,90)` e `Enterprise (99,90)` estão na tabela mas não são oferecidos em lugar nenhum. Não removerei automaticamente para não quebrar histórico, mas posso renomeá-los como "legacy" se você quiser. **Pergunta para depois da aprovação:** deseja remover ou manter?

### 4. Verificação pós-fix
- Abrir o painel Super Admin → Editar um usuário pago → confirmar que o dropdown mostra apenas Free/Mensal/Anual e que o plano atual do usuário aparece pré-selecionado.
- Conferir os cards de MRR em StatsCards (já usam constante 19,90 hardcoded, então não dependem da tabela — ok).

## Arquivos afetados

- `src/components/superadmin/UsersManagement.tsx` — trocar Select de Edit Dialog
- Migração SQL (via insert tool) — atualizar preço do plano mensal

## Resumo

Bug exibido: dropdown do Editar mostrando planos legados/errados.
Bug real adicional descoberto: preço do plano mensal no banco está R$ 12,90 (deveria ser R$ 19,90).
Ambos serão corrigidos.