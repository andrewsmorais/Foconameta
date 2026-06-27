import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Check, Share, MoreVertical, Plus, Monitor, Smartphone } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
const pwaIcon = "/pwa-icon.png";

const Instalar = () => {
  const { isInstallable, isInstalled, isIOS, isAndroid, deviceType, browserName, install } = usePWAInstall();
  const { t } = useTranslation();

  useEffect(() => {
    // Auto-trigger install prompt when available
    if (isInstallable && !isInstalled) {
      handleInstallClick();
    }
  }, [isInstallable, isInstalled]);

  const handleInstallClick = async () => {
    if (isInstalled) {
      toast.success(t("instalar.alreadyInstalled"));
      return;
    }

    if (isInstallable) {
      const success = await install();
      if (success) {
        toast.success(t("instalar.installedOk"));
      } else {
        toast.info(t("instalar.canceled"));
      }
    } else if (isIOS) {
      toast.info(t("instalar.iosInstructions"));
    } else {
      toast.info(t("instalar.manualInstructions"));
    }
  };

  const renderIOSInstructions = () => (
    <Card className="border-border bg-card">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-3 text-foreground">
          <Smartphone className="w-6 h-6 text-[#15a249]" />
          <span className="font-bold text-lg">{t("instalar.iosHeader")}</span>
        </div>
        
        <div className="space-y-4 text-muted-foreground">
          <div className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-[#15a249] text-white flex items-center justify-center font-bold flex-shrink-0">
              1
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">{t("instalar.ios1Title")}</p>
              <p className="text-sm mt-1">{t("instalar.ios1Desc")}</p>
              <div className="mt-2 p-2 bg-background rounded border border-border inline-flex items-center gap-2">
                <Share className="w-5 h-5" />
                <span className="text-sm">{t("instalar.ios1Btn")}</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-[#15a249] text-white flex items-center justify-center font-bold flex-shrink-0">
              2
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">{t("instalar.ios2Title")}</p>
              <p className="text-sm mt-1">{t("instalar.ios2Desc")}</p>
              <div className="mt-2 p-2 bg-background rounded border border-border inline-flex items-center gap-2">
                <Plus className="w-5 h-5" />
                <span className="text-sm">{t("instalar.ios2Btn")}</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-[#15a249] text-white flex items-center justify-center font-bold flex-shrink-0">
              3
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">{t("instalar.ios3Title")}</p>
              <p className="text-sm mt-1">{t("instalar.ios3Desc")}</p>
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
          <span className="font-bold text-lg">{t("instalar.androidHeader", { browser: browserName })}</span>
        </div>
        
        <div className="space-y-4 text-muted-foreground">
          <div className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-[#15a249] text-white flex items-center justify-center font-bold flex-shrink-0">
              1
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">{t("instalar.and1Title")}</p>
              <p className="text-sm mt-1">{t("instalar.and1Desc")}</p>
              <div className="mt-2 p-2 bg-background rounded border border-border inline-flex items-center gap-2">
                <MoreVertical className="w-5 h-5" />
                <span className="text-sm">{t("instalar.and1Btn")}</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-[#15a249] text-white flex items-center justify-center font-bold flex-shrink-0">
              2
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">{t("instalar.and2Title")}</p>
              <p className="text-sm mt-1">{t("instalar.and2Desc")}</p>
              <div className="mt-2 p-2 bg-background rounded border border-border inline-flex items-center gap-2">
                <Download className="w-5 h-5" />
                <span className="text-sm">{t("instalar.and2Btn")}</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-[#15a249] text-white flex items-center justify-center font-bold flex-shrink-0">
              3
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">{t("instalar.and3Title")}</p>
              <p className="text-sm mt-1">{t("instalar.and3Desc")}</p>
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
          <span className="font-bold text-lg">{t("instalar.desktopHeader", { browser: browserName })}</span>
        </div>
        
        <div className="space-y-4 text-muted-foreground">
          <div className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-[#15a249] text-white flex items-center justify-center font-bold flex-shrink-0">
              1
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">{t("instalar.desk1Title")}</p>
              <p className="text-sm mt-1">{t("instalar.desk1Desc")}</p>
              <div className="mt-2 p-2 bg-background rounded border border-border inline-flex items-center gap-2">
                <Download className="w-5 h-5" />
                <span className="text-sm">{t("instalar.desk1Btn")}</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-[#15a249] text-white flex items-center justify-center font-bold flex-shrink-0">
              2
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">{t("instalar.desk2Title")}</p>
              <p className="text-sm mt-1">{t("instalar.desk2Desc")}</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-[#15a249] text-white flex items-center justify-center font-bold flex-shrink-0">
              3
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">{t("instalar.desk3Title")}</p>
              <p className="text-sm mt-1">{t("instalar.desk3Desc")}</p>
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
            alt="Meu Faturamento App"
            className="w-24 h-24 mx-auto rounded-2xl shadow-lg"
          />
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {t("instalar.title")}
          </h1>
        </div>

        {/* Already Installed */}
        {isInstalled ? (
          <Card className="border-green-500 bg-green-500/10">
            <CardContent className="flex items-center justify-center gap-3 p-6">
              <Check className="w-6 h-6 text-green-500" />
              <span className="text-green-500 font-medium text-lg">
                {t("instalar.installedBadge")}
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
                {t("instalar.installNow")}
              </Button>
            )}

            {/* Platform-specific instructions */}
            {!isInstallable && (
              <div className="space-y-4 text-left">
                <p className="text-center text-muted-foreground">
                  {t("instalar.followToInstall")}
                </p>
                {renderInstructions()}
              </div>
            )}

            {/* Show instructions even when installable, as backup */}
            {isInstallable && (
              <details className="text-left">
                <summary className="text-muted-foreground cursor-pointer text-center py-2">
                  {t("instalar.noOption")}
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
          {t("instalar.backToApp")}
        </Button>
      </div>
    </div>
  );
};

export default Instalar;
