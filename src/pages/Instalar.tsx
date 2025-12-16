import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Check, Share, MoreVertical, Plus, Monitor, Smartphone } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { toast } from "sonner";
const pwaIcon = "/pwa-icon.png";

const Instalar = () => {
  const { isInstallable, isInstalled, isIOS, isAndroid, deviceType, browserName, install } = usePWAInstall();

  useEffect(() => {
    // Auto-trigger install prompt when available
    if (isInstallable && !isInstalled) {
      handleInstallClick();
    }
  }, [isInstallable, isInstalled]);

  const handleInstallClick = async () => {
    if (isInstalled) {
      toast.success("Aplicativo já está instalado!");
      return;
    }

    if (isInstallable) {
      const success = await install();
      if (success) {
        toast.success("🎉 Aplicativo instalado com sucesso!");
      } else {
        toast.info("Instalação cancelada pelo usuário.");
      }
    } else if (isIOS) {
      toast.info("Siga as instruções abaixo para instalar no iOS");
    } else {
      toast.info("Siga as instruções abaixo para instalar manualmente");
    }
  };

  const renderIOSInstructions = () => (
    <Card className="border-border bg-card">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-3 text-foreground">
          <Smartphone className="w-6 h-6 text-[#15a249]" />
          <span className="font-bold text-lg">iPhone / iPad (Safari)</span>
        </div>
        
        <div className="space-y-4 text-muted-foreground">
          <div className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-[#15a249] text-white flex items-center justify-center font-bold flex-shrink-0">
              1
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Toque no ícone de Compartilhar</p>
              <p className="text-sm mt-1">Na barra inferior do Safari, toque no ícone:</p>
              <div className="mt-2 p-2 bg-background rounded border border-border inline-flex items-center gap-2">
                <Share className="w-5 h-5" />
                <span className="text-sm">Compartilhar</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-[#15a249] text-white flex items-center justify-center font-bold flex-shrink-0">
              2
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Selecione "Adicionar à Tela de Início"</p>
              <p className="text-sm mt-1">Role para baixo e toque em:</p>
              <div className="mt-2 p-2 bg-background rounded border border-border inline-flex items-center gap-2">
                <Plus className="w-5 h-5" />
                <span className="text-sm">Adicionar à Tela de Início</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-[#15a249] text-white flex items-center justify-center font-bold flex-shrink-0">
              3
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Confirme tocando em "Adicionar"</p>
              <p className="text-sm mt-1">O app será adicionado à sua tela inicial</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderAndroidInstructions = () => (
    <Card className="border-border bg-card">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-3 text-foreground">
          <Smartphone className="w-6 h-6 text-[#15a249]" />
          <span className="font-bold text-lg">Android ({browserName})</span>
        </div>
        
        <div className="space-y-4 text-muted-foreground">
          <div className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-[#15a249] text-white flex items-center justify-center font-bold flex-shrink-0">
              1
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Toque no menu do navegador</p>
              <p className="text-sm mt-1">No canto superior direito, toque nos três pontos:</p>
              <div className="mt-2 p-2 bg-background rounded border border-border inline-flex items-center gap-2">
                <MoreVertical className="w-5 h-5" />
                <span className="text-sm">Menu</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-[#15a249] text-white flex items-center justify-center font-bold flex-shrink-0">
              2
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Selecione "Instalar aplicativo" ou "Adicionar à tela inicial"</p>
              <p className="text-sm mt-1">A opção pode variar conforme o navegador</p>
              <div className="mt-2 p-2 bg-background rounded border border-border inline-flex items-center gap-2">
                <Download className="w-5 h-5" />
                <span className="text-sm">Instalar aplicativo</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-[#15a249] text-white flex items-center justify-center font-bold flex-shrink-0">
              3
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Confirme a instalação</p>
              <p className="text-sm mt-1">O app será adicionado à sua tela inicial</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderDesktopInstructions = () => (
    <Card className="border-border bg-card">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-3 text-foreground">
          <Monitor className="w-6 h-6 text-[#15a249]" />
          <span className="font-bold text-lg">Computador ({browserName})</span>
        </div>
        
        <div className="space-y-4 text-muted-foreground">
          <div className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-[#15a249] text-white flex items-center justify-center font-bold flex-shrink-0">
              1
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Procure o ícone de instalação na barra de endereços</p>
              <p className="text-sm mt-1">No Chrome/Edge, aparece um ícone de instalação à direita:</p>
              <div className="mt-2 p-2 bg-background rounded border border-border inline-flex items-center gap-2">
                <Download className="w-5 h-5" />
                <span className="text-sm">Instalar</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-[#15a249] text-white flex items-center justify-center font-bold flex-shrink-0">
              2
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Ou acesse pelo menu do navegador</p>
              <p className="text-sm mt-1">Menu (⋮) → "Instalar Bateu A Meta..." ou "Criar atalho"</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-[#15a249] text-white flex items-center justify-center font-bold flex-shrink-0">
              3
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Confirme a instalação</p>
              <p className="text-sm mt-1">O app será instalado como aplicativo no seu computador</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderInstructions = () => {
    if (isIOS) return renderIOSInstructions();
    if (isAndroid) return renderAndroidInstructions();
    if (deviceType === "desktop") return renderDesktopInstructions();
    
    // Fallback: show Android instructions as they're most common
    return renderAndroidInstructions();
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-md mx-auto space-y-6 text-center">
        {/* Header */}
        <div className="space-y-4">
          <img
            src={pwaIcon}
            alt="Bateu a Meta"
            className="w-24 h-24 mx-auto rounded-2xl shadow-lg"
          />
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Instalar Bateu a Meta
          </h1>
        </div>

        {/* Already Installed */}
        {isInstalled ? (
          <Card className="border-green-500 bg-green-500/10">
            <CardContent className="flex items-center justify-center gap-3 p-6">
              <Check className="w-6 h-6 text-green-500" />
              <span className="text-green-500 font-medium text-lg">
                Aplicativo já está instalado!
              </span>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Install Button - only show if installable */}
            {isInstallable && (
              <Button
                onClick={handleInstallClick}
                size="lg"
                className="w-full text-lg py-6 bg-[#15a249] hover:bg-[#128a3d] text-white"
              >
                <Download className="w-5 h-5 mr-2" />
                Instalar Agora
              </Button>
            )}

            {/* Platform-specific instructions */}
            {!isInstallable && (
              <div className="space-y-4 text-left">
                <p className="text-center text-muted-foreground">
                  Siga as instruções abaixo para instalar o aplicativo:
                </p>
                {renderInstructions()}
              </div>
            )}

            {/* Show instructions even when installable, as backup */}
            {isInstallable && (
              <details className="text-left">
                <summary className="text-muted-foreground cursor-pointer text-center py-2">
                  Não apareceu a opção de instalar? Clique aqui
                </summary>
                <div className="mt-4">
                  {renderInstructions()}
                </div>
              </details>
            )}
          </>
        )}

        {/* Back to App */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => window.location.href = "/dashboard"}
        >
          Voltar para o Aplicativo
        </Button>
      </div>
    </div>
  );
};

export default Instalar;
