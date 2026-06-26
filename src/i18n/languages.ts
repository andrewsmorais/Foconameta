export type LanguageCode = "pt" | "en" | "es" | "fr" | "de" | "it" | "nl" | "ja" | "zh" | "ko" | "ar";

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  flag: string;
  intl: string;
}

export const languages: LanguageOption[] = [
  { code: "en", label: "English",              nativeLabel: "English",            flag: "🇺🇸", intl: "en-US" },
  { code: "pt", label: "Portuguese (Brazil)", nativeLabel: "Português (Brasil)", flag: "🇧🇷", intl: "pt-BR" },
  { code: "es", label: "Spanish",              nativeLabel: "Español",            flag: "🇪🇸", intl: "es-ES" },
  { code: "fr", label: "French",               nativeLabel: "Français",           flag: "🇫🇷", intl: "fr-FR" },
  { code: "de", label: "German",               nativeLabel: "Deutsch",            flag: "🇩🇪", intl: "de-DE" },
  { code: "it", label: "Italian",              nativeLabel: "Italiano",           flag: "🇮🇹", intl: "it-IT" },
  { code: "nl", label: "Dutch",                nativeLabel: "Nederlands",         flag: "🇳🇱", intl: "nl-NL" },
  { code: "ja", label: "Japanese",             nativeLabel: "日本語",              flag: "🇯🇵", intl: "ja-JP" },
  { code: "zh", label: "Chinese",              nativeLabel: "中文",               flag: "🇨🇳", intl: "zh-CN" },
  { code: "ko", label: "Korean",               nativeLabel: "한국어",              flag: "🇰🇷", intl: "ko-KR" },
  { code: "ar", label: "Arabic",               nativeLabel: "العربية",            flag: "🇸🇦", intl: "ar-SA" },
];

export const DEFAULT_LANGUAGE: LanguageCode = "pt";

export function normalizeLanguage(input?: string | null): LanguageCode {
  if (!input) return DEFAULT_LANGUAGE;
  const lower = input.toLowerCase();
  if (lower.startsWith("pt")) return "pt";
  if (lower.startsWith("en")) return "en";
  if (lower.startsWith("es")) return "es";
  if (lower.startsWith("fr")) return "fr";
  if (lower.startsWith("de")) return "de";
  if (lower.startsWith("it")) return "it";
  if (lower.startsWith("nl")) return "nl";
  if (lower.startsWith("ja")) return "ja";
  if (lower.startsWith("zh")) return "zh";
  if (lower.startsWith("ko")) return "ko";
  if (lower.startsWith("ar")) return "ar";
  return DEFAULT_LANGUAGE;
}