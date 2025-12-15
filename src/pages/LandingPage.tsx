import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  BarChart3, 
  Car, 
  Target, 
  Wrench, 
  TrendingUp, 
  CircleHelp, 
  DollarSign,
  CheckCircle2,
  Shield,
  Smartphone,
  Instagram,
  MessageCircle,
  ChevronDown
} from "lucide-react";
import logo from "@/assets/bateu-a-meta-logo.png";


const PRICE_IDS = {
  mensal: "price_1SdmK9K6aMDv1DOlgCL7bq41",
  anual: "price_1SdmJnK6aMDv1DOlafIvA9GC",
};

const LandingPage = () => {
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const scrollToPricing = () => {
    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSelectPlan = async (planType: "mensal" | "anual") => {
    setLoadingPlan(planType);

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: PRICE_IDS[planType] },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast.error("Erro ao processar. Tente novamente.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const features = [
    {
      icon: BarChart3,
      title: "Dashboard Intuitivo",
      description: "Visão instantânea do seu Lucro Líquido e desempenho por KM rodado."
    },
    {
      icon: Car,
      title: "Controle de Gastos",
      description: "Registro rápido e detalhado de abastecimentos, manutenções e despesas diversas."
    },
    {
      icon: Target,
      title: "Metas Dinâmicas",
      description: "Calcule automaticamente quanto você precisa rodar para bater sua meta diária/mensal de lucro."
    },
    {
      icon: Wrench,
      title: "Gestão de Manutenção",
      description: "Controle total de trocas de óleo, pneus e serviços para evitar surpresas no orçamento."
    },
    {
      icon: TrendingUp,
      title: "Relatórios Inteligentes",
      description: "Acompanhe a evolução do seu lucro e identifique onde você pode economizar."
    },
    {
      icon: Smartphone,
      title: "100% Mobile",
      description: "Instale no celular como um app e use mesmo sem internet. Funciona offline!"
    }
  ];

  const steps = [
    {
      number: "1",
      title: "Crie sua conta",
      description: "Faça o cadastro e comece seu período de avaliação gratuita."
    },
    {
      number: "2",
      title: "Registre seus Turnos",
      description: "Anote seus ganhos e despesas rapidamente, sem complicação."
    },
    {
      number: "3",
      title: "Acompanhe seu Lucro",
      description: "Dashboard atualizado em tempo real para bater a meta e ver seu dinheiro crescer!"
    }
  ];

  const faqs = [
    {
      question: "O aplicativo Bateu A Meta funciona no iPhone e no Android?",
      answer: "Sim! O Bateu A Meta é um PWA (Progressive Web App) moderno e totalmente otimizado para ambos os sistemas (iOS e Android). Você instala ele diretamente no seu celular ou desktop."
    },
    {
      question: "Por quanto tempo terei acesso ao Bateu A Meta?",
      answer: "Seu acesso é conforme o plano escolhido. Ao adquirir o Plano Anual, você terá acesso por um ano completo. O Plano Mensal é renovado a cada 30 dias."
    },
    {
      question: "Quais são as formas de pagamento aceitas?",
      answer: "Aceitamos as principais bandeiras de cartão de crédito (VISA, Mastercard) e também o pagamento instantâneo via Pix, através do nosso parceiro de pagamentos Stripe."
    },
    {
      question: "Como vou ter certeza de que a compra e o acesso foram aprovados?",
      answer: "Após a confirmação do pagamento, você receberá imediatamente um e-mail de boas-vindas com o seu login e a senha provisória para acessar o Dashboard."
    },
    {
      question: "Para quem o aplicativo Bateu A Meta é indicado?",
      answer: "Para todos os profissionais que trabalham com aplicativos de entrega ou transporte (Uber, 99, iFood, Loggi, etc.) e que precisam transformar corridas em lucro real."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header with Login Button */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Bateu a Meta" className="w-10 h-10 object-contain" />
            <span className="font-bold text-lg">Bateu a Meta</span>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate("/auth")}
            className="font-semibold"
          >
            Já sou Cliente
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 md:py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="flex flex-col items-center text-center space-y-6">
            <img 
              src={logo} 
              alt="Bateu a Meta" 
              className="w-24 h-24 md:w-32 md:h-32 object-contain"
            />
            
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight max-w-4xl">
              <span className="text-primary">Bateu A Meta:</span> Transforme Sua Gestão Financeira Pessoal em{" "}
              <span className="text-primary">Resultados Reais!</span>
            </h1>
            
            <h2 className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-2xl">
              Conquiste Seus Objetivos Financeiros Com O Poder Da Organização E Planejamento Inteligente.
            </h2>

            {/* VSL Video */}
            <div className="w-full max-w-3xl aspect-video rounded-xl overflow-hidden shadow-2xl border border-border bg-muted">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
                title="Bateu a Meta - Apresentação"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <Button 
              size="lg" 
              onClick={scrollToPricing}
              className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg hover:shadow-xl transition-all"
            >
              Assine Agora e Comece a Lucrar
              <ChevronDown className="ml-2 h-5 w-5 animate-bounce" />
            </Button>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 md:py-24 px-4 bg-muted/50">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-destructive/20">
                <CircleHelp className="h-12 w-12 text-destructive" />
              </div>
            </div>
            
            <h2 className="text-2xl md:text-4xl font-bold">
              Cansado de Rodar Sem Ver o Lucro?{" "}
              <span className="text-primary">Nós Entendemos Suas Dores.</span>
            </h2>

            <div className="grid md:grid-cols-3 gap-6 pt-8">
              <Card className="border-destructive/30 bg-destructive/5">
                <CardContent className="p-6 text-center space-y-3">
                  <DollarSign className="h-10 w-10 mx-auto text-destructive" />
                  <p className="text-lg font-medium">
                    Você realmente controla seus gastos com combustível e manutenção?
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-destructive/30 bg-destructive/5">
                <CardContent className="p-6 text-center space-y-3">
                  <Target className="h-10 w-10 mx-auto text-destructive" />
                  <p className="text-lg font-medium">
                    Sabe quanto precisa rodar para bater sua meta de lucro diária?
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-destructive/30 bg-destructive/5">
                <CardContent className="p-6 text-center space-y-3">
                  <BarChart3 className="h-10 w-10 mx-auto text-destructive" />
                  <p className="text-lg font-medium">
                    A fatura do cartão não deixa você saber o lucro real?
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Solution/Features Section */}
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-2xl md:text-4xl font-bold">
              A <span className="text-primary">Solução Completa</span> Para Suas Finanças
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Recursos desenvolvidos especialmente para motoristas de aplicativo
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:border-primary/50 transition-all hover:shadow-lg">
                <CardContent className="p-6 space-y-4">
                  <div className="p-3 rounded-xl bg-primary/10 w-fit group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 px-4 bg-muted/50">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-2xl md:text-4xl font-bold">
              <span className="text-primary">3 Passos Simples</span> Para Começar
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold shadow-lg">
                  {step.number}
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-primary/30" />
                )}
                <h3 className="text-xl font-bold">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-2xl md:text-4xl font-bold">
              Escolha Seu <span className="text-primary">Plano</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Invista no controle das suas finanças
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Annual Plan */}
            <Card className="relative border-2 border-primary shadow-xl scale-105">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold">
                  MAIS POPULAR
                </span>
              </div>
              <CardContent className="p-8 space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold">Plano Anual</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl md:text-5xl font-bold text-primary">R$ 97,90</span>
                    <span className="text-muted-foreground">/ano</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Equivale a R$ 8,16/mês</p>
                </div>

                <div className="p-4 rounded-lg bg-green-500/20 border border-green-500/30">
                  <p className="text-lg font-bold text-center">
                    🎉 Economia de R$ 56,90 por ano!
                  </p>
                </div>

                <ul className="space-y-3">
                  {["Dashboard completo", "Controle de turnos ilimitado", "Metas personalizadas", "Relatórios em PDF", "Gestão de manutenções", "Suporte prioritário"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className="w-full py-6 text-lg font-bold"
                  onClick={() => handleSelectPlan("anual")}
                  disabled={loadingPlan === "anual"}
                >
                  {loadingPlan === "anual" ? "Processando..." : "ASSINAR AGORA"}
                </Button>
              </CardContent>
            </Card>

            {/* Monthly Plan */}
            <Card className="border border-border">
              <CardContent className="p-8 space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold">Plano Mensal</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl md:text-5xl font-bold">R$ 12,90</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Flexibilidade total</p>
                </div>

                <ul className="space-y-3">
                  {["Dashboard completo", "Controle de turnos ilimitado", "Metas personalizadas", "Relatórios em PDF", "Gestão de manutenções", "Cancele quando quiser"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-muted-foreground shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  variant="outline"
                  className="w-full py-6 text-lg font-bold"
                  onClick={() => handleSelectPlan("mensal")}
                  disabled={loadingPlan === "mensal"}
                >
                  {loadingPlan === "mensal" ? "Processando..." : "ESCOLHER MENSAL"}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-medium">7 dias de Garantia de Satisfação ou Seu Dinheiro de Volta</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-2xl md:text-4xl font-bold">
              Perguntas <span className="text-primary">Frequentes</span>
            </h2>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-4">
                <AccordionTrigger className="text-left font-medium hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 md:py-24 px-4 bg-primary/10">
        <div className="container mx-auto max-w-4xl text-center space-y-8">
          <h2 className="text-2xl md:text-4xl font-bold">
            Pronto Para <span className="text-primary">Bater Sua Meta</span>?
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Junte-se a milhares de motoristas que já transformaram sua gestão financeira
          </p>

          <Button 
            size="lg" 
            onClick={scrollToPricing}
            className="text-lg px-8 py-6 font-bold shadow-lg"
          >
            COMEÇAR AGORA
          </Button>

          <div className="pt-4">
            <p className="text-sm text-muted-foreground mb-4">
              7 dias de Garantia de Satisfação ou Seu Dinheiro de Volta
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 pt-8 border-t border-border">
            <a 
              href="https://instagram.com/BateuAMeta" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <Instagram className="h-5 w-5" />
              @BateuAMeta
            </a>
            <a 
              href="https://wa.me/5512981796135" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
              (12) 98179-6135
            </a>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <span>Política de Privacidade</span>
            <span>•</span>
            <span>Termos de Uso</span>
            <span>•</span>
            <span>Política de Reembolso</span>
          </div>

          <p className="text-sm text-muted-foreground pt-4">
            © {new Date().getFullYear()} Bateu A Meta. Todos os direitos reservados.
          </p>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
