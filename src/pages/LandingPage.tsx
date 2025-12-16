import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
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
  Shield,
  Smartphone,
  Instagram,
  MessageCircle,
  ChevronDown,
  LayoutDashboard,
  Clock,
  FileText,
  Headphones,
  CalendarX,
  ShieldCheck
} from "lucide-react";
import logo from "@/assets/bateu-a-meta-logo.png";

// Testimonial images
import whatsapp1 from "@/assets/testimonials/whatsapp-1.jpeg";
import whatsapp2 from "@/assets/testimonials/whatsapp-2.jpeg";
import whatsapp3 from "@/assets/testimonials/whatsapp-3.jpeg";
import whatsapp4 from "@/assets/testimonials/whatsapp-4.jpeg";
import whatsapp5 from "@/assets/testimonials/whatsapp-5.jpeg";
import whatsapp6 from "@/assets/testimonials/whatsapp-6.jpeg";
import whatsapp7 from "@/assets/testimonials/whatsapp-7.jpeg";
import whatsapp8 from "@/assets/testimonials/whatsapp-8.jpeg";
import whatsapp9 from "@/assets/testimonials/whatsapp-9.jpeg";
import whatsapp10 from "@/assets/testimonials/whatsapp-10.jpeg";
import whatsapp11 from "@/assets/testimonials/whatsapp-11.jpeg";
import whatsapp12 from "@/assets/testimonials/whatsapp-12.jpeg";
import whatsapp13 from "@/assets/testimonials/whatsapp-13.jpeg";

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
    <div className="min-h-screen">
      {/* Header with Login Button */}
      <header className="sticky top-0 z-50 bg-[#fafafa] backdrop-blur border-b border-gray-200">
        <div className="container mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Bateu a Meta" className="w-10 h-10 object-contain" />
            <span className="font-bold text-lg text-black">Bateu a Meta</span>
          </div>
          <Button 
            onClick={() => navigate("/auth")}
            className="font-semibold bg-black text-white hover:bg-zinc-800"
          >
            Já sou Cliente
          </Button>
        </div>
      </header>

      {/* Hero Section - #fafafa */}
      <section className="relative overflow-hidden py-12 md:py-20 px-4 bg-[#fafafa]">
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="flex flex-col items-center text-center space-y-6">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight max-w-4xl text-black">
              <span className="text-brand-red">Bateu A Meta:</span> Transforme Sua Gestão Financeira Pessoal em{" "}
              <span className="text-brand-blue">Resultados Reais!</span>
            </h1>
            
            <h2 className="text-lg md:text-xl lg:text-2xl text-gray-600 max-w-2xl">
              Conquiste Seus Objetivos Financeiros Com O Poder Da Organização E Planejamento Inteligente.
            </h2>

            {/* VSL Video */}
            <div className="w-full max-w-3xl aspect-video rounded-xl overflow-hidden shadow-2xl border border-gray-200 bg-gray-100">
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
              className="text-lg px-8 py-6 bg-[#c41313] hover:bg-[#a91010] text-white font-bold shadow-lg hover:shadow-xl transition-all"
            >
              Assine Agora e Comece a Lucrar
              <ChevronDown className="ml-2 h-5 w-5 animate-bounce" />
            </Button>
          </div>
        </div>
      </section>

      {/* Problem Section - #000000 */}
      <section className="py-16 md:py-24 px-4 bg-black">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-white/10">
                <CircleHelp className="h-12 w-12 text-white" />
              </div>
            </div>
            
            <h2 className="text-2xl md:text-4xl font-bold text-white">
              Cansado de Rodar Sem Ver o <span className="text-[#3c83f6] animate-pulse">Lucro</span>? Nós Entendemos Suas <span className="text-[#c41313] animate-pulse">Dores</span>.
            </h2>

            <div className="grid md:grid-cols-3 gap-6 pt-8">
              <Card className="border-white/10 bg-white/5">
                <CardContent className="p-6 text-center space-y-3">
                  <DollarSign className="h-10 w-10 mx-auto text-[#c41313]" />
                  <p className="text-lg font-medium text-white">
                    Você realmente controla seus gastos com combustível e manutenção?
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-white/10 bg-white/5">
                <CardContent className="p-6 text-center space-y-3">
                  <Target className="h-10 w-10 mx-auto text-[#c41313]" />
                  <p className="text-lg font-medium text-white">
                    Sabe quanto precisa rodar para bater sua meta de lucro diária?
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-white/10 bg-white/5">
                <CardContent className="p-6 text-center space-y-3">
                  <BarChart3 className="h-10 w-10 mx-auto text-[#c41313]" />
                  <p className="text-lg font-medium text-white">
                    A fatura do cartão não deixa você saber o lucro real?
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Solution/Features Section - #f9f9fa */}
      <section className="py-16 md:py-24 px-4 bg-[#f9f9fa]">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-black">
              A <span className="text-gradient-brand">Solução Completa</span> Para Suas Finanças
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Recursos desenvolvidos especialmente para motoristas de aplicativo
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:border-[#3c83f6]/50 transition-all hover:shadow-lg bg-white border-gray-200">
                <CardContent className="p-6 space-y-4">
                  <div className="p-3 rounded-xl bg-[#3c83f6] w-fit group-hover:bg-[#2a6ad9] transition-colors shadow-md">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-black">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section - #000000 */}
      <section className="py-16 md:py-24 px-4 bg-black">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-white">
              <span className="text-[#c41313] animate-pulse">3 Passos Simples</span> Para <span className="text-[#3c83f6] animate-pulse">Começar</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-[#c41313] to-[#3c83f6] flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {step.number}
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-white/30" />
                )}
                <h3 className="text-xl font-bold text-white">{step.title}</h3>
                <p className="text-white/80">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section - #f9f9fa */}
      <section className="py-16 md:py-24 px-4 bg-[#f9f9fa]">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-xl md:text-3xl lg:text-4xl font-bold leading-tight max-w-4xl mx-auto text-black">
              <span className="text-brand-red">Veja Quem Já Bateu A Meta!</span> Motoristas que, agora, têm controle total e transformaram as corridas em <span className="text-brand-blue">lucro líquido real</span>.
            </h2>
          </div>

          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {[whatsapp1, whatsapp2, whatsapp3, whatsapp4, whatsapp5, whatsapp6, whatsapp7, whatsapp8, whatsapp9, whatsapp10, whatsapp11, whatsapp12, whatsapp13].map((img, index) => (
                <CarouselItem key={index} className="pl-2 md:pl-4 basis-4/5 sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                  <div className="p-1">
                    <Card className="overflow-hidden border-2 border-gray-200 hover:border-[#3c83f6]/50 transition-colors bg-white">
                      <CardContent className="p-0">
                        <img 
                          src={img} 
                          alt={`Depoimento de motorista ${index + 1}`}
                          className="w-full h-auto object-cover rounded-lg"
                        />
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-4 bg-white border-gray-300 text-black hover:bg-gray-100" />
            <CarouselNext className="hidden md:flex -right-4 bg-white border-gray-300 text-black hover:bg-gray-100" />
          </Carousel>
        </div>
      </section>

      {/* Pricing Section - #f9f9fa */}
      <section id="pricing" className="py-16 md:py-24 px-4 bg-[#f9f9fa]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-black">
              Escolha Seu <span className="text-brand-blue">Plano</span>
            </h2>
            <p className="text-gray-600 text-lg">
              Invista no controle das suas finanças
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Annual Plan */}
            <Card className="relative border-2 border-[#3c83f6] shadow-xl scale-105 bg-white">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-[#c41313] to-[#3c83f6] text-white px-4 py-1 rounded-full text-sm font-bold">
                  MAIS POPULAR
                </span>
              </div>
              <CardContent className="p-8 space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold text-black">Plano Anual</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl md:text-5xl font-bold text-[#3c83f6]">R$ 97,90</span>
                    <span className="text-gray-500">/ano</span>
                  </div>
                  <p className="text-sm text-gray-500">Equivale a R$ 8,16/mês</p>
                </div>

                <div className="p-4 rounded-lg bg-green-500/20 border border-green-500/30">
                  <p className="text-lg font-bold text-center text-green-700">
                    🎉 Economia de R$ 56,90 por ano!
                  </p>
                </div>

                <ul className="space-y-3">
                  {[
                    { icon: LayoutDashboard, text: "Dashboard", bold: "completo" },
                    { icon: Clock, text: "Controle de turnos", bold: "ilimitado" },
                    { icon: Target, text: "Metas", bold: "personalizadas" },
                    { icon: FileText, text: "Relatórios em", bold: "PDF" },
                    { icon: Wrench, text: "Gestão de", bold: "manutenções" },
                    { icon: Headphones, text: "Suporte", bold: "prioritário" }
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-black">
                      <div className="p-1.5 rounded-lg bg-green-500">
                        <item.icon className="h-5 w-5 text-white" />
                      </div>
                      <span>{item.text} <strong className="text-[#3c83f6]">{item.bold}</strong></span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className="w-full py-6 text-lg font-bold bg-[#c41313] hover:bg-[#a91010] text-white"
                  onClick={() => handleSelectPlan("anual")}
                  disabled={loadingPlan === "anual"}
                >
                  {loadingPlan === "anual" ? "Processando..." : "ASSINAR AGORA"}
                </Button>
              </CardContent>
            </Card>

            {/* Monthly Plan */}
            <Card className="border border-gray-200 bg-white">
              <CardContent className="p-8 space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold text-black">Plano Mensal</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl md:text-5xl font-bold text-black">R$ 12,90</span>
                    <span className="text-gray-500">/mês</span>
                  </div>
                  <p className="text-sm text-gray-500">Flexibilidade total</p>
                </div>

                <ul className="space-y-3">
                  {[
                    { icon: LayoutDashboard, text: "Dashboard", bold: "completo" },
                    { icon: Clock, text: "Controle de turnos", bold: "ilimitado" },
                    { icon: Target, text: "Metas", bold: "personalizadas" },
                    { icon: FileText, text: "Relatórios em", bold: "PDF" },
                    { icon: Wrench, text: "Gestão de", bold: "manutenções" },
                    { icon: CalendarX, text: "Cancele", bold: "quando quiser" }
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-black">
                      <div className="p-1.5 rounded-lg bg-green-500">
                        <item.icon className="h-5 w-5 text-white" />
                      </div>
                      <span>{item.text} <strong className="text-[#3c83f6]">{item.bold}</strong></span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className="w-full py-6 text-lg font-bold bg-[#3c83f6] hover:bg-[#2a6ad9] text-white"
                  onClick={() => handleSelectPlan("mensal")}
                  disabled={loadingPlan === "mensal"}
                >
                  {loadingPlan === "mensal" ? "Processando..." : "ESCOLHER MENSAL"}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-10">
            <div className="inline-flex items-center gap-3 px-6 py-4 md:px-8 md:py-5 rounded-2xl bg-[#22c55e]">
              <ShieldCheck className="h-8 w-8 md:h-10 md:w-10 text-white" />
              <span className="text-lg md:text-xl lg:text-2xl font-bold text-white">7 dias de Garantia de Satisfação ou Seu Dinheiro de Volta</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section - #f9f9fa */}
      <section className="py-16 md:py-24 px-4 bg-[#f9f9fa]">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-black">
              Perguntas <span className="text-brand-blue">Frequentes</span>
            </h2>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border border-gray-200 rounded-lg px-4 bg-white">
                <AccordionTrigger className="text-left font-medium hover:no-underline text-black">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Footer CTA - #000000 */}
      <section className="py-16 md:py-24 px-4 bg-black">
        <div className="container mx-auto max-w-4xl text-center space-y-8">
          <h2 className="text-2xl md:text-4xl font-bold text-white">
            Pronto Para <span className="text-[#c41313] animate-pulse">Bater Sua Meta</span>?
          </h2>
          
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            <span className="text-[#3c83f6] font-semibold animate-pulse">Junte-se</span> a milhares de motoristas que já <span className="text-[#c41313] font-semibold animate-pulse">transformaram</span> sua <span className="text-[#3c83f6] font-semibold animate-pulse">gestão financeira</span>
          </p>

          <Button 
            size="lg" 
            onClick={scrollToPricing}
            className="text-lg px-8 py-6 font-bold shadow-lg bg-gradient-to-r from-[#c41313] to-[#3c83f6] hover:opacity-90 text-white"
          >
            COMEÇAR AGORA
          </Button>

          <div className="pt-6">
            <div className="inline-flex items-center gap-3 px-6 py-4 md:px-8 md:py-5 rounded-2xl bg-[#22c55e]">
              <ShieldCheck className="h-7 w-7 md:h-9 md:w-9 text-white" />
              <span className="text-base md:text-lg lg:text-xl font-bold text-white">7 dias de Garantia de Satisfação ou Seu Dinheiro de Volta</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-6 pt-8 border-t border-white/20">
            <a 
              href="https://www.instagram.com/bateu_meta/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-white hover:text-[#3c83f6] transition-colors font-medium"
            >
              <Instagram className="h-5 w-5" />
              @bateu_meta
            </a>
            <a 
              href="https://wa.me/5512981796135" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-white hover:text-[#3c83f6] transition-colors font-medium"
            >
              <MessageCircle className="h-5 w-5" />
              (12) 98179-6135
            </a>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <a href="#" className="text-white/70 hover:text-white transition-colors">Política de Privacidade</a>
            <span className="text-white/40">•</span>
            <a href="#" className="text-white/70 hover:text-white transition-colors">Termos de Uso</a>
            <span className="text-white/40">•</span>
            <a href="#" className="text-white/70 hover:text-white transition-colors">Política de Reembolso</a>
          </div>

          <p className="text-sm text-white/60 pt-4">
            © {new Date().getFullYear()} Bateu A Meta. Todos os direitos reservados.
          </p>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
