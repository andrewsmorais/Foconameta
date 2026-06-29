import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useFacebookPixel } from "@/hooks/useFacebookPixel";
import { useGoogleAds } from "@/hooks/useGoogleAds";
import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";
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
  ShieldCheck,
  Play,
  X,
  Expand,
  ChevronLeft,
  ChevronRight,
  Check,
  Calculator
} from "lucide-react";
import logo from "@/assets/bateu-a-meta-logo.png";
import platformLogos from "@/assets/platform-logos.png";

// App demo images
import turnoForm1 from "@/assets/app-demo/turno-form-1.png";
import turnoForm2 from "@/assets/app-demo/turno-form-2.png";
import turnoMetricas from "@/assets/app-demo/turno-metricas.png";

// Feature demo images
import featureDashboard from "@/assets/app-demo/feature-dashboard.png";
import featureMetas from "@/assets/app-demo/feature-metas.png";
import featureGanhos from "@/assets/app-demo/feature-ganhos.png";
import featureRelatorios from "@/assets/app-demo/feature-relatorios.png";

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

// Driver testimonial images
import motoristaCareca from "@/assets/testimonials/motorista-careca.png";
import motoristaSenhor from "@/assets/testimonials/motorista-senhor.png";
import motoristaCacheado from "@/assets/testimonials/motorista-cacheado.png";

// Founder image
import fundadorImg from "@/assets/andrews-morais.jpeg";

// Checkout URLs externos (Cakto) foram removidos em prol de StoreKit 100% nativo.

// Slides data for carousel
const carouselSlides = [
  { img: turnoForm1, caption: "1. Registre seu turno" },
  { img: turnoForm2, caption: "2. Adicione seus ganhos" },
  { img: turnoMetricas, caption: "3. Veja seu lucro real" }
];

// Resources/Features slides
const resourcesSlides = [
  { img: featureDashboard, caption: "Dashboard - Sua visão completa" },
  { img: featureMetas, caption: "Metas - Defina seus objetivos" },
  { img: featureGanhos, caption: "Ganhos & Despesas - Controle total" },
  { img: featureRelatorios, caption: "Relatórios - Exporte seus dados" }
];

// Driver testimonials slides
const testimonialSlides = [
  {
    img: motoristaSenhor,
    name: "Carlos",
    testimonial: "Eu mesmo ja sendo de idade consegui apreder a usar o aplicativo algo que eu tive dificuldades de enteder em outros"
  },
  {
    img: motoristaCareca,
    name: "Ricardo",
    testimonial: "Confesso que de início achei que era golpe, mas depois de ver o anúncio várias vezes no Instagram, resolvi arriscar. Que alívio quando o e-mail com o acesso chegou na mesma hora! Depois de já ter caído em umas ciladas na internet, foi uma surpresa muito boa ver que esse é real."
  },
  {
    img: motoristaCacheado,
    name: "Felipe",
    testimonial: "Minha organização no caderno era baseada na base da sorte: sorte de eu lembrar de levar e sorte de eu lembrar de anotar. Spoiler: quase nunca dava certo! kkk. Agora com o aplicativo no celular facilitou demais. Já que o motorista hoje em dia só não esquece a cabeça porque está grudada, ter tudo no celular tirou um peso enorme das minhas costas"
  }
];

// Function to highlight keywords in testimonials
const highlightKeywords = (text: string) => {
  const keywords = ['golpe', 'real', 'organização', 'celular', 'aplicativo'];
  let result = text;
  keywords.forEach(keyword => {
    const regex = new RegExp(`(${keyword})`, 'gi');
    result = result.replace(regex, '<span class="text-[#25D366] font-bold">$1</span>');
  });
  return result;
};

