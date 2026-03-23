

## Adicionar suporte ao evento "Assinatura criada" no webhook da Cakto

### Problema identificado
Na configuração da Cakto (imagem do usuário), o evento **"Assinatura criada"** NÃO está marcado. Além disso, o código do webhook não trata esse evento.

Eventos atuais tratados no código:
- `purchase_approved` / `sale_approved` — compra aprovada ✅
- `subscription_renewed` — assinatura renovada ✅
- `subscription_canceled` — assinatura cancelada ✅
- `refund` / `refunded` — reembolso ✅
- `checkout_abandonment` — abandono de checkout ✅
- **`subscription_created`** — assinatura criada ❌ FALTANDO

### O que será feito

**1. Adicionar handler para "Assinatura criada" no webhook**
- No arquivo `supabase/functions/cakto-webhook/index.ts`, adicionar tratamento para os eventos `subscription_created`, `subscription.created`, `SUBSCRIPTION_CREATED`
- A lógica será idêntica ao `purchase_approved`: detectar plano, criar `pending_registrations` para novos clientes ou renovar para clientes existentes

**2. Ação necessária na Cakto (manual)**
- Após o deploy, o usuário precisa marcar a checkbox **"Assinatura criada"** no painel da Cakto (além das que já estão marcadas)
- Também recomendo marcar **"PicPay gerado"** e **"Nubank gerado"** se quiser rastrear esses eventos no futuro

### Detalhes técnicos
- Arquivo modificado: `supabase/functions/cakto-webhook/index.ts`
- O novo handler será inserido após o bloco de `purchase_approved` (linha 538), reutilizando a mesma lógica de criação de registro pendente e envio de email
- Deploy automático da Edge Function

