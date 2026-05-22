import { useTranslation } from "react-i18next";
import { languages, normalizeLanguage, type LanguageCode } from "./languages";

export function useLanguage() {
  const { i18n } = useTranslation();
  const current = normalizeLanguage(i18n.language);

  const setLanguage = (code: LanguageCode) => {
    i18n.changeLanguage(code);
  };

  return { language: current, setLanguage, languages };
}