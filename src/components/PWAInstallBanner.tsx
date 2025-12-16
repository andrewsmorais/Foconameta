import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";
import { Button } from "./ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { toast } from "sonner";
import pwaIcon from "@/assets/pwa-install-icon.png";

export const PWAInstallBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  useEffect(() => {
    if (isInstalled) return;

    // Check if user dismissed the banner before
    const dismissed = localStorage.getItem("pwa-banner-dismissed");
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    // Show banner after a delay
    const timer = setTimeout(() => {
      if (!isInstalled) {
        setShowBanner(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isInstalled]);

  const handleInstall = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setShowBanner(false);
        toast.success("App instalado com sucesso!");
      } else {
        // If user dismissed, redirect to install page with instructions
        window.location.href = "/instalar";
      }
    } else {
      // Redirect to install page with platform-specific instructions
      window.location.href = "/instalar";
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("pwa-banner-dismissed", Date.now().toString());
  };

  if (isInstalled || !showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom duration-300">
      <div className="mx-auto max-w-lg bg-card border border-border rounded-2xl shadow-2xl p-4">
        <div className="flex items-start gap-4">
          <img 
            src={pwaIcon} 
            alt="Bateu a Meta" 
            className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-foreground text-lg">
                  Instale o App
                </h3>
                <p className="text-muted-foreground text-sm mt-1">
                  {isIOS 
                    ? "Toque para ver como instalar" 
                    : "Acesse mais rápido e use offline"}
                </p>
              </div>
              <button 
                onClick={handleDismiss}
                className="p-1 hover:bg-muted rounded-full transition-colors flex-shrink-0"
                aria-label="Fechar"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            
            <div className="flex gap-2 mt-3">
              <Button 
                onClick={handleInstall}
                size="sm"
                className="flex-1 bg-[#15a249] hover:bg-[#128a3d] text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                {isInstallable ? "Instalar Agora" : "Ver Instruções"}
              </Button>
              <Button 
                onClick={handleDismiss}
                variant="outline"
                size="sm"
              >
                Depois
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
