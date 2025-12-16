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

export type DeviceType = "ios" | "android" | "desktop" | "unknown";

export const usePWAInstall = () => {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [deviceType, setDeviceType] = useState<DeviceType>("unknown");
  const [browserName, setBrowserName] = useState<string>("");

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Also check for iOS standalone mode
    if ((navigator as any).standalone === true) {
      setIsInstalled(true);
      return;
    }

    // Detect device type
    const userAgent = navigator.userAgent.toLowerCase();
    const iOS = /iphone|ipad|ipod/.test(userAgent);
    const android = /android/.test(userAgent);
    
    setIsIOS(iOS);
    setIsAndroid(android);
    
    if (iOS) {
      setDeviceType("ios");
    } else if (android) {
      setDeviceType("android");
    } else if (/mobile|tablet/.test(userAgent)) {
      setDeviceType("unknown");
    } else {
      setDeviceType("desktop");
    }

    // Detect browser
    if (/chrome/.test(userAgent) && !/edge|edg/.test(userAgent)) {
      setBrowserName("Chrome");
    } else if (/edge|edg/.test(userAgent)) {
      setBrowserName("Edge");
    } else if (/safari/.test(userAgent) && !/chrome/.test(userAgent)) {
      setBrowserName("Safari");
    } else if (/firefox/.test(userAgent)) {
      setBrowserName("Firefox");
    } else {
      setBrowserName("Navegador");
    }

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
    isAndroid,
    deviceType,
    browserName,
    install,
  };
};
