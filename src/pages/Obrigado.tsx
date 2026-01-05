import { CheckCircle2, Mail, Smartphone, PlayCircle, MessageCircle, ExternalLink } from "lucide-react";
import fundadorImage from "@/assets/fundador.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import logoImage from "@/assets/bateu-a-meta-logo.png";
import cachorroImage from "@/assets/cachorro-praia.jpeg";

const Obrigado = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="py-6 px-4 bg-card border-b border-border">
        <div className="max-w-lg mx-auto flex justify-center">
          <img src={cachorroImage} alt="Cachorro na praia" className="h-16 w-16 rounded-full object-cover" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-8">
        <div className="max-w-lg mx-auto space-y-6">
          
          {/* Success Header */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="bg-success/20 rounded-full p-4">
                <CheckCircle2 className="h-12 w-12 text-success" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Pagamento Confirmado!
            </h1>
            <h2 className="text-2xl md:text-3xl font-bold text-primary">
              Parabéns Motorista pela compra realizada!
            </h2>
          </div>

          {/* Card de Boas-vindas Humanizado */}
          <Card className="border-border shadow-lg overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start gap-5">
                <img 
                  src={fundadorImage} 
                  alt="Andrews Morais" 
                  className="h-32 w-32 rounded-full object-cover flex-shrink-0 border-2 border-primary/20"
                />
                <div>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    <strong className="text-foreground">Fala, parceiro!</strong> Sou o Andrews Morais. 
                    Também sou motorista de aplicativo e sei que o nosso tempo vale ouro. 
                    Criei o <strong>Bateu a Meta</strong> para a gente ter controle real do lucro. 
                    Parabéns pela decisão! Se precisar de ajuda, o suporte é direto comigo.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cards de Instruções */}
          <div className="space-y-4">
            {/* Card 1 - Email */}
            <Card className="border-border shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 rounded-xl p-3">
                    <Mail className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg">Dados no seu E-mail</h3>
                    <p className="text-base text-muted-foreground mt-1">
                      Enviamos agora seu e-mail e sua senha de acesso para a caixa de entrada (verifique também o spam).
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 2 - Login */}
            <Card className="border-border shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 rounded-xl p-3">
                    <Smartphone className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg">Acesse o App</h3>
                    <p className="text-base text-muted-foreground mt-1">
                      Vá para o site oficial{" "}
                      <a 
                        href="https://bateuameta.com" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary font-semibold hover:underline"
                      >
                        bateuameta.com
                      </a>{" "}
                      e use os dados que recebeu para entrar.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 3 - Tutorial */}
            <Card className="border-border shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="bg-destructive/10 rounded-xl p-3">
                    <PlayCircle className="h-7 w-7 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground text-lg">Como Usar</h3>
                    <p className="text-base text-muted-foreground mt-1 mb-3">
                      Preparei um vídeo rápido para você aprender a configurar tudo em 2 minutos.
                    </p>
                    <a
                      href="https://youtu.be/sbWG4v0Rm8I"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-base bg-destructive/10 text-destructive px-4 py-2 rounded-full font-semibold hover:bg-destructive/20 transition-colors"
                    >
                      <PlayCircle className="h-5 w-5" />
                      Assistir Tutorial
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Botão Principal */}
          <a
            href="https://bateuameta.com"
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 text-lg font-semibold shadow-lg">
              <ExternalLink className="mr-2 h-5 w-5" />
              Acessar o App Agora
            </Button>
          </a>

          {/* Link WhatsApp */}
          <div className="text-center pt-4">
            <a
              href="https://wa.me/5512981796135?text=Olá! Acabei de assinar o Bateu a Meta e preciso de ajuda."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-success text-base transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
              Precisa de ajuda? Fale comigo no WhatsApp
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 px-4 text-center border-t border-border">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Bateu a Meta
        </p>
      </footer>
    </div>
  );
};

export default Obrigado;
