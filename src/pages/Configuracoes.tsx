import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Car, Download, Info, Instagram, Phone, PlayCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AvatarEditor } from "@/components/AvatarEditor";
import { Link } from "react-router-dom";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { PWAInstallDialog } from "@/components/PWAInstallDialog";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/i18n/useLanguage";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Profile {
  nome_completo: string;
  cpf: string;
  telefone: string;
  avatar_url: string | null;
}

const Configuracoes = () => {
  const { t } = useTranslation();
  const { language, setLanguage, languages } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    nome_completo: "",
    cpf: "",
    telefone: "",
    avatar_url: null,
  });
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  const [showRefundPolicy, setShowRefundPolicy] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const { toast } = useToast();
  const { install, isInstallable } = usePWAInstall();

  const handleInstallClick = async () => {
    if (isInstallable) {
      const installed = await install();
      if (installed) return;
    }
    setShowInstallDialog(true);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setProfile(data);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("configuracoes.erroCarregar"),
        description: error.message,
      });
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          nome_completo: profile.nome_completo,
          cpf: profile.cpf,
          telefone: profile.telefone,
        });

      if (error) throw error;

      toast({
        title: t("common.success"),
        description: t("configuracoes.dadosAtualizados"),
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("configuracoes.erroSalvar"),
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarSaved = (url: string) => {
    setProfile({ ...profile, avatar_url: url });
    setShowAvatarEditor(false);
  };

  const getInitials = () => {
    if (!profile.nome_completo) return "?";
    const names = profile.nome_completo.split(" ");
    return names.length > 1
      ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      : names[0][0].toUpperCase();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">{t("configuracoes.title")}</h1>
        <p className="text-muted-foreground">{t("configuracoes.subtitle")}</p>
      </div>

      {/* Foto de Perfil */}
      <Card>
        <CardHeader>
          <CardTitle>{t("configuracoes.foto")}</CardTitle>
          <CardDescription>{t("configuracoes.fotoHelp")}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
            </Avatar>
            <Button
              size="icon"
              variant="secondary"
              className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
              onClick={() => setShowAvatarEditor(true)}
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {t("configuracoes.fotoSize")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Meus Dados */}
      <Card>
        <CardHeader>
          <CardTitle>{t("configuracoes.meusDados")}</CardTitle>
          <CardDescription>{t("configuracoes.meusDadosDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">{t("configuracoes.nomeCompleto")}</Label>
            <Input
              id="nome"
              value={profile.nome_completo}
              onChange={(e) => setProfile({ ...profile, nome_completo: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf">{t("configuracoes.cpf")}</Label>
            <Input
              id="cpf"
              value={profile.cpf}
              onChange={(e) => setProfile({ ...profile, cpf: e.target.value })}
              maxLength={14}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">{t("configuracoes.telefone")}</Label>
            <Input
              id="telefone"
              value={profile.telefone}
              onChange={(e) => setProfile({ ...profile, telefone: e.target.value })}
              maxLength={15}
            />
          </div>

          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? t("common.saving") : t("common.saveChanges")}
          </Button>
        </CardContent>
      </Card>

      {/* Idioma */}
      <Card>
        <CardHeader>
          <CardTitle>{t("configuracoes.idioma")}</CardTitle>
          <CardDescription>{t("configuracoes.idiomaDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={language} onValueChange={(v) => setLanguage(v as any)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languages.map((l) => (
                <SelectItem key={l.code} value={l.code}>
                  <span className="mr-2">{l.flag}</span>
                  {l.nativeLabel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Políticas e Informações */}
      <Card>
        <CardContent className="space-y-3 pt-6">
          <Button 
            variant="outline"
            className="w-full justify-start text-base"
            onClick={() => setShowRefundPolicy(true)}
          >
            {t("configuracoes.politicaReembolso")}
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start text-base"
            onClick={() => setShowPrivacyPolicy(true)}
          >
            {t("configuracoes.politicaPrivacidade")}
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start text-base"
            onClick={() => setShowAbout(true)}
          >
            <Info className="mr-2 h-5 w-5" />
            {t("configuracoes.sobre")}
          </Button>

          <Button 
            variant="outline" 
            className="w-full justify-start text-base"
            onClick={() => setShowContact(true)}
          >
            <Phone className="mr-2 h-5 w-5" />
            {t("configuracoes.contato")}
          </Button>
        </CardContent>
      </Card>

      {/* Avatar Editor Dialog */}
      <Dialog open={showAvatarEditor} onOpenChange={setShowAvatarEditor}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("configuracoes.editarFoto")}</DialogTitle>
            <DialogDescription>{t("configuracoes.editarFotoDesc")}</DialogDescription>
          </DialogHeader>
          <AvatarEditor onSave={handleAvatarSaved} onCancel={() => setShowAvatarEditor(false)} />
        </DialogContent>
      </Dialog>

      {/* Refund Policy Dialog */}
      <AlertDialog open={showRefundPolicy} onOpenChange={setShowRefundPolicy}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("configuracoes.politicaReembolso")}</AlertDialogTitle>
            <AlertDialogDescription className="text-foreground">
              {t("configuracoes.reembolsoTexto")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Button onClick={() => setShowRefundPolicy(false)}>{t("common.close")}</Button>
        </AlertDialogContent>
      </AlertDialog>

      {/* Privacy Policy Dialog */}
      <AlertDialog open={showPrivacyPolicy} onOpenChange={setShowPrivacyPolicy}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("configuracoes.politicaPrivacidade")}</AlertDialogTitle>
            <AlertDialogDescription className="text-foreground">
              {t("configuracoes.lgpdTexto")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Button onClick={() => setShowPrivacyPolicy(false)}>{t("common.close")}</Button>
        </AlertDialogContent>
      </AlertDialog>

      {/* About Dialog */}
      <AlertDialog open={showAbout} onOpenChange={setShowAbout}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("configuracoes.sobre")}</AlertDialogTitle>
            <AlertDialogDescription className="text-foreground">
              {t("configuracoes.sobreTexto")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Button onClick={() => setShowAbout(false)}>{t("common.close")}</Button>
        </AlertDialogContent>
      </AlertDialog>

      {/* Contact Dialog */}
      <AlertDialog open={showContact} onOpenChange={setShowContact}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("configuracoes.contato")}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4 text-foreground">
              <div className="flex items-center gap-2">
                <Instagram className="h-5 w-5" />
                <span className="font-semibold">{t("configuracoes.instagram")}:</span>
                <a 
                  href="https://instagram.com/bateuameta" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  @Foco na Meta
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                <span className="font-semibold">{t("configuracoes.whatsapp")}:</span>
                <a 
                  href="https://wa.me/5512981387508" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  12 98138-7508
                </a>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Button onClick={() => setShowContact(false)}>{t("common.close")}</Button>
        </AlertDialogContent>
      </AlertDialog>

      {/* PWA Install Dialog */}
      <PWAInstallDialog open={showInstallDialog} onOpenChange={setShowInstallDialog} />
    </div>
  );
};

export default Configuracoes;
