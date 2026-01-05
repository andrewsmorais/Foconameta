import { Link } from "react-router-dom";
import { Mail, Download, LogIn, Play, MessageCircle } from "lucide-react";
import mascoteImage from "@/assets/mascote-cachorro.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import logoImage from "@/assets/bateu-a-meta-logo.png";

const Obrigado = () => {
  const passos = [
    {
      numero: 1,
      icone: Mail,
      titulo: "Verifique seu Email",
      descricao: "Enviamos suas credenciais de acesso para o email cadastrado na compra.",
    },
    {
      numero: 2,
      icone: Download,
      titulo: "Instale o App",
      descricao: "Acesse pelo navegador e instale como um aplicativo no seu celular.",
    },
    {
      numero: 3,
      icone: LogIn,
      titulo: "Faça Login",
      descricao: "Use o email e senha que recebeu para entrar no app.",
    },
    {
      numero: 4,
      icone: Play,
      titulo: "Comece a Registrar",
      descricao: "Configure seus dados e registre seu primeiro turno de trabalho.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col">
      {/* Header */}
      <header className="py-6 px-4">
        <div className="max-w-lg mx-auto flex justify-center">
          <img src={logoImage} alt="Bateu a Meta" className="h-12 w-auto" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-lg w-full space-y-8">
          {/* Success Message */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <img 
                src={mascoteImage} 
                alt="Mascote Bateu a Meta" 
                className="h-24 w-24 rounded-full object-cover shadow-lg"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Pagamento Confirmado!
            </h1>
            <p className="text-lg text-gray-600">
              Obrigado por se juntar ao <strong>Bateu a Meta</strong>! 🎉
            </p>
          </div>

          {/* Próximos Passos */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 text-center">
              Próximos Passos
            </h2>
            
            <div className="space-y-3">
              {passos.map((passo) => (
                <Card key={passo.numero} className="border-none shadow-md bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="bg-blue-100 rounded-full h-10 w-10 flex items-center justify-center">
                          <span className="text-blue-600 font-bold">{passo.numero}</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <passo.icone className="h-4 w-4 text-blue-600" />
                          <h3 className="font-semibold text-gray-900">{passo.titulo}</h3>
                        </div>
                        <p className="text-sm text-gray-600">{passo.descricao}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg">
              <Link to="/auth">
                <LogIn className="mr-2 h-5 w-5" />
                Acessar o App
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="w-full h-12 text-lg border-blue-600 text-blue-700 hover:bg-blue-50">
              <Link to="/instalar">
                <Download className="mr-2 h-5 w-5" />
                Como Instalar
              </Link>
            </Button>
          </div>

          {/* Support */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">
              Precisa de ajuda?
            </p>
            <a
              href="https://wa.me/5511999999999?text=Olá! Acabei de assinar o Bateu a Meta e preciso de ajuda."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <MessageCircle className="h-4 w-4" />
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 px-4 text-center">
        <p className="text-sm text-gray-500">
          © {new Date().getFullYear()} Bateu a Meta. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
};

export default Obrigado;
