

# Plano: Layout Responsivo para Vídeos Shorts

## Objetivo
Alterar o layout dos 4 vídeos do YouTube Shorts para que:
- **Desktop**: Fiquem lado a lado (4 colunas)
- **Mobile**: Fiquem empilhados (1 coluna)

## Layout Proposto

```text
DESKTOP (md e acima):
+------+ +------+ +------+ +------+
|Video1| |Video2| |Video3| |Video4|
+------+ +------+ +------+ +------+

MOBILE (abaixo de md):
+------+
|Video1|
+------+
   |
+------+
|Video2|
+------+
   |
+------+
|Video3|
+------+
   |
+------+
|Video4|
+------+
```

## Implementação

### Arquivo: `src/pages/LandingPage.tsx`

**Alteração nas linhas 759-771:**

Mudar de `flex flex-col` para um layout de grid responsivo:

- **Mobile**: `grid-cols-1` (empilhados)
- **Desktop**: `md:grid-cols-4` (lado a lado)

### Detalhes Técnicos
- Usar `grid` ao invés de `flex`
- Usar `grid-cols-1 md:grid-cols-4` para responsividade
- Usar `gap-4` para espaçamento uniforme
- Manter `aspect-[9/16]` para proporção vertical
- Ajustar largura máxima para desktop (`max-w-4xl` no container)
- Remover `max-w-xs` e `max-w-sm` individuais para permitir que o grid controle o tamanho

## Resultado Esperado
No celular, os vídeos aparecem um abaixo do outro. No computador, os 4 vídeos ficam lado a lado em uma única linha.

