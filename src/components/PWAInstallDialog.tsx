import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Check, Share, MoreVertical, Plus, Smartphone } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface PWAInstallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PWAInstallDialog = ({ open, onOpenChange }: PWAInstallDialogProps) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, browserName, install } = usePWAInstall();
  const { t } = useTranslation();

  const handleInstallClick = async () => {
    if (isInstalled) {
      toast.success(t("pwa.alreadyInstalled"));
      return;
    }

    if (isInstallable) {
      const success = await install();
      if (success) {
        toast.success(t("pwa.installedOk"));
        onOpenChange(false);
      }
    } else {
      toast.info(t("pwa.followOnScreen"));
    }
  };

  // iOS Instructions - shown immediately
  const renderIOSInstructions = () => (
    <div className="space-y-4">
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
        <div className="flex items-center gap-2 text-blue-500 mb-2">
          <Smartphone className="h-4 w-4" />
          <span className="text-sm font-medium">{t("pwa.iosDetected")}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("pwa.iosUseSafari")}
        </p>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#15a249] text-white text-sm font-bold shrink-0">
            1
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">{t("pwa.step1IosTitle")}</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="bg-blue-500 p-1.5 rounded">
                <Share className="h-4 w-4 text-white" />
              </div>
              <span className="text-xs text-muted-foreground">
                {t("pwa.step1IosDesc")}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#15a249] text-white text-sm font-bold shrink-0">
            2
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">{t("pwa.step2IosTitle")}</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="bg-muted border p-1.5 rounded">
                <Plus className="h-4 w-4" />
              </div>
              <span className="text-xs text-muted-foreground">
                {t("pwa.step2IosDesc")}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#15a249] text-white text-sm font-bold shrink-0">
            3
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">{t("pwa.step3IosTitle")}</p>
            <span className="text-xs text-muted-foreground">
              {t("pwa.step3IosDesc")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // Android Instructions
  const renderAndroidInstructions = () => (
    <div className="space-y-4">
      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
        <div className="flex items-center gap-2 text-green-500 mb-2">
          <Smartphone className="h-4 w-4" />
          <span className="text-sm font-medium">{t("pwa.androidDetected", { browser: browserName })}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {isInstallable 
            ? t("pwa.androidClickBelow")
            : t("pwa.androidManual")}
        </p>
      </div>

      {isInstallable ? (
        <Button
          onClick={handleInstallClick}
          size="lg"
          className="w-full gap-2 bg-[#15a249] hover:bg-[#128a3d] text-white"
        >
          <Download className="h-5 w-5" />
          {t("pwa.installNow")}
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#15a249] text-white text-sm font-bold shrink-0">
              1
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{t("pwa.step1AndTitle")}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="bg-muted border p-1.5 rounded">
                  <MoreVertical className="h-4 w-4" />
                </div>
                <span className="text-xs text-muted-foreground">
                  {t("pwa.step1AndDesc")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#15a249] text-white text-sm font-bold shrink-0">
              2
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{t("pwa.step2AndTitle")}</p>
              <span className="text-xs text-muted-foreground">
                {t("pwa.step2AndDesc")}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#15a249] text-white text-sm font-bold shrink-0">
              3
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{t("pwa.step3AndTitle")}</p>
              <span className="text-xs text-muted-foreground">
                {t("pwa.step3AndDesc")}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Desktop Instructions
  const renderDesktopInstructions = () => (
    <div className="space-y-4">
      {isInstallable ? (
        <Button
          onClick={handleInstallClick}
          size="lg"
          className="w-full gap-2 bg-[#15a249] hover:bg-[#128a3d] text-white"
        >
          <Download className="h-5 w-5" />
          {t("pwa.installNow")}
        </Button>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground text-center">
            {t("pwa.desktopFollow", { browser: browserName })}
          </p>
          
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#15a249] text-white text-sm font-bold shrink-0">
              1
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{t("pwa.step1DeskTitle")}</p>
              <span className="text-xs text-muted-foreground">
                {t("pwa.step1DeskDesc")}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#15a249] text-white text-sm font-bold shrink-0">
              2
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{t("pwa.step2DeskTitle")}</p>
              <span className="text-xs text-muted-foreground">
                {t("pwa.step2DeskDesc")}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render content based on device type
  const renderContent = () => {
    if (isIOS) return renderIOSInstructions();
    if (isAndroid) return renderAndroidInstructions();
    return renderDesktopInstructions();
  };

  // Already installed state
  if (isInstalled) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <img 
                src="/pwa-icon.png" 
                alt="Foco na Meta" 
                className="w-12 h-12 rounded-xl object-cover"
              />
              <span>Foco na Meta</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-lg">{t("pwa.installedTitle")}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t("pwa.installedSub")}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <img 
              src="/pwa-icon.png" 
              alt="Foco na Meta" 
              className="w-12 h-12 rounded-xl object-cover"
            />
            <span>{t("pwa.installTitle")}</span>
          </DialogTitle>
          <DialogDescription>
            {t("pwa.installDesc")}
          </DialogDescription>
        </DialogHeader>

        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};