const LandingPage = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  
  // Carousel API for dynamic dots
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Lightbox state
  const [selectedImage, setSelectedImage] = useState<{ img: string; caption: string; index: number } | null>(null);
  
  // Resources carousel state
  const [resourcesCarouselApi, setResourcesCarouselApi] = useState<CarouselApi>();
  const [resourcesCurrentSlide, setResourcesCurrentSlide] = useState(0);
  const [selectedResourceImage, setSelectedResourceImage] = useState<{ img: string; caption: string; index: number } | null>(null);
  
  // Driver testimonials carousel state
  const [testimonialCarouselApi, setTestimonialCarouselApi] = useState<CarouselApi>();
  const [testimonialCurrentSlide, setTestimonialCurrentSlide] = useState(0);
  
  // Facebook Pixel - inicializa e dispara PageView automaticamente
  const { trackLead, trackInitiateCheckout, trackViewContent, trackContact } = useFacebookPixel();
  
  // Google Ads - inicializa e dispara PageView automaticamente
  useGoogleAds();
  
  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));

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
                navigate("/auth");
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

        store.initialize([CdvPurchase.Platform.APPLE_APPSTORE]);
      };
      
      setTimeout(initStoreKit, 1000);
    }
  }, [navigate]);

  // Update current slide when carousel changes
  useEffect(() => {
    if (!carouselApi) return;

    const onSelect = () => {
      setCurrentSlide(carouselApi.selectedScrollSnap());
    };

    carouselApi.on("select", onSelect);
    onSelect(); // Set initial state

    return () => {
      carouselApi.off("select", onSelect);
    };
  }, [carouselApi]);

  // Update resources carousel current slide
  useEffect(() => {
    if (!resourcesCarouselApi) return;

    const onSelect = () => {
      setResourcesCurrentSlide(resourcesCarouselApi.selectedScrollSnap());
    };

    resourcesCarouselApi.on("select", onSelect);
    onSelect();

    return () => {
      resourcesCarouselApi.off("select", onSelect);
    };
  }, [resourcesCarouselApi]);

  // Update driver testimonials carousel current slide
  useEffect(() => {
    if (!testimonialCarouselApi) return;

    const onSelect = () => {
      setTestimonialCurrentSlide(testimonialCarouselApi.selectedScrollSnap());
    };

    testimonialCarouselApi.on("select", onSelect);
    onSelect();

    return () => {
      testimonialCarouselApi.off("select", onSelect);
    };
  }, [testimonialCarouselApi]);

  // Auto-play for driver testimonials carousel (5 seconds)
  useEffect(() => {
    if (!testimonialCarouselApi) return;

    const interval = setInterval(() => {
      testimonialCarouselApi.scrollNext();
    }, 6000);

    return () => clearInterval(interval);
  }, [testimonialCarouselApi]);

  const navigateLightbox = useCallback((direction: 'prev' | 'next') => {
    if (!selectedImage) return;
    const newIndex = direction === 'next' 
      ? (selectedImage.index + 1) % carouselSlides.length
      : (selectedImage.index - 1 + carouselSlides.length) % carouselSlides.length;
    setSelectedImage({ ...carouselSlides[newIndex], index: newIndex });
  }, [selectedImage]);

  // Navigate resources lightbox
  const navigateResourcesLightbox = useCallback((direction: 'prev' | 'next') => {
    if (!selectedResourceImage) return;
    const newIndex = direction === 'next' 
      ? (selectedResourceImage.index + 1) % resourcesSlides.length
      : (selectedResourceImage.index - 1 + resourcesSlides.length) % resourcesSlides.length;
    setSelectedResourceImage({ ...resourcesSlides[newIndex], index: newIndex });
  }, [selectedResourceImage]);

  // Scroll para preços + dispara evento Lead
  const scrollToPricing = () => {
    trackLead('Ver Planos - CTA Hero');
    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
  };

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

      try {
        sessionStorage.setItem('storekit_selected_plan', plan);
        toast.info("Processando pagamento pela App Store...");
        const offer = product.getOffer();
        if (offer) {
          offer.order();
        } else {
          toast.error("Oferta não disponível para este produto. Tente novamente mais tarde.");
        }
      } catch (error) {
        console.error("Erro StoreKit:", error);
        toast.error("Erro ao processar a compra na App Store.");
      }
      return;
    }

    // Alerta de ambiente restrito ao iOS
    toast.error("Assinaturas Indisponíveis", {
      description: "As assinaturas só podem ser realizadas dentro do aplicativo Meu Faturamento App para iOS (iPhone)."
    });
  };

  // Rastreia cliques em contato (WhatsApp/Instagram)
  const handleContactClick = (method: string) => {
    trackContact(method);
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
      title: "Escolha seu Plano",
      description: "Selecione o plano ideal para você e realize o pagamento de forma rápida e segura."
    },
    {
      number: "2",
      title: "Receba suas Credenciais",
      description: "Confira seu e-mail e receba seu login e senha de acesso ao aplicativo."
    },
    {
      number: "3",
      title: "Acesse e Baixe o App",
      description: "Entre na área 'Já sou Cliente', faça login e instale o aplicativo no seu Iphone (IOS), Android, tablet ou computador."
    }
  ];

  const faqs = [
    {
      question: "O aplicativo Meu Faturamento App funciona no iPhone e no Android?",
      answer: "Sim! O Meu Faturamento App é um PWA (Progressive Web App) moderno e totalmente otimizado para ambos os sistemas (iOS e Android). Você instala ele diretamente no seu celular ou desktop."
    },
    {
      question: "Por quanto tempo terei acesso ao Meu Faturamento App?",
      answer: "Ao adquirir o plano, você terá acesso por um ano completo. Após esse período, basta renovar para continuar usando."
    },
    {
      question: "Quais são as formas de pagamento aceitas?",
      answer: "Aceitamos as principais bandeiras de cartão de crédito (VISA, Mastercard) e também o pagamento instantâneo via Pix, através do Mercado Pago."
    },
    {
      question: "Como vou ter certeza de que a compra e o acesso foram aprovados?",
      answer: "Após a confirmação do pagamento, você receberá imediatamente um e-mail de boas-vindas com o seu login e a senha provisória para acessar o Dashboard."
    },
    {
      question: "Para quem o aplicativo Meu Faturamento App é indicado?",
      answer: "Para todos os profissionais que trabalham com aplicativos de entrega ou transporte (Uber, 99, iFood, Loggi, etc.) e que precisam transformar corridas em lucro real."
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Header with Login Button */}
      <header className="sticky top-0 z-50 bg-[#fafafa] backdrop-blur border-b border-gray-200">
        <div className="container mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Meu Faturamento App" className="w-10 h-10 object-contain" />
            <span className="font-bold text-lg text-black">Meu Faturamento App</span>
          </div>
          <Button 
            onClick={() => navigate("/auth")}
            className="font-semibold bg-black text-white hover:bg-zinc-800"
          >
            Já sou Cliente
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-4 md:py-20 bg-[#fafafa]">
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="flex flex-col items-center text-center space-y-3 md:space-y-6 px-2 md:px-4">
            <h1 className="text-2xl md:text-5xl lg:text-6xl font-bold leading-tight max-w-4xl text-center text-brand-blue">
              Meu Faturamento App
            </h1>
            <p className="text-lg md:text-2xl lg:text-3xl font-bold max-w-3xl text-center text-brand-red mt-4 md:mt-6">
              Aposente o caderninho e as planilhas complicadas!
            </p>
            <p className="text-base md:text-xl lg:text-2xl font-medium leading-relaxed max-w-3xl text-center text-black mt-2 md:mt-4">
              Domine seus Ganhos e Despesas por Hora e por KM rodado com um clique.
            </p>

            {/* VSL Video - Thumbnail clicável que abre modal */}
            <div className="w-full max-w-xs md:max-w-4xl mx-auto px-0 sm:px-4 mt-10 md:mt-16">
              <button
                onClick={() => {
                  trackViewContent('VSL Video', 'Video');
                  setVideoOpen(true);
                }}
                className="relative w-full aspect-[9/16] md:aspect-video rounded-xl overflow-hidden shadow-2xl ring-2 ring-[#3c83f6]/40 group cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#3c83f6]/60"
              >
                {/* Thumbnail do YouTube */}
                <img
                  src="https://img.youtube.com/vi/OZ4nlZDXYUE/maxresdefault.jpg"
                  alt="Assistir vídeo - Meu Faturamento App"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {/* Overlay escuro */}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
                {/* Botão de Play */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 md:w-24 md:h-24 bg-[#c41313] rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                    <Play className="w-7 h-7 md:w-12 md:h-12 text-white ml-1" fill="white" />
                  </div>
                </div>
                {/* Texto indicativo */}
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <span className="bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium">
                    Clique para assistir
                  </span>
                </div>
              </button>
            </div>

            {/* Modal do Vídeo */}
            <Dialog open={videoOpen} onOpenChange={setVideoOpen}>
              <DialogContent className="max-w-[80vw] md:max-w-[90vw] lg:max-w-[85vw] w-full p-0 bg-black border-none">
                <button
                  onClick={() => setVideoOpen(false)}
                  className="absolute top-3 right-3 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
                <div className="relative w-full aspect-[9/16] md:aspect-video">
                  <iframe
                    className="w-full h-full"
                    src="https://www.youtube.com/embed/OZ4nlZDXYUE?rel=0&modestbranding=1&autoplay=1"
                    title="Meu Faturamento App - VSL"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              </DialogContent>
              </Dialog>

              {/* Card de Preço abaixo do VSL */}
              <div className="w-full max-w-full md:max-w-3xl mx-auto mt-14 md:mt-20 px-0 md:px-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {/* Monthly Plan */}
                  <Card className="relative border-2 border-[#3c83f6] shadow-xl bg-black w-full">
                    <CardContent className="p-5 md:p-8 space-y-4 md:space-y-6 pt-8">
                      <div className="text-center space-y-1 md:space-y-2">
                        <h3 className="text-2xl font-bold text-white">Plano Mensal</h3>
                        <p className="text-sm text-gray-400">Acesso completo mês a mês</p>
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-3xl md:text-5xl font-bold text-[#3c83f6]">R$ 19,90</span>
                          <span className="text-gray-400 text-sm md:text-base">/mês</span>
                        </div>
                      </div>

                      <ul className="text-left space-y-2 md:space-y-3">
                        <li className="flex items-start gap-2 md:gap-3">
                          <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-3 h-3 md:w-4 md:h-4 text-white" />
                          </div>
                          <span className="text-white text-sm md:text-base">Descubra qual é o seu Custo e o seu Lucro real em cada viagem</span>
                        </li>
                        <li className="flex items-start gap-2 md:gap-3">
                          <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-3 h-3 md:w-4 md:h-4 text-white" />
                          </div>
                          <span className="text-white text-sm md:text-base">Entenda de forma simples quanto é o seu Custo e o seu Lucro por cada KM que você roda</span>
                        </li>
                        <li className="flex items-start gap-2 md:gap-3">
                          <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-3 h-3 md:w-4 md:h-4 text-white" />
                          </div>
                          <span className="text-white text-sm md:text-base">Tenha total controle de quanto você lucra e de quanto você gasta por hora</span>
                        </li>
                        <li className="flex items-start gap-2 md:gap-3">
                          <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-3 h-3 md:w-4 md:h-4 text-white" />
                          </div>
                          <span className="text-white text-sm md:text-base">Defina uma meta para os seus ganhos e para os gastos</span>
                        </li>
                        <li className="flex items-start gap-2 md:gap-3">
                          <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-3 h-3 md:w-4 md:h-4 text-white" />
                          </div>
                          <span className="text-white text-sm md:text-base">Acompanhe o seu faturamento por hora e por KM</span>
                        </li>
                        <li className="flex items-start gap-2 md:gap-3">
                          <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-3 h-3 md:w-4 md:h-4 text-white" />
                          </div>
                          <span className="text-white text-sm md:text-base">Funciona em aparelhos IOS (iPhone) e em aparelhos Android</span>
                        </li>
                      </ul>

                      <Button
                        className="w-full py-4 md:py-6 text-sm md:text-lg font-bold bg-[#25D366] hover:bg-[#1da851] text-white rounded-lg animate-soft-pulse"
                        onClick={() => handleSelectPlan('mensal')}
                      >
                        ASSINAR AGORA
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Annual Plan */}
                  <Card className="relative border-2 border-[#3c83f6] shadow-xl bg-black w-full">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <span className="bg-[#25D366] text-white px-4 py-1 rounded-full text-xs md:text-sm font-bold whitespace-nowrap">Melhor Custo-Benefício</span>
                    </div>
                    <CardContent className="p-5 md:p-8 space-y-4 md:space-y-6 pt-8">
                      <div className="text-center space-y-1 md:space-y-2">
                        <h3 className="text-2xl font-bold text-white">Plano Anual</h3>
                        <div className="flex items-center justify-center gap-2 md:gap-3">
                          <span className="text-2xl md:text-3xl font-semibold text-red-500 line-through">de R$ 147</span>
                          <span className="text-lg md:text-2xl font-medium text-gray-300">por</span>
                        </div>
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-3xl md:text-5xl font-bold text-[#3c83f6]">R$ 97,90</span>
                          <span className="text-gray-400 text-sm md:text-base">/ano</span>
                        </div>
                        <p className="text-sm text-gray-400">Equivale a R$ 8,16/mês</p>
                      </div>

                      <div className="p-3 md:p-4 rounded-lg bg-green-500/20 border border-green-500/30">
                        <p className="text-base md:text-lg font-bold text-center text-green-400">
                          🎉 Economia de R$ 56,90 por ano!
                        </p>
                      </div>

                      <ul className="text-left space-y-2 md:space-y-3">
                        <li className="flex items-start gap-2 md:gap-3">
                          <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-3 h-3 md:w-4 md:h-4 text-white" />
                          </div>
                          <span className="text-white text-sm md:text-base">Descubra qual é o seu Custo e o seu Lucro real em cada viagem</span>
                        </li>
                        <li className="flex items-start gap-2 md:gap-3">
                          <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-3 h-3 md:w-4 md:h-4 text-white" />
                          </div>
                          <span className="text-white text-sm md:text-base">Entenda de forma simples quanto é o seu Custo e o seu Lucro por cada KM que você roda</span>
                        </li>
                        <li className="flex items-start gap-2 md:gap-3">
                          <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-3 h-3 md:w-4 md:h-4 text-white" />
                          </div>
                          <span className="text-white text-sm md:text-base">Tenha total controle de quanto você lucra e de quanto você gasta por hora</span>
                        </li>
                        <li className="flex items-start gap-2 md:gap-3">
                          <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-3 h-3 md:w-4 md:h-4 text-white" />
                          </div>
                          <span className="text-white text-sm md:text-base">Defina uma meta para os seus ganhos e para os gastos</span>
                        </li>
                        <li className="flex items-start gap-2 md:gap-3">
                          <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-3 h-3 md:w-4 md:h-4 text-white" />
                          </div>
                          <span className="text-white text-sm md:text-base">Acompanhe o seu faturamento por hora e por KM</span>
                        </li>
                        <li className="flex items-start gap-2 md:gap-3">
                          <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-3 h-3 md:w-4 md:h-4 text-white" />
                          </div>
                          <span className="text-white text-sm md:text-base">Funciona em aparelhos IOS (iPhone) e em aparelhos Android</span>
                        </li>
                      </ul>

                      <Button
                        className="w-full py-4 md:py-6 text-sm md:text-lg font-bold bg-[#25D366] hover:bg-[#1da851] text-white rounded-lg animate-soft-pulse"
                        onClick={() => handleSelectPlan('anual')}
                      >
                        COMEÇAR AGORA
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
          </div>
        </div>
      </section>

      {/* Vantagens e Diferenciais Section */}
      <section className="py-10 md:py-24 bg-[#1a1a1a]">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12">
            <span className="text-[#3c83f6]">Muito mais que um app, sua central de comando</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Card 1 - Domínio Financeiro */}
            <div className="bg-gradient-to-br from-[#15a249]/10 to-transparent border border-[#15a249]/30 rounded-xl p-5 md:p-6">
              <div className="flex flex-col items-center md:items-start md:flex-row gap-3 md:gap-4">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-[#15a249]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-6 h-6 md:w-7 md:h-7 text-[#15a249]" />
                </div>
                <div className="text-center md:text-left">
                  <h3 className="text-lg md:text-xl font-bold text-white mb-2">Domínio Financeiro Total</h3>
                  <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                    Registre <span className="text-[#3c83f6] font-medium">Ganhos Brutos</span>, <span className="text-[#3c83f6] font-medium">custos de combustível</span>, <span className="text-[#3c83f6] font-medium">KM rodado</span> e muito mais. Tenha clareza sobre cada centavo que entra e sai.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2 - Manutenções */}
            <div className="bg-gradient-to-br from-[#15a249]/10 to-transparent border border-[#15a249]/30 rounded-xl p-5 md:p-6">
              <div className="flex flex-col items-center md:items-start md:flex-row gap-3 md:gap-4">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-[#15a249]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Wrench className="w-6 h-6 md:w-7 md:h-7 text-[#15a249]" />
                </div>
                <div className="text-center md:text-left">
                  <h3 className="text-lg md:text-xl font-bold text-white mb-2">Menu Manutenções</h3>
                  <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                    Registre <span className="text-[#3c83f6] font-medium">peças trocadas</span>, <span className="text-[#3c83f6] font-medium">nome da oficina</span>, KM atual e próximo para troca. Nunca mais esqueça uma revisão importante.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3 - Gestão Prática */}
            <div className="bg-gradient-to-br from-[#15a249]/10 to-transparent border border-[#15a249]/30 rounded-xl p-5 md:p-6">
              <div className="flex flex-col items-center md:items-start md:flex-row gap-3 md:gap-4">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-[#15a249]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calculator className="w-6 h-6 md:w-7 md:h-7 text-[#15a249]" />
                </div>
                <div className="text-center md:text-left">
                  <h3 className="text-lg md:text-xl font-bold text-white mb-2">Gestão Prática</h3>
                  <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                    Menos tempo perdido com planilhas. Com <span className="text-[#3c83f6] font-medium">cálculos automáticos</span> e <span className="text-[#3c83f6] font-medium">relatórios semanais/mensais</span>, você sabe exatamente o <span className="text-[#3c83f6] font-medium">resultado no final do mês</span>.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 4 - Metas */}
            <div className="bg-gradient-to-br from-[#15a249]/10 to-transparent border border-[#15a249]/30 rounded-xl p-5 md:p-6">
              <div className="flex flex-col items-center md:items-start md:flex-row gap-3 md:gap-4">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-[#15a249]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6 md:w-7 md:h-7 text-[#15a249]" />
                </div>
                <div className="text-center md:text-left">
                  <h3 className="text-lg md:text-xl font-bold text-white mb-2">Estratégia de Metas</h3>
                  <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                    Defina <span className="text-[#3c83f6] font-medium">metas diárias</span>, <span className="text-[#3c83f6] font-medium">semanais</span> e <span className="text-[#3c83f6] font-medium">mensais</span>. Acompanhe seu progresso e saiba exatamente quanto falta para bater a meta.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Compatibilidade */}
          <div className="mt-8 md:mt-10 text-center">
            <p className="text-gray-300 text-sm md:text-base mb-4 md:mb-4">
              <span className="text-[#fbbf24] font-semibold">Compatível</span> com todas as plataformas:
            </p>
            <div className="flex flex-wrap justify-center gap-2 md:gap-3">
              {/* 99 - Yellow background */}
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[#FFDE00] flex items-center justify-center">
                <span className="text-black font-black text-sm md:text-base">99</span>
              </div>
              
              {/* Uber - Black background */}
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-black flex items-center justify-center border border-white/20">
                <span className="text-white font-bold text-[10px] md:text-xs">Uber</span>
              </div>
              
              {/* iFood - Red background */}
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[#EA1D2C] flex items-center justify-center">
                <span className="text-white font-bold text-[10px] md:text-xs">iFood</span>
              </div>
              
              {/* InDriver - Green/Lime background */}
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[#C6F221] flex items-center justify-center">
                <span className="text-black font-bold text-[8px] md:text-[10px]">inDrive</span>
              </div>
              
              {/* BlaBlaCar - Blue background */}
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[#00AFF5] flex items-center justify-center">
                <span className="text-white font-bold text-[7px] md:text-[9px]">BlaBlaCar</span>
              </div>
              
              {/* Keepa/Lalamove style - Orange background */}
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[#FF6B00] flex items-center justify-center">
                <span className="text-white font-bold text-[9px] md:text-[11px]">Lalamove</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Garantia Section - White Background */}
      <section className="py-12 md:py-24 px-4 bg-[#f5f5f5]">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col items-center text-center md:text-left md:flex-row justify-between gap-6 md:gap-12">
            {/* Texto */}
            <div className="flex-1 space-y-4 md:space-y-4 order-1 md:order-1">
              <span className="text-[#c41313] font-bold text-sm md:text-base uppercase tracking-wide">Garantia</span>
              <h2 className="text-2xl md:text-4xl font-bold text-black leading-tight">
                Você não tem<br />nada a perder!
              </h2>
              <p className="text-gray-600 text-base md:text-lg leading-relaxed">
                Se por qualquer motivo você não ficar satisfeito ou não se adaptar, basta{" "}
                <strong className="text-black">entrar em contato com a nossa equipe dentro do prazo de 7 dias e solicitar o reembolso do valor investido.</strong>{" "}
                Você receberá de volta cada centavo que pagou.
              </p>
              <p className="text-gray-600 text-base md:text-lg leading-relaxed">
                Eu estou tirando todo o risco das suas mãos e colocando em nossa mão. Faça sua inscrição agora mesmo e veja com seus próprios olhos.
              </p>
            </div>
            
            {/* Número 7 grande */}
            <div className="flex-shrink-0 flex flex-col items-center justify-center order-2 md:order-2">
              <span className="text-[#c41313] font-black text-[120px] md:text-[180px] leading-none drop-shadow-lg">
                7
              </span>
              <span className="text-black font-bold text-lg md:text-2xl mt-1 md:mt-2 tracking-wide">
                Garantia de 7 dias
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Resources Carousel Section - White Background */}
      <section className="py-10 md:py-24 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center space-y-2 md:space-y-4 mb-8 md:mb-12">
            <h2 className="text-xl md:text-4xl font-bold text-black">
              Veja os <span className="text-[#3c83f6]">Recursos</span> na Prática
            </h2>
            <p className="text-gray-600 text-sm md:text-lg max-w-2xl mx-auto">
              Conheça cada funcionalidade do app
            </p>
          </div>

          {/* Resources Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 justify-items-center">
            {resourcesSlides.map((slide, index) => (
              <div key={index} className="flex flex-col items-center w-full max-w-[280px] md:max-w-none mx-auto">
                <img 
                  src={slide.img} 
                  alt={slide.caption}
                  className="w-full h-auto object-contain cursor-pointer rounded-xl shadow-lg hover:scale-105 transition-transform duration-300"
                  onClick={() => setSelectedResourceImage({ ...slide, index })}
                />
                <p className="text-center text-sm md:text-base text-gray-700 mt-3 font-medium">
                  {slide.caption}
                </p>
              </div>
            ))}
          </div>

          {/* Resources Image Lightbox Dialog */}
          <Dialog open={!!selectedResourceImage} onOpenChange={() => setSelectedResourceImage(null)}>
            <DialogContent className="max-w-[95vw] md:max-w-4xl p-0 bg-black/95 border-[#15a249]/30 overflow-hidden">
              {selectedResourceImage && (
                <div className="relative">
                  {/* Close button */}
                  <button
                    onClick={() => setSelectedResourceImage(null)}
                    className="absolute top-3 right-3 z-10 bg-black/60 hover:bg-black/80 rounded-full p-2 transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>

                  {/* Navigation arrows */}
                  <button
                    onClick={() => navigateResourcesLightbox('prev')}
                    className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 bg-black/60 hover:bg-[#15a249]/80 rounded-full p-2 md:p-3 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </button>
                  <button
                    onClick={() => navigateResourcesLightbox('next')}
                    className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 bg-black/60 hover:bg-[#15a249]/80 rounded-full p-2 md:p-3 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </button>

                  {/* Image */}
                  <div className="p-4 pt-12 md:p-6 md:pt-8">
                    <img
                      src={selectedResourceImage.img}
                      alt={selectedResourceImage.caption}
                      className="w-full h-auto max-h-[75vh] object-contain rounded-lg"
                    />
                    <p className="text-center mt-4 text-white font-medium text-base md:text-lg">
                      {selectedResourceImage.caption}
                    </p>
                    
                    {/* Dots in lightbox */}
                    <div className="flex justify-center gap-3 mt-4">
                      {resourcesSlides.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedResourceImage({ ...resourcesSlides[index], index })}
                          className={`w-2 h-2 rounded-full transition-all ${
                            selectedResourceImage.index === index 
                              ? 'bg-[#15a249] scale-125' 
                              : 'bg-white/40'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-12 md:py-24 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col items-center gap-6 md:gap-12 md:grid md:grid-cols-2">
            {/* Photo */}
            <div className="order-1 flex justify-center">
              <img 
                src={fundadorImg} 
                alt="Fundador do Meu Faturamento App"
                className="w-52 md:w-full max-w-md rounded-2xl shadow-xl"
              />
            </div>
            
            {/* Text */}
            <div className="space-y-4 md:space-y-6 order-2 text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-bold text-black">
                Chega de '<span className="text-[#c41313]">bater lata</span>'. É hora de bater a meta com <span className="text-[#3c83f6]">inteligência</span>
              </h2>
              <p className="text-black text-base md:text-lg leading-relaxed font-medium">
                Meu nome é <span className="text-[#3c83f7]">Andrews Morais</span>, eu também sou motorista e sei que o segredo do lucro está no controle. 
                Criei o <span className="text-[#3c83f7]">Meu Faturamento App</span> para ser nosso braço direito na gestão financeira: 
                prático, barato e direto ao ponto. Chega de 'bater lata' sem saber o seu 
                lucro real. Vamos juntos bater nossas metas com <span className="text-[#3c83f7]">inteligência!</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section - #f9f9fa */}
      <section className="py-10 md:py-24 px-4 bg-[#f9f9fa]">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-2 md:space-y-4 mb-8 md:mb-12">
            <h2 className="text-lg md:text-3xl lg:text-4xl font-bold leading-tight max-w-4xl mx-auto text-black">
              <span className="text-brand-red">Veja Quem Já Meu Faturamento App!</span> Motoristas que, agora, têm controle total e transformaram as corridas em <span className="text-brand-blue">lucro líquido real</span>.
            </h2>
          </div>

          {/* YouTube Shorts Videos - Responsive Grid */}
          <div className="mb-10 md:mb-16">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {['bOkwngfR0-8', '9e7MrKaUW5c', 'RTqU92TMKfU', 'T85VaIC987M'].map((videoId, index) => (
                <div key={videoId} className="aspect-[9/16] rounded-xl overflow-hidden shadow-lg mx-auto w-full max-w-xs md:max-w-none">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                    title={`Depoimento em vídeo ${index + 1}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              ))}
            </div>
          </div>


          {/* WhatsApp Screenshots Carousel */}
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
      <section id="pricing" className="py-10 md:py-24 px-2 md:px-4 bg-[#f9f9fa]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center space-y-2 md:space-y-4 mb-8 md:mb-12">
            <h2 className="text-xl md:text-4xl font-bold text-black">
              Escolha Seu <span className="text-brand-blue">Plano</span>
            </h2>
            <p className="text-gray-600 text-sm md:text-lg">
              Invista no controle das suas finanças
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-4 md:mt-6">
            {/* Monthly Plan */}
            <Card className="relative border-2 border-[#3c83f6] shadow-xl bg-black max-w-full w-full">
              <CardContent className="p-5 md:p-8 space-y-4 md:space-y-6 pt-8">
                <div className="text-center space-y-1 md:space-y-2">
                  <h3 className="text-2xl md:text-2xl font-bold text-white">Plano Mensal</h3>
                  <p className="text-sm text-gray-400">Acesso completo mês a mês</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl md:text-5xl font-bold text-[#3c83f6]">R$ 19,90</span>
                    <span className="text-gray-400 text-sm md:text-base">/mês</span>
                  </div>
                </div>

                <ul className="text-left space-y-2 md:space-y-3">
                  <li className="flex items-start gap-2 md:gap-3">
                    <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 md:w-4 md:h-4 text-white" />
                    </div>
                    <span className="text-white text-sm md:text-base">Descubra qual é o seu Custo e o seu Lucro real em cada viagem</span>
                  </li>
                  <li className="flex items-start gap-2 md:gap-3">
                    <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 md:w-4 md:h-4 text-white" />
                    </div>
                    <span className="text-white text-sm md:text-base">Entenda de forma simples quanto é o seu Custo e o seu Lucro por cada KM que você roda</span>
                  </li>
                  <li className="flex items-start gap-2 md:gap-3">
                    <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 md:w-4 md:h-4 text-white" />
                    </div>
                    <span className="text-white text-sm md:text-base">Tenha total controle de quanto você lucra e de quanto você gasta por hora</span>
                  </li>
                  <li className="flex items-start gap-2 md:gap-3">
                    <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 md:w-4 md:h-4 text-white" />
                    </div>
                    <span className="text-white text-sm md:text-base">Defina uma meta para os seus ganhos e para os gastos</span>
                  </li>
                  <li className="flex items-start gap-2 md:gap-3">
                    <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 md:w-4 md:h-4 text-white" />
                    </div>
                    <span className="text-white text-sm md:text-base">Acompanhe o seu faturamento por hora e por KM</span>
                  </li>
                  <li className="flex items-start gap-2 md:gap-3">
                    <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 md:w-4 md:h-4 text-white" />
                    </div>
                    <span className="text-white text-sm md:text-base">Funciona em aparelhos IOS (iPhone) e em aparelhos Android</span>
                  </li>
                </ul>

                <Button
                  className="w-full py-4 md:py-6 text-sm md:text-lg font-bold bg-[#25D366] hover:bg-[#1da851] text-white rounded-lg animate-soft-pulse"
                  onClick={() => handleSelectPlan()}
                >
                  ASSINAR AGORA
                </Button>
              </CardContent>
            </Card>

            {/* Annual Plan */}
            <Card className="relative border-2 border-[#3c83f6] shadow-xl bg-black max-w-full w-full">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <span className="bg-[#25D366] text-white px-4 py-1 rounded-full text-xs md:text-sm font-bold whitespace-nowrap">Melhor Custo-Benefício</span>
              </div>
              <CardContent className="p-5 md:p-8 space-y-4 md:space-y-6 pt-8">
                <div className="text-center space-y-1 md:space-y-2">
                  <h3 className="text-2xl md:text-2xl font-bold text-white">Plano Anual</h3>
                  <div className="flex items-center justify-center gap-2 md:gap-3">
                    <span className="text-2xl md:text-3xl font-semibold text-red-500 line-through">de R$ 147</span>
                    <span className="text-lg md:text-2xl font-medium text-gray-300">por</span>
                  </div>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl md:text-5xl font-bold text-[#3c83f6]">R$ 97,90</span>
                    <span className="text-gray-400 text-sm md:text-base">/ano</span>
                  </div>
                  <p className="text-sm md:text-sm text-gray-400">Equivale a R$ 8,16/mês</p>
                </div>

                <div className="p-3 md:p-4 rounded-lg bg-green-500/20 border border-green-500/30">
                  <p className="text-base md:text-lg font-bold text-center text-green-400">
                    🎉 Economia de R$ 56,90 por ano!
                  </p>
                </div>

                <ul className="text-left space-y-2 md:space-y-3">
                  <li className="flex items-start gap-2 md:gap-3">
                    <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 md:w-4 md:h-4 text-white" />
                    </div>
                    <span className="text-white text-sm md:text-base">Descubra qual é o seu Custo e o seu Lucro real em cada viagem</span>
                  </li>
                  <li className="flex items-start gap-2 md:gap-3">
                    <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 md:w-4 md:h-4 text-white" />
                    </div>
                    <span className="text-white text-sm md:text-base">Entenda de forma simples quanto é o seu Custo e o seu Lucro por cada KM que você roda</span>
                  </li>
                  <li className="flex items-start gap-2 md:gap-3">
                    <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 md:w-4 md:h-4 text-white" />
                    </div>
                    <span className="text-white text-sm md:text-base">Tenha total controle de quanto você lucra e de quanto você gasta por hora</span>
                  </li>
                  <li className="flex items-start gap-2 md:gap-3">
                    <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 md:w-4 md:h-4 text-white" />
                    </div>
                    <span className="text-white text-sm md:text-base">Defina uma meta para os seus ganhos e para os gastos</span>
                  </li>
                  <li className="flex items-start gap-2 md:gap-3">
                    <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 md:w-4 md:h-4 text-white" />
                    </div>
                    <span className="text-white text-sm md:text-base">Acompanhe o seu faturamento por hora e por KM</span>
                  </li>
                  <li className="flex items-start gap-2 md:gap-3">
                    <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 md:w-4 md:h-4 text-white" />
                    </div>
                    <span className="text-white text-sm md:text-base">Funciona em aparelhos IOS (iPhone) e em aparelhos Android</span>
                  </li>
                </ul>

                <Button
                  className="w-full py-4 md:py-6 text-sm md:text-lg font-bold bg-[#25D366] hover:bg-[#1da851] text-white rounded-lg animate-soft-pulse"
                  onClick={() => handleSelectPlan()}
                >
                  COMEÇAR AGORA
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-6 md:mt-10">
            <div className="inline-flex items-center gap-2 px-4 py-3 md:px-8 md:py-5 rounded-xl bg-green-600">
              <ShieldCheck className="h-4 w-4 md:h-8 md:w-8 text-white flex-shrink-0" />
              <span className="text-xs md:text-xl font-bold text-white">7 dias de Garantia ou Seu Dinheiro de Volta</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section - #f9f9fa */}
      <section className="py-10 md:py-24 px-4 bg-[#f9f9fa]">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center space-y-2 md:space-y-4 mb-8 md:mb-12">
            <h2 className="text-xl md:text-4xl font-bold text-black">
              Perguntas <span className="text-brand-blue">Frequentes</span>
            </h2>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-3 md:space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border border-gray-200 rounded-lg px-3 md:px-4 bg-white">
                <AccordionTrigger className="text-left font-medium hover:no-underline text-black text-sm md:text-base py-3 md:py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 text-xs md:text-base pb-3 md:pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Ainda ficou com dúvidas? Section */}
      <section className="py-8 md:py-12 px-4 bg-[#f9f9fa]">
        <div className="container mx-auto max-w-2xl">
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border border-gray-100">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
              {/* Ícone de chat */}
              <div className="flex-shrink-0">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#25D366]/20 flex items-center justify-center">
                  <Headphones className="w-7 h-7 md:w-8 md:h-8 text-[#25D366]" />
                </div>
              </div>
              
              {/* Texto */}
              <div className="text-center md:text-left flex-1">
                <h3 className="text-lg md:text-xl font-bold text-[#25D366] mb-1">
                  Ainda ficou com dúvidas?
                </h3>
                <p className="text-gray-600 text-sm md:text-base">
                  Entre em contato conosco pelo WhatsApp e vamos te ajudar.
                </p>
              </div>
            </div>
            
            {/* Botão WhatsApp */}
            <a
              href="https://wa.me/5512981387508?text=Ol%C3%A1%0A%0AQuero%20saber%20mais%20sobre%20o%20Aplicativo%20Bateu%20A%20Meta%20"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleContactClick('WhatsApp Dúvidas')}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-4 px-6 rounded-full transition-all duration-300 hover:scale-105 shadow-md"
            >
              Entre em contato
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Footer - #000000 */}
      <section className="py-12 md:py-16 px-4 bg-black">
        <div className="container mx-auto max-w-4xl text-center space-y-6">
          <div className="flex flex-wrap justify-center gap-6">
            <a 
              href="https://www.instagram.com/bateu_meta/" 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={() => handleContactClick('Instagram')}
              className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity font-medium"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="url(#instagram-gradient-footer)">
                <defs>
                  <linearGradient id="instagram-gradient-footer" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FFDC80" />
                    <stop offset="25%" stopColor="#F77737" />
                    <stop offset="50%" stopColor="#E1306C" />
                    <stop offset="75%" stopColor="#C13584" />
                    <stop offset="100%" stopColor="#833AB4" />
                  </linearGradient>
                </defs>
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              @bateu_meta
            </a>
            <a 
              href="https://wa.me/5512981387508" 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={() => handleContactClick('WhatsApp Footer')}
              className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity font-medium"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#25D366">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              (12) 98138-7508
            </a>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link to="/politica-privacidade" className="text-[#3c83f6] hover:text-[#c41313] transition-colors">Política de Privacidade</Link>
            <span className="text-gray-600">•</span>
            <Link to="/termos-de-uso" className="text-[#3c83f6] hover:text-[#c41313] transition-colors">Termos de Uso</Link>
            <span className="text-gray-600">•</span>
            <Link to="/termos-de-uso#reembolso" className="text-[#3c83f6] hover:text-[#c41313] transition-colors">Política de Reembolso</Link>
          </div>

          <p className="text-sm text-gray-400 pt-4">
            © {new Date().getFullYear()} Meu Faturamento App. Todos os direitos reservados.
          </p>
        </div>
      </section>

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/5512981387508?text=Ol%C3%A1%0A%0AQuero%20saber%20mais%20sobre%20o%20Aplicativo%20Bateu%20A%20Meta%20"
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => handleContactClick('WhatsApp Floating')}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 md:w-16 md:h-16 bg-[#25D366] hover:bg-[#128C7E] rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 animate-bounce"
        aria-label="Fale conosco pelo WhatsApp"
      >
        <svg 
          viewBox="0 0 24 24" 
          className="w-7 h-7 md:w-8 md:h-8 text-white fill-white"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

    </div>
  );
};

export default LandingPage;
