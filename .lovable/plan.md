## Diagnóstico rápido

O dropdown de edição já foi corrigido para mostrar somente:
- Grátis
- Mensal R$ 19,90
- Anual R$ 97,90

Mas ainda existe erro nos dados e na lógica de salvamento/visualização:

1. Alguns usuários pagos ativos estão sem papel `premium` no banco. Exemplo encontrado: `Luis Cok` tem assinatura anual ativa, mas aparece com papel `free`/sem papel correto na resposta do painel.
2. Usuários cancelados/expirados ainda carregam `plan_id` mensal/anual na assinatura antiga. Por isso podem continuar aparecendo como Mensal/Anual no Gerenciamento, mesmo sem acesso ativo.
3. Ao salvar um plano no diálogo de edição, o código atual faz `upsert` em `subscriptions`, mas não garante:
   - `onConflict: "user_id"`
   - atualização de `profiles.subscription_id`
   - troca correta de papel entre `free` e `premium`
   - cancelamento da assinatura quando o plano escolhido é Grátis
4. A função `get-admin-users` calcula plano atual usando assinatura vinculada ao perfil, mas não trata corretamente assinatura cancelada/expirada como plano atual Grátis.

## Plano de correção imediata

### 1. Corrigir os dados atuais de todos os usuários
Vou rodar uma correção no banco para deixar todos em estado coerente:

- Usuário Super Admin `dandtecno@gmail.com`: manter `super_admin`, sem mexer no acesso.
- Usuários com assinatura paga ativa e válida:
  - garantir papel `premium`
  - remover papel `free`, se existir
  - garantir que `profiles.subscription_id` aponte para a assinatura correta
- Usuários sem assinatura ativa válida ou com assinatura cancelada/expirada/refund:
  - garantir papel `free` quando devem ter acesso grátis
  - remover papel `premium`, se existir
  - manter histórico da assinatura, mas o painel passará a exibir o plano atual como Grátis
- Garantir que qualquer assinatura mensal/anual use apenas os IDs oficiais:
  - Grátis: `7ce2d64b-e97a-429e-9448-3af009895d70`
  - Mensal: `49a734d8-af86-4a0b-accf-755d947cc1d8`
  - Anual: `08033a83-5a65-4248-ae25-89e8bc35fe04`

### 2. Corrigir o salvamento do Editar Usuário
Em `src/components/superadmin/UsersManagement.tsx`, vou ajustar a mutation de atualização para:

- Se escolher Grátis:
  - cancelar/desativar assinatura paga existente
  - definir papel `free`
  - remover papel `premium`
- Se escolher Mensal ou Anual:
  - criar ou atualizar assinatura usando `onConflict: "user_id"`
  - definir `status = "active"`
  - calcular vencimento correto:
    - Mensal: +1 mês
    - Anual: +1 ano
  - atualizar `profiles.subscription_id` com o ID da assinatura salva
  - definir papel `premium`
  - remover papel `free`

Isso corrige novos erros ao editar qualquer usuário.

### 3. Corrigir a função `get-admin-users`
Em `supabase/functions/get-admin-users/index.ts`, vou ajustar o retorno para o painel enxergar o plano atual corretamente:

- Assinatura paga ativa e não vencida: exibir Mensal/Anual conforme `plan_id`.
- Assinatura cancelada, expirada ou vencida: exibir Grátis como plano atual, mantendo `renewal_status`/dias restantes para histórico.
- Super Admin: continuar como acesso especial, sem plano comercial obrigatório.
- Melhorar prioridade de papéis para evitar que um usuário pago apareça como `free` quando também tiver assinatura ativa.

### 4. Remover fonte de confusão dos planos legados
Como os planos legados `Basic`, `Premium` e `Enterprise` não têm assinaturas vinculadas e não fazem parte da oferta atual, vou removê-los do banco para não voltarem a aparecer por engano em consultas dinâmicas futuras.

A tabela `plans` ficará somente com:
- Free
- mensal R$ 19,90
- anual R$ 97,90

### 5. Verificação final
Depois da correção, vou conferir:

- Todos os usuários no banco têm estado coerente.
- Usuários ativos pagos aparecem como Mensal ou Anual.
- Usuários cancelados/expirados aparecem como Grátis no plano atual.
- Super Admin continua liberado.
- Editar qualquer usuário e trocar plano não deixa mais `role`, `subscription_id` ou `plan_id` inconsistentes.

## Arquivos e dados que serão alterados

Arquivos:
- `src/components/superadmin/UsersManagement.tsx`
- `supabase/functions/get-admin-users/index.ts`

Banco de dados:
- Correção dos registros atuais em `user_roles`, `subscriptions`, `profiles` e `plans`.