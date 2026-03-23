

## Verificação do Fluxo Mensal e Anual — Análise Completa

### Status dos Planos no Banco

Os planos estão corretos:
- **Mensal**: `49a734d8` → R$ 12,90 ✅
- **Anual**: `08033a83` → R$ 97,90 ✅
- **Free**: `7ce2d64b` → R$ 0,00 ✅

### Fluxo Verificado (Passo a Passo)

```text
Compra na Cakto
    ↓
cakto-webhook (recebe evento purchase_approved)
    ↓
detectPlanType() → preço <= 15 = mensal, senão = anual
    ↓
┌─ Novo cliente?
│   → Cria pending_registrations (session_id, email, plan_type)
│   → Envia email Brevo com link /pagamento-sucesso?session_id=XXX
│
└─ Cliente existente?
    → Renova subscription (1 mês ou 1 ano)
    → Envia email de renovação via Brevo
```

### Problemas Encontrados

**1. Nenhum problema crítico no código** — o fluxo está estruturalmente correto para ambos os planos.

**2. A tabela `pending_registrations` está vazia** — isso indica que:
- Ou nenhuma compra nova de cliente sem conta aconteceu desde a última atualização do webhook
- Ou o webhook não foi re-deployado após as últimas alterações

**3. Possível problema de deploy** — Os logs mostram que o webhook está rodando (respondeu ao meu teste com 401 por falta de secret), mas não há logs de compras reais recentes. Isso pode significar que a Cakto não está enviando os eventos corretamente, ou que o evento está sendo enviado com um secret diferente.

**4. Detecção de plano funciona corretamente:**
- Se o nome do produto contém "mensal" → mensal ✅
- Se o preço é <= 15 → mensal ✅
- Caso contrário → anual ✅

**5. `complete-registration` está correto:**
- Lê `plan_type` do `pending_registrations`
- Cria subscription com 1 mês (mensal) ou 12 meses (anual) ✅
- Atribui role `premium` ✅

**6. `check-subscription` está correto:**
- Verifica se a subscription está ativa e não expirada ✅
- Respeita roles `free` e `super_admin` ✅

**7. Rota `/pagamento-sucesso` é pública** — Confirmado no App.tsx ✅

### O que precisa ser verificado fora do código

O fluxo está correto no código. Para confirmar que funciona em produção:

1. **Verificar se o webhook da Cakto está apontando para a URL correta**: `https://grfyoqsbypvvuzdudtgu.supabase.co/functions/v1/cakto-webhook`
2. **Verificar se o secret configurado na Cakto é o mesmo que está no Supabase** (secret `CAKTO_WEBHOOK_SECRET`)
3. **Verificar no painel do Brevo** se os emails estão sendo enviados (pode haver limite de envio ou domínio não verificado)

### Recomendação

Não há bugs no código. O fluxo mensal e anual está corretamente implementado. Se o email não chegou para o último comprador mensal, as causas mais prováveis são:

- A Cakto não disparou o webhook (verificar no painel da Cakto os logs de webhook)
- O email foi para spam/lixeira do comprador
- O Brevo bloqueou o envio (verificar logs no painel do Brevo)

**Não há alterações de código necessárias.** O sistema está funcional para ambos os planos.

