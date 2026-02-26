

## Implementação da Tag Google Ads

### Dados recebidos
- **ID de conversão:** `AW-17945487409`
- **Evento de conversão (compra):** `AW-17945487409/yx-VCLrj_P4bELHQie1C`
- O evento snippet já está configurado na Cakto (webhook externo), então no app vamos focar no script global + PageView + evento de conversão na página de sucesso.

### Plano

#### 1. Adicionar script global no `index.html`
Inserir o gtag.js no `<head>`, igual ao snippet fornecido.

#### 2. Criar hook `src/hooks/useGoogleAds.tsx`
Seguindo o padrão do `useFacebookPixel.tsx`:
- Inicialização do gtag
- `trackPageView()` — PageView
- `trackConversion(transactionId?)` — Evento de conversão com label `yx-VCLrj_P4bELHQie1C`
- `trackCustomEvent()` — Eventos customizados futuros

#### 3. Integrar na `LandingPage.tsx`
- Importar e usar o hook (PageView automático)

#### 4. Integrar na `PagamentoSucesso.tsx`
- Disparar `trackConversion()` quando o pagamento é confirmado (mesmo ponto onde já dispara o `trackAddPaymentInfo` do Facebook Pixel)

### Arquivos
| Arquivo | Ação |
|---------|------|
| `index.html` | Adicionar script gtag.js no `<head>` |
| `src/hooks/useGoogleAds.tsx` | **Novo** — Hook com funções de tracking |
| `src/pages/LandingPage.tsx` | Importar e inicializar o hook |
| `src/pages/PagamentoSucesso.tsx` | Disparar evento de conversão |

