

## Adicionar coluna "Data do Plano" na tabela de Gerenciamento de Usuários

### O que será feito

Adicionar uma nova coluna "Data do Plano" entre "Telefone" e "CPF" na tabela de usuários, mostrando a data em que o usuário adquiriu/iniciou sua assinatura (`started_at` da subscription).

### Detalhes técnicos

**Arquivo:** `src/components/superadmin/UsersManagement.tsx`

1. Adicionar `<TableHead>Data do Plano</TableHead>` após a coluna "Telefone" (linha ~629)
2. Adicionar `<TableCell>` correspondente após o telefone (linha ~665), formatando `user.started_at` com `format()` do date-fns em `dd/MM/yyyy`, ou mostrando "-" se não houver data
3. Atualizar o `colSpan` da mensagem "Nenhum usuário encontrado" de 8 para 9
4. O campo `started_at` já existe na interface `UserData` e já é retornado pelo edge function `get-admin-users`

**Layout resultante da tabela:**
```text
Nome | Email | Telefone | Data do Plano | CPF | Plano | Dias Restantes | Status | Ações
```

