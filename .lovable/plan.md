
# Plano: Adicionar Opção "Como Usar" no Menu Configurações

## Objetivo
Adicionar um botão "Como Usar" no menu de Configurações, abaixo da opção "Adicionar Veículo", que abre o vídeo tutorial do YouTube em uma nova aba.

## Alteração

**Arquivo:** `src/pages/Configuracoes.tsx`

### O que será feito:

1. **Importar o ícone PlayCircle** do lucide-react (linha 10)
   - Adicionar `PlayCircle` aos imports existentes

2. **Adicionar novo botão no Card de Veículos** (após linha 204)
   - Criar um link externo para o vídeo tutorial
   - Usar o mesmo estilo dos outros botões: `variant="outline"` com `w-full justify-start text-base`
   - Incluir ícone PlayCircle com `mr-2 h-5 w-5`
   - Texto: "Como Usar"
   - Link: `https://youtu.be/u2kpNJZX5Y8`
   - Abrir em nova aba com `target="_blank"` e `rel="noopener noreferrer"`

### Código a ser adicionado:

```tsx
<a 
  href="https://youtu.be/u2kpNJZX5Y8" 
  target="_blank" 
  rel="noopener noreferrer"
>
  <Button variant="outline" className="w-full justify-start text-base">
    <PlayCircle className="mr-2 h-5 w-5" />
    Como Usar
  </Button>
</a>
```

## Resultado Visual

```text
┌─────────────────────────────────────┐
│  🚗  Adicionar Veículo              │
├─────────────────────────────────────┤
│  ▶️  Como Usar                       │  ← NOVO
└─────────────────────────────────────┘
```

## O que NÃO será alterado
- Estilo do Card
- Outros botões existentes
- Qualquer outra seção do menu Configurações

## Resultado Esperado
O usuário verá a opção "Como Usar" logo abaixo de "Adicionar Veículo", com o mesmo visual padrão dos outros botões. Ao clicar, o vídeo tutorial abrirá em uma nova aba do navegador.
