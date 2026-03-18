

## Correção: Tag do Google Ads nao detectada pelo Tag Assistant

### Problema
O `index.html` (linha 34) carrega o `gtag.js` com `async`, mas **nao inclui o script inline de inicializacao** com `window.dataLayer` e `gtag('config')`. O Google Tag Assistant verifica o HTML bruto antes do JavaScript do React executar, por isso mostra "Nenhuma tag do Google foi encontrada".

### Solucao
Adicionar o script inline de inicializacao logo apos o script async no `index.html`, exatamente como o snippet original fornecido pelo Google:

```html
<!-- Google Ads (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-17945487409"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'AW-17945487409');
</script>
```

### Arquivo afetado
| Arquivo | Acao |
|---------|------|
| `index.html` | Adicionar script inline de inicializacao (linhas 34-35) |

O hook `useGoogleAds.tsx` e as integracoes nas paginas continuam funcionando normalmente, pois o hook ja verifica se `window.gtag` existe antes de re-inicializar.

