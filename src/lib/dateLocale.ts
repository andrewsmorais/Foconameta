import { ptBR, enUS, es, fr, type Locale } from "date-fns/locale";
import { getCurrentLanguage, getIntlLocale as getIntl } from "./currentLanguage";

export function getDateLocale(): Locale {
  switch (getCurrentLanguage()) {
    case "en": return enUS;
    case "es": return es;
    case "fr": return fr;
    default:   return ptBR;
  }
}

export const getIntlLocale = getIntl;

export function formatCurrency(value: number, currency = "BRL"): string {
  try {
    return new Intl.NumberFormat(getIntlLocale(), { style: "currency", currency }).format(value || 0);
  } catch {
    return `R$ ${(value || 0).toFixed(2)}`;
  }
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  try {
    return new Intl.NumberFormat(getIntlLocale(), options).format(value || 0);
  } catch {
    return String(value);
  }
}