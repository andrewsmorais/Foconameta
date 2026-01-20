import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logoImage from "@/assets/bateu-a-meta-logo.png";

const CAKTO_CHECKOUT_URL = "https://pay.cakto.com.br/pxje8kx_669077";

const Planos = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      
      if (session) {
        const { data } = await supabase.functions.invoke("check-subscription", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        
        if (data?.hasActiveSubscription) {
          navigate("/dashboard");
        }
      }
    };
    
    checkAuth();
  }, [navigate]);

  const handleSelectPlan = async () => {
    // Verificar se já tem email (usuário logado)
    const { data: { session } } = await supabase.auth.getSession();
    const email = session?.user?.email || "";

    // Redirecionar para checkout da Cakto com email se disponível
    const checkoutUrl = email 
      ? `${CAKTO_CHECKOUT_URL}?email=${encodeURIComponent(email)}`
      : CAKTO_CHECKOUT_URL;
    
    window.location.href = checkoutUrl;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <img 
            src={logoImage} 
            alt="Bateu a Meta" 
            className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover mx-auto mb-4"
          />
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Escolha seu Plano
          </h1>
          <p className="text-muted-foreground">
            Controle suas finanças como motorista de app
          </p>
        </div>

        {/* Plano Anual Exclusive */}
        <Card className="relative border-2 border-[#3c83f6] shadow-lg">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-[#25D366] text-white px-4 py-1 font-bold">
              Economize R$ 49,10 agora!
            </Badge>
          </div>
          <CardHeader className="text-center pb-2 pt-6">
            <div className="mx-auto mb-2 p-3 rounded-full bg-[#3c83f6]/10 w-fit">
              <Crown className="h-8 w-8 text-[#3c83f6]" />
            </div>
            <CardTitle className="text-2xl text-[#3c83f6]">PLANO ANUAL EXCLUSIVE</CardTitle>
            <CardDescription>Acesso completo por 1 ano</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <ul className="space-y-3 mb-6 text-left">
              <li className="flex items-start gap-2">
                <div className="bg-[#f97316] rounded-full p-1 mt-0.5 flex-shrink-0">
                  <Check className="h-3 w-3 text-white" />
                </div>
                <span className="text-sm"><strong>Ganhos Brutos, Ganhos Líquidos e Despesas:</strong> Tenha a clareza total do seu saldo em cada turno.</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="bg-[#f97316] rounded-full p-1 mt-0.5 flex-shrink-0">
                  <Check className="h-3 w-3 text-white" />
                </div>
                <span className="text-sm"><strong>Ganhos por Hora, Ganho por KM e Despesas por KM:</strong> Entenda sua performance real no trecho.</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="bg-[#f97316] rounded-full p-1 mt-0.5 flex-shrink-0">
                  <Check className="h-3 w-3 text-white" />
                </div>
                <span className="text-sm"><strong>Custo por Combustível:</strong> Controle exato do seu maior gasto diário.</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="bg-[#f97316] rounded-full p-1 mt-0.5 flex-shrink-0">
                  <Check className="h-3 w-3 text-white" />
                </div>
                <span className="text-sm"><strong>Funciona em aparelhos IOS (iPhone) e em aparelhos Android</strong></span>
              </li>
            </ul>

            <div className="mb-4">
              <p className="text-muted-foreground text-sm">De: <span className="line-through">R$ 147,00</span> por apenas</p>
              <span className="text-4xl font-bold text-foreground">R$ 97,90</span>
              <p className="text-muted-foreground text-sm">(Pagamento Único)</p>
            </div>

            <Button 
              className="w-full bg-[#25D366] hover:bg-[#1da851] text-white font-bold rounded-full" 
              size="lg"
              onClick={handleSelectPlan}
            >
              QUERO GARANTIR MEU ACESSO AGORA
            </Button>
          </CardContent>
        </Card>

        <div className="text-center space-y-2 mt-8">
          {isAuthenticated ? (
            <Button variant="ghost" onClick={handleLogout}>
              Sair da conta
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Já é cliente?{" "}
              <button
                onClick={() => navigate("/auth")}
                className="text-primary hover:underline font-medium"
              >
                Faça login
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Planos;
