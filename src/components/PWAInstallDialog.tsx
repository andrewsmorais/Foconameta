import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Check, Share, MoreVertical, Plus, X } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { toast } from "sonner";

interface PWAInstallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PWAInstallDialog = ({ open, onOpenChange }: PWAInstallDialogProps) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, browserName, install } = usePWAInstall();
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // Auto-trigger install prompt when dialog opens and is installable
    if (open && isInstallable && !isInstalled) {
      handleInstallClick();
    }
  }, [open, isInstallable, isInstalled]);

  const handleInstallClick = async () => {
    if (isInstalled) {
      toast.success("Aplicativo já está instalado!");
      onOpenChange(false);
      return;
    }

    if (isInstallable) {
      const success = await install();
      if (success) {
        toast.success("🎉 Aplicativo instalado com sucesso!");
        onOpenChange(false);
      } else {
        setShowInstructions(true);
      }
    } else {
      setShowInstructions(true);
    }
  };

  const renderIOSInstructions = () => (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
        <div className="w-7 h-7 rounded-full bg-[#15a249] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
          1
        </div>
        <div className="flex-1">
          <p className="font-medium text-foreground text-sm">Toque em Compartilhar</p>
          <div className="mt-1 p-2 bg-background rounded border border-border inline-flex items-center gap-2">
            <Share className="w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
        <div className="w-7 h-7 rounded-full bg-[#15a249] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
          2
        </div>
        <div className="flex-1">
          <p className="font-medium text-foreground text-sm">Adicionar à Tela de Início</p>
          <div className="mt-1 p-2 bg-background rounded border border-border inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
        <div className="w-7 h-7 rounded-full bg-[#15a249] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
          3
        </div>
        <div className="flex-1">
          <p className="font-medium text-foreground text-sm">Toque em "Adicionar"</p>
        </div>
      </div>
    </div>
  );

  const renderAndroidDesktopInstructions = () => (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
        <div className="w-7 h-7 rounded-full bg-[#15a249] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
          1
        </div>
        <div className="flex-1">
          <p className="font-medium text-foreground text-sm">Abra o menu do navegador</p>
          <div className="mt-1 p-2 bg-background rounded border border-border inline-flex items-center gap-2">
            <MoreVertical className="w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
        <div className="w-7 h-7 rounded-full bg-[#15a249] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
          2
        </div>
        <div className="flex-1">
          <p className="font-medium text-foreground text-sm">"Instalar aplicativo" ou "Adicionar à tela inicial"</p>
          <div className="mt-1 p-2 bg-background rounded border border-border inline-flex items-center gap-2">
            <Download className="w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
        <div className="w-7 h-7 rounded-full bg-[#15a249] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
          3
        </div>
        <div className="flex-1">
          <p className="font-medium text-foreground text-sm">Confirme a instalação</p>
        </div>
      </div>
    </div>
  );

  if (isInstalled) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <img 
                src="/pwa-icon.png" 
                alt="Bateu A Meta" 
                className="w-12 h-12 rounded-xl"
              />
              <span>Bateu A Meta</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center gap-3 p-6 bg-green-500/10 rounded-lg">
            <Check className="w-6 h-6 text-green-500" />
            <span className="text-green-500 font-medium">
              Aplicativo já está instalado!
            </span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <img 
              src="/pwa-icon.png" 
              alt="Bateu A Meta" 
              className="w-12 h-12 rounded-xl"
            />
            <span>Instalar Bateu A Meta</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Install Button */}
          {isInstallable && !showInstructions && (
            <Button
              onClick={handleInstallClick}
              size="lg"
              className="w-full text-lg py-6 bg-[#15a249] hover:bg-[#128a3d] text-white"
            >
              <Download className="w-5 h-5 mr-2" />
              Instalar Agora
            </Button>
          )}

          {/* Instructions */}
          {(showInstructions || !isInstallable) && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Siga os passos abaixo para instalar:
              </p>
              {isIOS ? renderIOSInstructions() : renderAndroidDesktopInstructions()}
            </div>
          )}

          {/* Show instructions toggle */}
          {isInstallable && !showInstructions && (
            <button
              onClick={() => setShowInstructions(true)}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Não apareceu a opção? Veja como instalar manualmente
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
