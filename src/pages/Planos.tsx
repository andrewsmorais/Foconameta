import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, ArrowLeft, Loader2 } from "lucide-react";
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
  const [loadingPlan, setLoadingPlan] = useState<'mensal' | 'anual' | null>(null);
  const [isStoreReady, setIsStoreReady] = useState(false);
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
            group: '22195342'
          },
          {
            id: 'com.meufaturamento.anual',
            type: CdvPurchase.ProductType.PAID_SUBSCRIPTION,
            platform: CdvPurchase.Platform.APPLE_APPSTORE,
            group: '22195342'
          }
        ]);

        store.when().approved((transaction: any) => {
          transaction.verify();
        });

        store.when().verified(async (receipt: any) => {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            // 1. Ler o ID direto da Apple
            const productId = receipt.id;
            const isMensal = productId === 'com.meufaturamento.mensal';
            const planName = isMensal ? 'Mensal' : 'Anual';
            
            const { data: planData } = await supabase
              .from('plans')
              .select('id')
              .ilike('name', `%${planName}%`)
              .maybeSingle();

            if (planData) {
              const { data: existingSub } = await supabase
                .from('subscriptions')
                .select('id')
                .eq('user_id', session.user.id)
                .eq('status', 'active')
                .maybeSingle();

              const expirationDate = new Date();
              expirationDate.setDate(expirationDate.getDate() + (isMensal ? 30 : 365));

              let dbError = null;

              if (existingSub) {
                const { error } = await supabase.from('subscriptions').update({
                  plan_id: planData.id,
                  expires_at: expirationDate.toISOString()
                }).eq('id', existingSub.id);
                dbError = error;
              } else {
                const { error } = await supabase.from('subscriptions').insert({
                  user_id: session.user.id,
                  plan_id: planData.id,
                  status: 'active',
                  started_at: new Date().toISOString(),
                  expires_at: expirationDate.toISOString()
                });
                dbError = error;
              }

              // 2. Finaliza recibo somente se DB atualizou
              if (!dbError) {
                receipt.finish();
                toast.success("Assinatura sincronizada com sucesso!");
                navigate("/dashboard");
              } else {
                console.error("Erro do DB:", dbError);
                toast.error("Erro ao sincronizar. Verifique a internet e tente 'Restaurar Compras'.");
              }
            }
          } catch (error) {
            console.error("Erro geral no verified:", error);
            toast.error("Ocorreu um erro. Tente restaurar suas compras.");
          }
        });

        store.when().ready(() => {
          console.log("StoreKit is ready!");
          setIsStoreReady(true);
        });

        store.when().cancelled((transaction: any) => {
          console.log("Compra cancelada:", transaction);
          setLoadingPlan(null);
          toast.info("Compra cancelada pelo usuário.");
        });
        
        store.when().updated(() => {
          console.log("StoreKit produtos atualizados");
        });

        store.error((err: any) => {
          console.error("Erro StoreKit:", err);
          setLoadingPlan(null);
          alert("Erro StoreKit: " + (err.message || JSON.stringify(err)));
        });

        store.initialize([CdvPurchase.Platform.APPLE_APPSTORE]).then(() => {
          console.log("Store initialization finished, calling update...");
          store.update();
        }).catch((err: any) => {
          console.error("Erro fatal ao inicializar StoreKit:", err);
          alert("Erro crítico na loja da Apple: " + (err?.message || "Desconhecido"));
        });
      };
      
      // Delay pequeno para garantir que os plugins cordova foram carregados no window
      const timer = setTimeout(() => {
        const storeObj = (window as any).store;
        if (!storeObj) {
          console.error("Plugin StoreKit não encontrado no objeto window!");
          alert("O sistema de pagamentos da Apple não foi carregado corretamente. Entre em contato com o suporte.");
          setIsStoreReady(false); // Mantém falso, mas o usuário saberá o motivo
          return;
        }
        initStoreKit();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [navigate]);

  const handleSelectPlan = async (plan: 'mensal' | 'anual' = 'anual') => {
    // Integração Nativa App Store (Somente iOS)
    if (Capacitor.getPlatform() === 'ios') {
      const store = (window as any).store;
      const CdvPurchase = (window as any).CdvPurchase;
      
      setLoadingPlan(plan);
      
      const productId = plan === 'mensal' ? 'com.meufaturamento.mensal' : 'com.meufaturamento.anual';
      const product = store.get(productId, CdvPurchase.Platform.APPLE_APPSTORE);
      
      if (!product) {
        toast.error("Produto não encontrado na App Store. Tente novamente mais tarde.");
        setLoadingPlan(null);
        return;
      }

      try {
        sessionStorage.setItem('storekit_selected_plan', plan);
        
        if (!product.canPurchase) {
           toast.error("Este produto não está disponível para compra no momento. Verifique sua conexão ou tente mais tarde.");
           setLoadingPlan(null);
           return;
        }

        toast.info("Processando pagamento pela App Store...");
        const offer = product.getOffer();
        if (offer) {
          offer.order();
        } else {
          toast.error("Oferta não disponível para este produto. Tente novamente mais tarde.");
          setLoadingPlan(null);
        }
      } catch (error) {
        console.error("Erro StoreKit:", error);
        toast.error("Erro ao processar a compra na App Store.");
        setLoadingPlan(null);
      }
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
    <div className="min-h-screen bg-background p-4 md:p-8 relative">
      <div style={{ paddingTop: 'env(safe-area-inset-top, 24px)' }} className="absolute left-4 md:left-8 z-10 top-4">
        <Button 
          variant="ghost" 
          className="text-muted-foreground hover:text-foreground"
          onClick={() => {
            supabase.auth.signOut();
            navigate("/auth");
          }}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para o Login
        </Button>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8 pt-14">
          <img 
            src={logoImage} 
            alt="Meu Faturamento App" 
            className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover mx-auto mb-4 shadow-md"
          />
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Escolha seu Plano
          </h1>
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
                className="w-full bg-[hsl(142,69%,49%)] hover:bg-[hsl(142,69%,40%)] text-white font-bold rounded-full animate-soft-pulse flex items-center justify-center gap-2" 
                size="lg"
                onClick={() => handleSelectPlan('mensal')}
                disabled={loadingPlan === 'mensal' || (!isStoreReady && Capacitor.getPlatform() === 'ios')}
              >
                {(!isStoreReady && Capacitor.getPlatform() === 'ios') ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Conectando Store...
                  </>
                ) : loadingPlan === 'mensal' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "COMEÇAR AGORA"
                )}
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
                className="w-full bg-[hsl(142,69%,49%)] hover:bg-[hsl(142,69%,40%)] text-white font-bold rounded-full animate-soft-pulse flex items-center justify-center gap-2" 
                size="lg"
                onClick={() => handleSelectPlan('anual')}
                disabled={loadingPlan === 'anual' || (!isStoreReady && Capacitor.getPlatform() === 'ios')}
              >
                {(!isStoreReady && Capacitor.getPlatform() === 'ios') ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Conectando Store...
                  </>
                ) : loadingPlan === 'anual' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "COMEÇAR AGORA"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center space-y-2 mt-12 flex flex-col items-center gap-4">
          {isAuthenticated ? (
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 text-sm">
              <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground font-medium">
                Sair da conta
              </button>
              
              {Capacitor.getPlatform() === 'ios' && (
                <button 
                  onClick={() => {
                    const store = (window as any).store;
                    if (store) {
                      toast.info("Buscando compras anteriores na App Store...");
                      store.restorePurchases();
                    }
                  }}
                  className="text-muted-foreground hover:text-foreground font-medium"
                >
                  Restaurar Compras
                </button>
              )}
            </div>
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
        
        {/* Links Legais Obrigatórios (Apple App Store Guideline) */}
        <div className="mt-12 text-center text-xs text-muted-foreground flex flex-col md:flex-row items-center justify-center gap-4">
          <a href="#" target="_blank" rel="noopener noreferrer" className="hover:underline">
            Termos de Uso (EULA)
          </a>
          <span className="hidden md:inline">•</span>
          <a href="#" target="_blank" rel="noopener noreferrer" className="hover:underline">
            Política de Privacidade
          </a>
        </div>
      </div>
    </div>
  );
};

export default Planos;
