

## Igualar cores do botão Mensal ao botão Anual

### Problema
O botão "ASSINAR AGORA" do Plano Mensal usa azul (`bg-[#3c83f6]`), enquanto o botão do Plano Anual usa verde (`bg-[#25D366]`) com animação pulsante. O pedido é que ambos tenham as mesmas cores.

### Alterações

#### 1. `src/pages/LandingPage.tsx` (2 locais)
- **Linha 454** (Hero - botão mensal): Trocar `bg-[#3c83f6] hover:bg-[#2b6de0]` por `bg-[#25D366] hover:bg-[#1da851] animate-soft-pulse`
- **Linha 905** (Seção preços - botão mensal): Mesma troca

#### 2. `src/pages/Planos.tsx`
- **Linha ~117** (botão mensal): Trocar `variant="outline"` por estilo verde `bg-[#25D366] hover:bg-[#1da851] text-white font-bold`

Resultado: ambos os botões (mensal e anual) ficam verdes com animação pulsante.

