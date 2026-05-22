import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { DEFAULT_LANGUAGE, languages, normalizeLanguage } from "./languages";
import pt from "./locales/pt.json";
import en from "./locales/en.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";

export const I18N_STORAGE_KEY = "app_language";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      pt: { translation: pt },
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr },
    },
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: languages.map((l) => l.code),
    load: "languageOnly",
    nonExplicitSupportedLngs: true,
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      lookupLocalStorage: I18N_STORAGE_KEY,
      caches: ["localStorage"],
    },
    returnNull: false,
  });

// Normalize whatever detector picked (covers pt-BR -> pt, en-GB -> en, etc.)
const initial = normalizeLanguage(i18n.language);
if (initial !== i18n.language) {
  i18n.changeLanguage(initial);
}

const applyHtmlLang = (lng: string) => {
  if (typeof document !== "undefined") {
    document.documentElement.lang = normalizeLanguage(lng);
  }
};
applyHtmlLang(i18n.language);
i18n.on("languageChanged", applyHtmlLang);

export default i18n;