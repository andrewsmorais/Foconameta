import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

let deferredPromptGlobal: BeforeInstallPromptEvent | null = null;

export const usePWAInstall = () => {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // If we already have a deferred prompt, use it
    if (deferredPromptGlobal) {
      setIsInstallable(true);
    }

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      deferredPromptGlobal = e;
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const install = useCallback(async (): Promise<boolean> => {
    if (deferredPromptGlobal) {
      try {
        await deferredPromptGlobal.prompt();
        const { outcome } = await deferredPromptGlobal.userChoice;
        
        if (outcome === "accepted") {
          setIsInstalled(true);
          deferredPromptGlobal = null;
          setIsInstallable(false);
          return true;
        }
      } catch (error) {
        console.error("Erro ao instalar PWA:", error);
      }
    }
    return false;
  }, []);

  return {
    isInstallable,
    isInstalled,
    isIOS,
    install,
  };
};
