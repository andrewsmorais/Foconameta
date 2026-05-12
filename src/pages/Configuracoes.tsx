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
        title: "Erro ao carregar perfil",
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
        title: "Sucesso",
        description: "Dados atualizados com sucesso!",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
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
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Gerencie suas informações e preferências</p>
      </div>

      {/* Foto de Perfil */}
      <Card>
        <CardHeader>
          <CardTitle>Foto de Perfil</CardTitle>
          <CardDescription>Clique na foto para editar com zoom e posicionamento</CardDescription>
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
              Recomendamos uma imagem quadrada de pelo menos 400x400 pixels
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Meus Dados */}
      <Card>
        <CardHeader>
          <CardTitle>Meus Dados</CardTitle>
          <CardDescription>Edite suas informações pessoais</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo</Label>
            <Input
              id="nome"
              value={profile.nome_completo}
              onChange={(e) => setProfile({ ...profile, nome_completo: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              value={profile.cpf}
              onChange={(e) => setProfile({ ...profile, cpf: e.target.value })}
              maxLength={14}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Número de Telefone</Label>
            <Input
              id="telefone"
              value={profile.telefone}
              onChange={(e) => setProfile({ ...profile, telefone: e.target.value })}
              maxLength={15}
            />
          </div>

          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </CardContent>
      </Card>

      {/* Veículos */}
      <Card>
        <CardContent className="pt-6">
          <Link to="/veiculos">
            <Button variant="outline" className="w-full justify-start text-base">
              <Car className="mr-2 h-5 w-5" />
              Adicionar Veículo
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Instalar App */}
      <Card>
        <CardContent className="pt-6">
          <Button 
            variant="outline" 
            className="w-full justify-start text-base"
            onClick={handleInstallClick}
          >
            <Download className="mr-2 h-5 w-5" />
            Instalar App
          </Button>
        </CardContent>
      </Card>

      {/* Como Usar */}
      <Card>
        <CardContent className="pt-6">
          <a 
            href="https://www.youtube.com/watch?v=u2kpNJZX5Y8" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Button variant="outline" className="w-full justify-start text-base">
              <PlayCircle className="mr-2 h-5 w-5" />
              Como Usar
            </Button>
          </a>
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
            Política de Reembolso
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start text-base"
            onClick={() => setShowPrivacyPolicy(true)}
          >
            Política de Privacidade (LGPD)
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start text-base"
            onClick={() => setShowAbout(true)}
          >
            <Info className="mr-2 h-5 w-5" />
            Sobre o Aplicativo
          </Button>

          <Button 
            variant="outline" 
            className="w-full justify-start text-base"
            onClick={() => setShowContact(true)}
          >
            <Phone className="mr-2 h-5 w-5" />
            Contato
          </Button>
        </CardContent>
      </Card>

      {/* Avatar Editor Dialog */}
      <Dialog open={showAvatarEditor} onOpenChange={setShowAvatarEditor}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Foto de Perfil</DialogTitle>
            <DialogDescription>
              Ajuste o zoom e posicionamento da sua foto
            </DialogDescription>
          </DialogHeader>
          <AvatarEditor onSave={handleAvatarSaved} onCancel={() => setShowAvatarEditor(false)} />
        </DialogContent>
      </Dialog>

      {/* Refund Policy Dialog */}
      <AlertDialog open={showRefundPolicy} onOpenChange={setShowRefundPolicy}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Política de Reembolso</AlertDialogTitle>
            <AlertDialogDescription className="text-foreground">
              Você tem direito a reembolso total em até 7 dias após a compra, conforme garantido pela legislação do consumidor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Button onClick={() => setShowRefundPolicy(false)}>Fechar</Button>
        </AlertDialogContent>
      </AlertDialog>

      {/* Privacy Policy Dialog */}
      <AlertDialog open={showPrivacyPolicy} onOpenChange={setShowPrivacyPolicy}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Política de Privacidade (LGPD)</AlertDialogTitle>
            <AlertDialogDescription className="text-foreground">
              Seus dados pessoais são coletados e tratados de acordo com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018). Armazenamos apenas as informações necessárias para o funcionamento do aplicativo e garantimos a segurança dos seus dados. Você tem direito de acessar, corrigir ou excluir suas informações a qualquer momento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Button onClick={() => setShowPrivacyPolicy(false)}>Fechar</Button>
        </AlertDialogContent>
      </AlertDialog>

      {/* About Dialog */}
      <AlertDialog open={showAbout} onOpenChange={setShowAbout}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sobre o Aplicativo</AlertDialogTitle>
            <AlertDialogDescription className="text-foreground">
              O aplicativo Bateu A Meta foi feito com a finalidade de auxiliar o controle financeiro de motoristas de aplicativos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Button onClick={() => setShowAbout(false)}>Fechar</Button>
        </AlertDialogContent>
      </AlertDialog>

      {/* Contact Dialog */}
      <AlertDialog open={showContact} onOpenChange={setShowContact}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Contato</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4 text-foreground">
              <div className="flex items-center gap-2">
                <Instagram className="h-5 w-5" />
                <span className="font-semibold">Instagram:</span>
                <a 
                  href="https://instagram.com/bateuameta" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  @Bateu A Meta
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                <span className="font-semibold">Celular (WhatsApp):</span>
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
          <Button onClick={() => setShowContact(false)}>Fechar</Button>
        </AlertDialogContent>
      </AlertDialog>

      {/* PWA Install Dialog */}
      <PWAInstallDialog open={showInstallDialog} onOpenChange={setShowInstallDialog} />
    </div>
  );
};

export default Configuracoes;
