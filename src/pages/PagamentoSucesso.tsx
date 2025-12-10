import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import logoImage from "@/assets/bateu-a-meta-logo.png";

const PagamentoSucesso = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <img 
              src={logoImage} 
              alt="Bateu a Meta" 
              className="w-20 h-20 rounded-full object-cover mx-auto"
            />
          </div>
          <div className="mx-auto mb-4 p-4 rounded-full bg-green-500/10 w-fit">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl text-green-500">
            Pagamento Confirmado!
          </CardTitle>
          <CardDescription className="text-base">
            Sua assinatura foi ativada com sucesso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Bem-vindo ao Bateu a Meta! Agora você tem acesso completo a todas as funcionalidades do aplicativo.
          </p>

          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Redirecionando em {countdown} segundos...</span>
          </div>

          <Button 
            className="w-full" 
            size="lg"
            onClick={() => navigate("/")}
          >
            Acessar o App Agora
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PagamentoSucesso;
