

## Cadastrar manualmente o usuario Roberto Da Silva Lima

### Situacao

O pagamento foi confirmado na Cakto (24/03/2026, R$ 10,41 via Pix), mas o usuario nunca completou o formulario de cadastro e o link expirou. Precisamos criar a conta dele manualmente.

### O que sera feito

Chamar a Edge Function `process-sale-webhook` via curl com os dados do usuario para:

1. Criar o usuario no Supabase Auth com senha de 6 digitos
2. Criar o perfil com nome "Roberto Da Silva Lima"
3. Atribuir o plano mensal e role premium
4. Criar a assinatura ativa
5. Enviar o e-mail de boas-vindas com as credenciais automaticamente via Brevo

**Dados:**
- Email: robertosilvalima40@gmail.com
- Nome: Roberto Da Silva Lima
- Plano: mensal (ID: 49a734d8-af86-4a0b-accf-755d947cc1d8)

Apos a execucao, o usuario recebera o e-mail com login e senha para acessar o app.

