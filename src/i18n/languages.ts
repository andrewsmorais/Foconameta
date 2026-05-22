export type LanguageCode = "pt" | "en" | "es" | "fr";

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  flag: string;
  intl: string;
}

export const languages: LanguageOption[] = [
  { code: "pt", label: "Portuguese (Brazil)", nativeLabel: "Português (Brasil)", flag: "🇧🇷", intl: "pt-BR" },
  { code: "en", label: "English",              nativeLabel: "English",            flag: "🇺🇸", intl: "en-US" },
  { code: "es", label: "Spanish",              nativeLabel: "Español",            flag: "🇪🇸", intl: "es-ES" },
  { code: "fr", label: "French",               nativeLabel: "Français",           flag: "🇫🇷", intl: "fr-FR" },
];

export const DEFAULT_LANGUAGE: LanguageCode = "pt";

export function normalizeLanguage(input?: string | null): LanguageCode {
  if (!input) return DEFAULT_LANGUAGE;
  const lower = input.toLowerCase();
  if (lower.startsWith("pt")) return "pt";
  if (lower.startsWith("en")) return "en";
  if (lower.startsWith("es")) return "es";
  if (lower.startsWith("fr")) return "fr";
  return DEFAULT_LANGUAGE;
}