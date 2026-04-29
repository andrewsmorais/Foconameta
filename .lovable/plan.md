## Diagnóstico — Luis Cok (Luiz Carlos)

Encontrei a conta como **Luis Cok** (`f8d9723c-1955-494e-aebe-418e564f802d`) no banco. O cliente tem razão:

| Campo | Valor atual |
|---|---|
| Perfil | active |
| Assinatura `status` | **cancelled** ❌ |
| `started_at` | 20/04/2026 02:20 |
| `expires_at` | **20/04/2027 02:20** (renovação anual paga) |
| Role | (nenhuma) |

Os campos `started_at` e `expires_at` foram atualizados pela renovação, ou seja, **o pagamento entrou e a Cakto enviou o evento `subscription_renewed`**. Porém o `status` continua `cancelled`.

### Causa raiz

A Cakto enviou os webhooks fora de ordem (ou o evento de cancelamento chegou DEPOIS do de renovação):

1. `subscription_renewed` → atualizou datas e marcou `status=active` ✅
2. `subscription_canceled` chegou em seguida → forçou `status=cancelled` ❌

O handler `subscription_canceled` no `cakto-webhook` (linha 668-687) **não verifica se já existe uma renovação válida** (expires_at no futuro). Ele cancela cegamente, sobrescrevendo a renovação legítima.

Por causa disso, o `check-subscription` retorna `hasActiveSubscription=false` (exige `status='active'`), e o cliente perde o acesso mesmo tendo pago.

---

## O que vou fazer

### 1. Corrigir imediatamente o Luis Cok (manual, via migration)

```sql
UPDATE subscriptions
SET status = 'active'
WHERE user_id = 'f8d9723c-1955-494e-aebe-418e564f802d';

UPDATE profiles
SET status = 'active', updated_at = now()
WHERE id = 'f8d9723c-1955-494e-aebe-418e564f802d';
```

Isso restaura o acesso dele instantaneamente (assinatura válida até 20/04/2027).

### 2. Proteger o webhook contra cancelamentos fora de ordem

Em `supabase/functions/cakto-webhook/index.ts` (handler `subscription_canceled`, linhas 668-687):

- Antes de marcar `cancelled`, ler a assinatura atual
- Se `expires_at > now()` E foi atualizada nas últimas 24h (sinal de renovação recente), **ignorar o cancelamento** e logar aviso
- Caso contrário, manter o cancelamento normal

Isso evita que esse bug se repita com outros clientes em renovações futuras.

### 3. Reenviar e-mail de confirmação de renovação para o Luis Cok

Para confirmar ao cliente que está tudo certo, disparar manualmente o e-mail "Sua assinatura foi renovada com sucesso" via a função existente `sendRenewalEmail` (chamando uma vez através de um script pontual ou via `resend-welcome-email` adaptado). Posso fazer isso após a correção, se você quiser.

---

## Detalhes técnicos

- **Arquivos alterados**: `supabase/functions/cakto-webhook/index.ts`
- **Migrations**: 1 update em `subscriptions` + 1 em `profiles` (idempotente, escopo único usuário)
- **Sem mudanças de schema**, sem novas RLS, sem novos secrets
- **Risco**: muito baixo — a correção do webhook só altera comportamento quando há conflito renew/cancel

Confirma se posso aplicar?
