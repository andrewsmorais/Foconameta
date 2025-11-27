import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Car, Info } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AvatarEditor } from "@/components/AvatarEditor";
import { Link } from "react-router-dom";

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
  const { toast } = useToast();

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
              placeholder="Seu nome completo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              value={profile.cpf}
              onChange={(e) => setProfile({ ...profile, cpf: e.target.value })}
              placeholder="000.000.000-00"
              maxLength={14}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Número de Telefone</Label>
            <Input
              id="telefone"
              value={profile.telefone}
              onChange={(e) => setProfile({ ...profile, telefone: e.target.value })}
              placeholder="(00) 00000-0000"
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
        <CardContent className="space-y-3 pt-6">
          <Link to="/veiculos">
            <Button variant="outline" className="w-full justify-start">
              <Car className="mr-2 h-4 w-4" />
              Adicionar Veículo
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Políticas Legais */}
      <Card>
        <CardHeader>
          <CardTitle>Políticas Legais</CardTitle>
          <CardDescription>Informações sobre reembolso e privacidade</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Política de Reembolso</h3>
            <p className="text-sm text-muted-foreground">
              Você tem direito a reembolso total em até <strong>7 dias</strong> após a compra, 
              conforme garantido pela legislação do consumidor.
            </p>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="font-semibold mb-2">Política de Privacidade (LGPD)</h3>
            <p className="text-sm text-muted-foreground">
              Seus dados pessoais são coletados e tratados de acordo com a Lei Geral de Proteção 
              de Dados (LGPD - Lei nº 13.709/2018). Armazenamos apenas as informações necessárias 
              para o funcionamento do aplicativo e garantimos a segurança dos seus dados. 
              Você tem direito de acessar, corrigir ou excluir suas informações a qualquer momento.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sobre o Aplicativo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Sobre o Aplicativo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">
            O aplicativo <strong>Bateu A Meta</strong> foi feito com a finalidade de auxiliar 
            o controle financeiro de motoristas de aplicativos.
          </p>
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
    </div>
  );
};

export default Configuracoes;
