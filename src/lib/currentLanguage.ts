import { normalizeLanguage, type LanguageCode } from "@/i18n/languages";
import { I18N_STORAGE_KEY } from "@/i18n";

export function getCurrentLanguage(): LanguageCode {
  if (typeof window === "undefined") return "pt";
  try {
    const stored = window.localStorage.getItem(I18N_STORAGE_KEY);
    if (stored) return normalizeLanguage(stored);
    return normalizeLanguage(window.navigator.language);
  } catch {
    return "pt";
  }
}

export function getIntlLocale(): string {
  switch (getCurrentLanguage()) {
    case "en": return "en-US";
    case "es": return "es-ES";
    case "fr": return "fr-FR";
    default:   return "pt-BR";
  }
}