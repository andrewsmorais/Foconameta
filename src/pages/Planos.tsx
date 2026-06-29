import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logoImage from "@/assets/bateu-a-meta-logo.png";
import { Capacitor } from "@capacitor/core";
import { toast } from "sonner";

// Checkout URLs externos (Cakto) foram removidos em prol de StoreKit 100% nativo.

const features = [
  "Descubra qual é o seu Custo e o seu Lucro real em cada viagem",
  "Entenda de forma simples quanto é o seu Custo e o seu Lucro por cada KM que você roda",
  "Tenha total controle de quanto você lucra e de quanto você gasta por hora",
  "Defina uma meta para os seus ganhos e para os gastos",
  "Acompanhe o seu faturamento por hora e por KM",
  "Funciona em aparelhos IOS (iPhone) e em aparelhos Android",
];

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

    // StoreKit Initialization para iOS
    if (Capacitor.getPlatform() === 'ios') {
      const initStoreKit = () => {
        const store = (window as any).store;
        const CdvPurchase = (window as any).CdvPurchase;
        if (!store || !CdvPurchase) return;

        store.register([
          {
            id: 'com.meufaturamento.mensal',
            type: CdvPurchase.ProductType.PAID_SUBSCRIPTION,
            platform: CdvPurchase.Platform.APPLE_APPSTORE,
          },
          {
            id: 'com.meufaturamento.anual',
            type: CdvPurchase.ProductType.PAID_SUBSCRIPTION,
            platform: CdvPurchase.Platform.APPLE_APPSTORE,
          }
        ]);

        store.when().approved((transaction: any) => {
          transaction.verify();
        });

        store.when().verified((receipt: any) => {
          receipt.finish();
          toast.success("Assinatura confirmada pela Apple!");
          navigate("/dashboard");
        });

        store.initialize([CdvPurchase.Platform.APPLE_APPSTORE]);
      };
      
      // Delay pequeno para garantir que os plugins cordova foram carregados no window
      setTimeout(initStoreKit, 1000);
    }
  }, [navigate]);

  const handleSelectPlan = async (plan: 'mensal' | 'anual' = 'anual') => {
    // Integração Nativa App Store (Somente iOS)
    if (Capacitor.getPlatform() === 'ios') {
      const store = (window as any).store;
      const CdvPurchase = (window as any).CdvPurchase;
      if (!store || !CdvPurchase) {
        toast.error("O sistema de compras nativo ainda está carregando. Tente novamente em segundos.");
        return;
      }
      
      const productId = plan === 'mensal' ? 'com.meufaturamento.mensal' : 'com.meufaturamento.anual';
      const product = store.get(productId, CdvPurchase.Platform.APPLE_APPSTORE);
      
      if (!product) {
        toast.error("Produto não encontrado na App Store. Tente novamente mais tarde.");
        return;
      }

      toast.info("Processando pagamento pela App Store...");
      product.getOffer()?.order();
      return;
    }

    // Alerta de ambiente restrito ao iOS
    toast.error("Assinaturas Indisponíveis", {
      description: "As assinaturas só podem ser realizadas dentro do aplicativo Meu Faturamento App para iOS (iPhone)."
    });
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
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <img 
            src={logoImage} 
            alt="Meu Faturamento App" 
            className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover mx-auto mb-4"
          />
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Escolha seu Plano
          </h1>
          <p className="text-muted-foreground">
            Controle suas finanças como motorista de app
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plano Mensal */}
          <Card className="relative border-2 border-[hsl(217,90%,60%)] shadow-lg bg-black text-white">
            <CardHeader className="text-center pb-2 pt-6">
              <CardTitle className="text-2xl font-bold text-white">Plano Mensal</CardTitle>
              <CardDescription>Acesso completo mês a mês</CardDescription>
              <div className="flex items-baseline justify-center gap-1 pt-2">
                <span className="text-4xl font-bold text-white">R$ 19,90</span>
                <span className="text-gray-400 text-sm">/mês</span>
              </div>
            </CardHeader>
            <CardContent className="text-center">
              <ul className="space-y-3 mb-6 text-left">
                {features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-sm text-white">{f}</span>
                  </li>
                ))}
              </ul>

              <Button 
                className="w-full bg-[hsl(142,69%,49%)] hover:bg-[hsl(142,69%,40%)] text-white font-bold rounded-full animate-soft-pulse" 
                size="lg"
                onClick={() => handleSelectPlan('mensal')}
              >
                ASSINAR AGORA
              </Button>
            </CardContent>
          </Card>

          {/* Plano Anual */}
          <Card className="relative border-2 border-[hsl(217,90%,60%)] shadow-lg bg-black text-white">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-[hsl(142,69%,49%)] text-white px-4 py-1 font-bold">
                Melhor Custo-Benefício
              </Badge>
            </div>
            <CardHeader className="text-center pb-2 pt-6">
              <CardTitle className="text-2xl font-bold text-white">Plano Anual</CardTitle>
              <div className="flex items-center justify-center gap-2 pt-1">
                <span className="text-xl font-semibold text-red-500 line-through">de R$ 147</span>
                <span className="text-lg font-medium text-gray-300">por</span>
              </div>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-white">R$ 97,90</span>
                <span className="text-gray-400 text-sm">/ano</span>
              </div>
              <p className="text-sm text-gray-400">Equivale a R$ 8,16/mês</p>
            </CardHeader>
            <CardContent className="text-center">
              <div className="p-3 rounded-lg bg-green-500/20 border border-green-500/30 mb-4">
                <p className="text-base font-bold text-center text-green-400">
                  🎉 Economia de R$ 56,90 por ano!
                </p>
              </div>

              <ul className="space-y-3 mb-6 text-left">
                {features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-sm text-white">{f}</span>
                  </li>
                ))}
              </ul>

              <Button 
                className="w-full bg-[hsl(142,69%,49%)] hover:bg-[hsl(142,69%,40%)] text-white font-bold rounded-full animate-soft-pulse" 
                size="lg"
                onClick={() => handleSelectPlan('anual')}
              >
                COMEÇAR AGORA
              </Button>
            </CardContent>
          </Card>
        </div>

        {Capacitor.getPlatform() === 'ios' && (
          <div className="mt-8 text-center bg-gray-900/50 p-4 rounded-xl border border-gray-800">
            <Button variant="outline" className="w-full md:w-auto border-gray-600 hover:bg-gray-800" onClick={() => {
              const store = (window as any).store;
              if (store) {
                toast.info("Buscando compras anteriores na App Store...");
                store.restorePurchases();
              } else {
                toast.error("Sistema não inicializado.");
              }
            }}>
              Restaurar Compras Anteriores
            </Button>
            <p className="text-xs text-gray-500 mt-3 max-w-md mx-auto">
              Se você já é assinante e trocou de aparelho (ou desinstalou o app), 
              clique no botão acima para restaurar seu acesso na App Store sem pagar novamente.
            </p>
          </div>
        )}

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
