

## Atualizar Facebook Pixel ID e Token

### O que será feito

Substituir o Pixel ID antigo (`1290319795205025`) pelo novo (`1163164178906906`) em 2 arquivos, e atualizar o token de acesso do Facebook. O Google Ads não será alterado.

### Alterações

1. **`src/hooks/useFacebookPixel.tsx`** (linha 6) — Trocar o Pixel ID para `1163164178906906`

2. **`supabase/functions/cakto-webhook/index.ts`** (linha 12) — Trocar o Pixel ID para `1163164178906906`

3. **Secret `FB_ACCESS_TOKEN`** — Atualizar o token do Facebook Conversions API com o novo valor fornecido

### Observação
- O token é uma chave privada e será armazenado como secret seguro (acessível apenas nas edge functions)
- Google Ads permanece inalterado

