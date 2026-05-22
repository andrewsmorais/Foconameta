# Plano: Internacionalização Completa (PT-BR, EN, ES, FR)

## Visão geral
Implementar suporte a 4 idiomas no app inteiro usando `react-i18next`, com detecção automática do idioma do sistema (celular/navegador) e opção de troca manual em **Configurações**. PT-BR continua como canônico (chaves baseadas no texto PT).

## Escopo

### 1. Infraestrutura i18n
Criar:
- `src/i18n/index.ts` — inicialização do i18next com `LanguageDetector` (navigator/localStorage), fallback PT.
- `src/i18n/languages.ts` — lista `{ code, label, flag }` para PT/EN/ES/FR.
- `src/i18n/useLanguage.ts` — hook `useLanguage()` retornando `{ language, setLanguage, languages }`.
- `src/i18n/locales/pt.json`, `en.json`, `es.json`, `fr.json` — dicionários organizados por namespace (common, nav, dashboard, km, ganhosDespesas, manutencoes, metas, relatorios, veiculos, configuracoes, auth, landing, planos, superAdmin, dialogs, toasts).
- `src/lib/currentLanguage.ts` — `getCurrentLanguage()` para uso fora de React (passar p/ edge functions).
- `src/lib/dateLocale.ts` — `getDateLocale()` (date-fns: ptBR/enUS/es/fr) e `getIntlLocale()` (`pt-BR`/`en-US`/`es-ES`/`fr-FR`) para `Intl.NumberFormat`/`DateTimeFormat`.
- Importar `./i18n` no `src/main.tsx`.

### 2. UI — Seletor de idioma em Configurações
Novo card "Idioma / Language" em `src/pages/Configuracoes.tsx` com `Select` (bandeira + nome). Persiste em `localStorage` via `useLanguage`.

### 3. Substituição de strings hardcoded
Trocar todas as strings visíveis por `t('chave')` em:
- Páginas: `Dashboard`, `KM`, `GanhosDespesas`, `Manutencoes`, `Metas`, `Relatorios`, `Veiculos`, `Configuracoes`, `Auth`, `Planos`, `PagamentoSucesso`, `LandingPage`, `Obrigado`, `PoliticaPrivacidade`, `TermosDeUso`, `Instalar`, `NotFound`, `SuperAdmin`.
- Componentes: `Layout`/Nav, todos os `dialogs/*`, `superadmin/*`, `PWAInstallDialog`, `PWAInstallBanner`, `OfflineIndicator`, `AvatarEditor`, `ThemeToggle`, etc.
- Mensagens de `toast` e validações.

PT continua canônico — chaves derivadas do texto PT (ex.: `dashboard.title`, `toasts.salvoSucesso`).

### 4. Datas, números e moeda
- Substituir `toLocaleDateString('pt-BR'…)` por `Intl.DateTimeFormat(getIntlLocale(), …)`.
- Substituir formatação `R$` fixa por `Intl.NumberFormat(getIntlLocale(), { style: 'currency', currency: 'BRL' })` (mantém BRL — app é brasileiro; só o formato dos separadores muda). Outros números via `Intl.NumberFormat`.
- `date-fns/format` recebe `{ locale: getDateLocale() }`.

### 5. Edge Functions
Edge functions que enviam e-mails/respostas para o usuário (`cakto-webhook`, `process-sale-webhook`, `resend-welcome-email`, `send-abandoned-cart-email`, `complete-registration`, `reset-user-password`, `send-webhook`) passam a:
- Aceitar `language` no body (default `pt-BR`).
- Selecionar template/strings conforme idioma (mini dicionário inline em cada função).
- Frontend envia `language: getCurrentLanguage()` em todas as invocações.

### 6. HTML
- `index.html`: `<html lang>` atualizado dinamicamente pelo i18n no boot.

## Detalhes técnicos
- Dependências novas: `react-i18next`, `i18next`, `i18next-browser-languagedetector`. (`date-fns` já presente.)
- Detecção: ordem `localStorage` → `navigator` → fallback `pt`.
- Mapeamento: `pt-*` → `pt`; `en-*` → `en`; `es-*` → `es`; `fr-*` → `fr`.
- Chaves ausentes em locale fazem fallback para PT (sem quebrar UI).
- Não alterar lógica de negócio, schema, RLS ou fluxos — só camada de apresentação + parâmetro `language` nas functions.

## Observações
- É um diff grande (≈30+ arquivos). Vou agrupar edições por área (infra → configurações → páginas → dialogs → edge functions) para manter coerência.
- Moeda continua **BRL** em todos os idiomas (público-alvo brasileiro do app). Se quiser conversão real de moeda, é outro escopo.
- Após aprovar, implemento direto sem novas perguntas.
