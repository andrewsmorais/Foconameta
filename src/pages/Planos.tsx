import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@/assets/bateu-a-meta-logo.png";

const PRICE_IDS = {
  mensal: "price_1ScddaK6aMDv1DOlB09lhJBF",
  anual: "price_1ScdelK6aMDv1DOlzvkwwZd9",
};

const Planos = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSelectPlan = async (planType: "mensal" | "anual") => {
    setLoading(planType);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Você precisa estar logado para assinar um plano",
        });
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: PRICE_IDS[planType] },
      });

      if (error) {
        console.error("Checkout error:", error);
        throw error;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("URL de checkout não retornada");
      }
    } catch (error: any) {
      console.error("Error creating checkout:", error);
      toast({
        variant: "destructive",
        title: "Erro ao processar pagamento",
        description: error.message || "Tente novamente mais tarde",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
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
            Selecione o plano ideal para controlar suas finanças como motorista
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Plano Mensal */}
          <Card className="relative border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-2 p-3 rounded-full bg-primary/10 w-fit">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Plano Mensal</CardTitle>
              <CardDescription>Flexibilidade para começar</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="mb-6">
                <span className="text-4xl font-bold text-foreground">R$ 12,90</span>
                <span className="text-muted-foreground">/mês</span>
              </div>

              <ul className="space-y-3 mb-6 text-left">
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>Controle completo de turnos</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>Dashboard financeiro</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>Relatórios detalhados</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>Gestão de manutenções</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>Metas personalizadas</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="font-medium">Suporte prioritário</span>
                </li>
              </ul>

              <Button 
                className="w-full" 
                size="lg"
                onClick={() => handleSelectPlan("mensal")}
                disabled={loading !== null}
              >
                {loading === "mensal" ? "Processando..." : "Assinar Mensal"}
              </Button>
            </CardContent>
          </Card>

          {/* Plano Anual */}
          <Card className="relative border-2 border-primary shadow-lg">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground px-4 py-1">
                Mais Popular
              </Badge>
            </div>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-2 p-3 rounded-full bg-primary/10 w-fit">
                <Crown className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Plano Anual</CardTitle>
              <CardDescription>Melhor custo-benefício</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="mb-2">
                <span className="text-4xl font-bold text-foreground">R$ 97,90</span>
                <span className="text-muted-foreground">/ano</span>
              </div>
              <div className="bg-green-500/20 border border-green-500 rounded-lg px-4 py-2 mb-4">
                <p className="text-lg text-green-500 font-bold">
                  🎉 Economia de R$ 56,90 por ano!
                </p>
              </div>

              <ul className="space-y-3 mb-6 text-left">
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>Controle completo de turnos</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>Dashboard financeiro</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>Relatórios detalhados</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>Gestão de manutenções</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>Metas personalizadas</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="font-medium">Suporte prioritário</span>
                </li>
              </ul>

              <Button 
                className="w-full" 
                size="lg"
                onClick={() => handleSelectPlan("anual")}
                disabled={loading !== null}
              >
                {loading === "anual" ? "Processando..." : "Assinar Anual"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button variant="ghost" onClick={handleLogout}>
            Sair da conta
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Planos;
