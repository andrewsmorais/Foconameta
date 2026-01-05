import { CheckCircle2, Mail, LogIn, Play, MessageCircle, ExternalLink } from "lucide-react";
import fundadorImage from "@/assets/fundador.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import logoImage from "@/assets/bateu-a-meta-logo.png";

const Obrigado = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col">
      {/* Header */}
      <header className="py-6 px-4">
        <div className="max-w-lg mx-auto flex justify-center">
          <img src={logoImage} alt="Bateu a Meta" className="h-12 w-auto" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-8">
        <div className="max-w-lg mx-auto space-y-6">
          
          {/* Success Header */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="bg-green-100 rounded-full p-3">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Pagamento Confirmado!
            </h1>
          </div>

          {/* Card de Boas-vindas Humanizado */}
          <Card className="border-none shadow-lg bg-white overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start gap-5">
                <img 
                  src={fundadorImage} 
                  alt="Andrews Morais" 
                  className="h-24 w-24 rounded-full object-cover flex-shrink-0 border-2 border-blue-100"
                />
                <div>
                  <p className="text-gray-700 text-base leading-relaxed">
                    <strong className="text-gray-900">Fala, parceiro!</strong> Sou o Andrews Morais. 
                    Também sou motorista de aplicativo e sei que o nosso tempo vale ouro. 
                    Criei o <strong>Bateu a Meta</strong> para a gente ter controle real do lucro. 
                    Parabéns pela decisão! Se precisar de ajuda, o suporte é direto comigo.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cards de Instruções */}
          <div className="space-y-3">
            {/* Card 1 - Email */}
            <Card className="border-none shadow-md bg-white">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 rounded-full p-2">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Dados no seu E-mail</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Enviamos agora seu e-mail e sua senha de acesso para a caixa de entrada (verifique também o spam).
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 2 - Login */}
            <Card className="border-none shadow-md bg-white">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 rounded-full p-2">
                    <LogIn className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Acesse o App</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Vá para o site oficial{" "}
                      <a 
                        href="https://bateuameta.com" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 font-medium hover:underline"
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
            <Card className="border-none shadow-md bg-white">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 rounded-full p-2">
                    <Play className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Como Usar</h3>
                    <p className="text-sm text-gray-600 mt-1 mb-3">
                      Preparei um vídeo rápido para você aprender a configurar tudo em 2 minutos.
                    </p>
                    <a
                      href="https://youtu.be/sbWG4v0Rm8I"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm bg-red-50 text-red-600 px-3 py-1.5 rounded-full font-medium hover:bg-red-100 transition-colors"
                    >
                      <Play className="h-4 w-4" />
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
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white h-14 text-lg font-semibold shadow-lg">
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
              className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 text-sm transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              Precisa de ajuda? Fale comigo no WhatsApp
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 px-4 text-center">
        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} Bateu a Meta
        </p>
      </footer>
    </div>
  );
};

export default Obrigado;
