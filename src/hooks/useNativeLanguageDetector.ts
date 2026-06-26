import { useEffect } from "react";
import { Device } from "@capacitor/device";
import { Capacitor } from "@capacitor/core";
import { useTranslation } from "react-i18next";
import { I18N_STORAGE_KEY } from "@/i18n";
import { normalizeLanguage } from "@/i18n/languages";

export const useNativeLanguageDetector = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    const setNativeLanguage = async () => {
      // Se não for nativo, o i18next-browser-languagedetector já resolveu isso via navigator
      if (!Capacitor.isNativePlatform()) return;
      
      // Se já houver um idioma salvo pelo usuário, não forçamos a troca
      if (localStorage.getItem(I18N_STORAGE_KEY)) return;

      try {
        const info = await Device.getLanguageCode();
        const code = info.value; // ex: "pt-BR", "en-US", "es"
        const normalized = normalizeLanguage(code);
        
        if (normalized && normalized !== i18n.language) {
          await i18n.changeLanguage(normalized);
        }
      } catch (error) {
        console.error("Erro ao ler idioma nativo do Capacitor:", error);
      }
    };

    setNativeLanguage();
  }, [i18n]);
};
