

## Atualizar preço mensal de R$ 12,90 para R$ 19,90 e economia anual de R$ 49,10 para R$ 56,90

### Arquivos a modificar

**1. `src/pages/Planos.tsx`**
- Linha 96: `R$ 12,90` → `R$ 19,90`
- Linha 144: `R$ 49,10` → `R$ 56,90`

**2. `src/pages/LandingPage.tsx`**
- Linha 240: `12.90` → `19.90` (Facebook Pixel)
- Linha 428: `R$ 12,90` → `R$ 19,90`
- Linha 502: `R$ 49,10` → `R$ 56,90`
- Linha 897: `R$ 12,90` → `R$ 19,90`
- Linha 971: `R$ 49,10` → `R$ 56,90`

**3. `public/checkout-email.html`**
- Linha 172: `R$ 12,90/mês` → `R$ 19,90/mês`
- Linha 229: `R$ 12,90/mês` → `R$ 19,90/mês`

**4. `src/components/superadmin/UsersManagement.tsx`**
- Linha 397: `Mensal R$ 12,90` → `Mensal R$ 19,90`
- Linha 532: `Mensal R$ 12,90` → `Mensal R$ 19,90`

**5. `src/components/superadmin/StatsCards.tsx`**
- Linha 90: `12.90` → `19.90`
- Linha 184: `R$ 12,90/mês` → `R$ 19,90/mês`

**6. `supabase/functions/cakto-webhook/index.ts`**
- Linha 22: `price: 12.9` → `price: 19.9`, label `R$ 12,90` → `R$ 19,90`

**7. `supabase/functions/complete-registration/index.ts`**
- Linha 140: `12.90` → `19.90`

**Nota:** Os e-mails de boas-vindas do Brevo (resend-welcome-email e process-sale-webhook) não contêm o preço R$ 12,90, então não precisam de alteração.

