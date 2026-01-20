import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useFacebookPixel } from "@/hooks/useFacebookPixel";
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
  ShieldCheck,
  Play,
  X,
  Expand,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import logo from "@/assets/bateu-a-meta-logo.png";

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

// Cakto checkout URL
const CAKTO_CHECKOUT_URL = "https://pay.cakto.com.br/pxje8kx_669077";

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
  
  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

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

  const handleSelectPlan = async () => {
    // Facebook Pixel - InitiateCheckout
    trackInitiateCheckout("Anual", 97.90);

    // Verificar se já tem email (usuário logado)
    const { data: { session } } = await supabase.auth.getSession();
    const email = session?.user?.email || "";

    // Redirecionar para checkout da Cakto
    const checkoutUrl = email 
      ? `${CAKTO_CHECKOUT_URL}?email=${encodeURIComponent(email)}`
      : CAKTO_CHECKOUT_URL;
    
    window.location.href = checkoutUrl;
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
      question: "O aplicativo Bateu A Meta funciona no iPhone e no Android?",
      answer: "Sim! O Bateu A Meta é um PWA (Progressive Web App) moderno e totalmente otimizado para ambos os sistemas (iOS e Android). Você instala ele diretamente no seu celular ou desktop."
    },
    {
      question: "Por quanto tempo terei acesso ao Bateu A Meta?",
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

      {/* Hero Section */}
      <section className="relative overflow-hidden py-6 md:py-20 bg-[#fafafa]">
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="flex flex-col items-center text-center space-y-4 md:space-y-6 px-4">
            <h1 className="text-2xl md:text-5xl lg:text-6xl font-bold leading-tight max-w-4xl text-black">
              <span className="text-brand-red">Bateu A Meta:</span> Transforme Sua Gestão Financeira Pessoal em{" "}
              <span className="text-brand-blue">Resultados Reais!</span>
            </h1>
            
            <h2 className="text-base md:text-xl lg:text-2xl text-black font-bold max-w-2xl">
              Conquiste Seus Objetivos Financeiros Com O Poder Da Organização E Planejamento Inteligente.
            </h2>

            {/* VSL Video - Thumbnail clicável que abre modal */}
            <div className="w-full max-w-xs md:max-w-4xl mx-auto px-0 sm:px-4">
              <button
                onClick={() => {
                  trackViewContent('VSL Video', 'Video');
                  setVideoOpen(true);
                }}
                className="relative w-full aspect-[9/16] md:aspect-video rounded-xl overflow-hidden shadow-2xl ring-2 ring-[#3c83f6]/40 group cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#3c83f6]/60"
              >
                {/* Thumbnail do YouTube */}
                <img
                  src="https://img.youtube.com/vi/TlnrQnk4M_E/maxresdefault.jpg"
                  alt="Assistir vídeo - Bateu a Meta"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {/* Overlay escuro */}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
                {/* Botão de Play */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 md:w-24 md:h-24 bg-[#c41313] rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                    <Play className="w-8 h-8 md:w-12 md:h-12 text-white ml-1" fill="white" />
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
                    src="https://www.youtube.com/embed/TlnrQnk4M_E?rel=0&modestbranding=1&autoplay=1"
                    title="Bateu a Meta - VSL"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              </DialogContent>
              </Dialog>

              {/* Card de Preço abaixo do VSL */}
              <div className="w-full max-w-md mx-auto mt-8">
                <Card className="border-2 border-[#3c83f6] rounded-2xl shadow-lg bg-white">
                  <CardContent className="p-8 space-y-6">
                    <div className="text-center space-y-2">
                      <h3 className="text-2xl font-bold text-black">Plano Anual</h3>
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-2xl md:text-3xl font-semibold text-red-500 line-through">de R$ 147</span>
                        <span className="text-xl md:text-2xl font-medium text-gray-700">por</span>
                      </div>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#3c83f6]">R$ 97,90</span>
                        <span className="text-gray-500">/ano</span>
                      </div>
                      <p className="text-sm text-gray-500">Equivale a R$ 8,16/mês</p>
                    </div>

                    <div className="p-4 rounded-lg bg-green-500/20 border border-green-500/30">
                      <p className="text-lg font-bold text-center text-green-700">
                        🎉 Economia de R$ 49,10 por ano!
                      </p>
                    </div>

                    <ul className="text-left space-y-2">
                      <li className="flex items-center gap-2">
                        <span className="text-green-500 text-3xl font-bold">✓</span>
                        <span className="text-black text-lg font-bold">Ganhos Por Hora</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500 text-3xl font-bold">✓</span>
                        <span className="text-black text-lg font-bold">Ganhos Por Km</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500 text-3xl font-bold">✓</span>
                        <span className="text-black text-lg font-bold">Despesas Por Km</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500 text-3xl font-bold">✓</span>
                        <span className="text-black text-lg font-bold">Horas Trabalhadas</span>
                      </li>
                    </ul>

                    <Button
                      className="w-full py-5 md:py-6 text-base md:text-lg font-bold bg-[#25D366] hover:bg-[#1da851] text-white rounded-lg animate-soft-pulse"
                      onClick={() => handleSelectPlan()}
                    >
                      COMEÇAR AGORA
                    </Button>
                  </CardContent>
                </Card>
              </div>
          </div>
        </div>
      </section>

      {/* Vantagens e Diferenciais Section */}
      <section className="py-16 md:py-24 px-4 bg-[#1a1a1a]">
        <div className="container mx-auto max-w-5xl">
          {/* Card container com bordas arredondadas */}
          <div className="bg-[#252525] rounded-3xl p-6 md:p-12">
            {/* Header */}
            <p className="text-[#c41313] font-bold text-sm mb-2 uppercase tracking-wide">
              Vantagens e Diferenciais
            </p>
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-10">
              O Bateu a Meta é para você,<br />
              motorista que...
            </h2>
            
            {/* Grid 2 colunas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {/* Card 1 - Menu KM */}
              <div className="flex items-start gap-4">
                <div className="border border-gray-600 rounded-lg p-2 flex-shrink-0">
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-gray-300 text-base md:text-lg">
                  Sente que <strong className="text-white">'bate lata'</strong> e quer saber exatamente o seu <strong className="text-[#15a249]">lucro líquido real</strong> por quilômetro rodado.
                </p>
              </div>

              {/* Card 2 - Gestão de Metas */}
              <div className="flex items-start gap-4">
                <div className="border border-gray-600 rounded-lg p-2 flex-shrink-0">
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-gray-300 text-base md:text-lg">
                  Precisa de um <strong className="text-white">guia visual</strong> para saber quanto falta para atingir seu <strong className="text-[#3c83f6]">objetivo financeiro</strong> do dia.
                </p>
              </div>

              {/* Card 3 - Menu Manutenções */}
              <div className="flex items-start gap-4">
                <div className="border border-gray-600 rounded-lg p-2 flex-shrink-0">
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-gray-300 text-base md:text-lg">
                  Quer ter o <strong className="text-white">controle total dos gastos preventivos</strong> e evitar surpresas mecânicas que pesam no bolso.
                </p>
              </div>

              {/* Card 4 - Ganhos e Despesas */}
              <div className="flex items-start gap-4">
                <div className="border border-gray-600 rounded-lg p-2 flex-shrink-0">
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-gray-300 text-base md:text-lg">
                  Busca uma maneira <strong className="text-white">simples de registrar ganhos</strong> da Uber, 99, iFood e outras plataformas <strong className="text-[#15a249]">em um só lugar</strong>.
                </p>
              </div>

              {/* Card 5 - Análise de Performance */}
              <div className="flex items-start gap-4">
                <div className="border border-gray-600 rounded-lg p-2 flex-shrink-0">
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-gray-300 text-base md:text-lg">
                  Deseja entender seu <strong className="text-[#3c83f6]">ganho real por hora</strong> para decidir os <strong className="text-white">melhores horários</strong> para rodar.
                </p>
              </div>

              {/* Card 6 - Organização Financeira */}
              <div className="flex items-start gap-4">
                <div className="border border-gray-600 rounded-lg p-2 flex-shrink-0">
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-gray-300 text-base md:text-lg">
                  Sente-se <strong className="text-[#c41313]">desorganizado</strong> e quer transformar o <strong className="text-white">caos das contas</strong> em um histórico limpo e profissional.
                </p>
              </div>
            </div>
          </div>
          
          {/* Marquee Importante */}
          <div className="bg-yellow-400 py-2 mt-8 overflow-hidden rounded-lg">
            <div className="animate-marquee whitespace-nowrap flex">
              {[...Array(10)].map((_, i) => (
                <span key={i} className="text-black font-bold text-sm mx-4">IMPORTANTE •</span>
              ))}
            </div>
          </div>
          
          {/* Footer com plataformas */}
          <div className="bg-black py-8 px-6 rounded-b-3xl mt-0 border border-gray-800 border-t-0">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Logos das Plataformas */}
              <div className="flex items-center gap-3 flex-wrap justify-center">
                <span className="bg-yellow-400 text-black px-4 py-2 rounded-lg font-bold text-sm">99</span>
                <span className="bg-black border-2 border-white text-white px-4 py-2 rounded-lg font-bold text-sm">Uber</span>
                <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-sm">iFood</span>
                <span className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold text-sm">InDriver</span>
              </div>
              
              {/* Texto */}
              <p className="text-gray-300 text-sm md:text-base text-center md:text-right max-w-md">
                O aplicativo está disponível para <strong className="text-white">sistemas iOS e Android</strong>. 
                E vale ressaltar que o link para instalação e ativação do aplicativo 
                <em className="text-yellow-400"> é disponibilizado após a conclusão do pagamento</em>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Passos Section - Black Background */}
      <section className="py-16 md:py-24 px-4 bg-black">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-white">
              <span className="text-brand-blue">3 Passos Simples</span> Para Começar
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-r from-[#c41313] to-[#3c83f6] flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {step.number}
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-[#c41313] to-[#3c83f6]" />
                )}
                <h3 className="text-xl font-bold text-white">{step.title}</h3>
                <p className="text-gray-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Resources Carousel Section - White Background */}
      <section className="py-16 md:py-24 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-black">
              Veja os <span className="text-[#3c83f6]">Recursos</span> na Prática
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Conheça cada funcionalidade do app
            </p>
          </div>

          {/* Resources Carousel */}
          <Carousel
            opts={{
              align: "center",
              loop: true,
            }}
            setApi={setResourcesCarouselApi}
            className="w-full max-w-3xl mx-auto"
          >
            <CarouselContent>
              {resourcesSlides.map((slide, index) => (
                <CarouselItem key={index} className="basis-full md:basis-4/5">
                  <div className="px-2 md:px-4">
                    <div 
                      className="bg-white rounded-2xl shadow-lg p-3 md:p-4 border border-gray-200 cursor-pointer group relative"
                      onClick={() => setSelectedResourceImage({ ...slide, index })}
                    >
                      <div className="relative overflow-hidden rounded-xl">
                        <img 
                          src={slide.img} 
                          alt={slide.caption}
                          className="w-full h-auto rounded-xl transition-transform duration-300 group-hover:scale-105"
                        />
                        {/* Hover overlay with expand icon */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-xl">
                          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                            <Expand className="w-6 h-6 md:w-8 md:h-8 text-white" />
                          </div>
                        </div>
                      </div>
                      <p className="text-center mt-3 text-black font-medium text-sm md:text-base">
                        {slide.caption}
                      </p>
                      {/* Mobile tap hint */}
                      <p className="text-center text-gray-500 text-xs mt-1 md:hidden">
                        Toque para ampliar
                      </p>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-12 bg-white border-gray-300 text-black hover:bg-gray-100 hover:border-gray-400 shadow-md" />
            <CarouselNext className="hidden md:flex -right-12 bg-white border-gray-300 text-black hover:bg-gray-100 hover:border-gray-400 shadow-md" />
          </Carousel>

          {/* Dynamic dots indicator */}
          <div className="flex justify-center gap-3 mt-6">
            {resourcesSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => resourcesCarouselApi?.scrollTo(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  resourcesCurrentSlide === index 
                    ? 'bg-[#15a249] scale-125 shadow-[0_0_8px_rgba(21,162,73,0.6)]' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Ir para slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Swipe hint for mobile */}
          <p className="text-center text-gray-500 text-sm mt-3 md:hidden">
            ← Arraste para ver mais →
          </p>

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
      <section className="py-16 md:py-24 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left - Photo */}
            <div className="order-1 flex justify-center">
              <img 
                src={fundadorImg} 
                alt="Fundador do Bateu a Meta"
                className="w-full max-w-md rounded-2xl shadow-xl"
              />
            </div>
            
            {/* Right - Text */}
            <div className="space-y-6 order-2">
              <h2 className="text-2xl md:text-3xl font-bold text-black">
                Chega de '<span className="text-[#c41313]">bater lata</span>'. É hora de bater a meta com <span className="text-[#3c83f6]">inteligência</span>
              </h2>
              <p className="text-black text-base md:text-lg leading-relaxed font-medium">
                Meu nome é <span className="text-[#3c83f7]">Andrews Morais</span>, eu também sou motorista e sei que o segredo do lucro está no controle. 
                Criei o <span className="text-[#3c83f7]">Bateu a Meta</span> para ser nosso braço direito na gestão financeira: 
                prático, barato e direto ao ponto. Chega de 'bater lata' sem saber o seu 
                lucro real. Vamos juntos bater nossas metas com <span className="text-[#3c83f7]">inteligência!</span>
              </p>
            </div>
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

          {/* Driver Testimonials Carousel */}
          <div className="mb-16">
            <Carousel
              opts={{
                align: "center",
                loop: true,
              }}
              setApi={setTestimonialCarouselApi}
              className="w-full max-w-4xl mx-auto"
            >
              <CarouselContent>
                {testimonialSlides.map((slide, index) => (
                  <CarouselItem key={index} className="basis-full">
                    <Card className="bg-white shadow-lg border-0 mx-2">
                      <CardContent className="p-4 md:p-8">
                        <div className="flex flex-col items-center gap-4 md:gap-6">
                          {/* Photo - formato 9:16 */}
                          <div className="w-40 h-72 md:w-52 md:h-[370px] flex-shrink-0">
                            <img 
                              src={slide.img} 
                              alt={`Depoimento de ${slide.name}`}
                              className="w-full h-full object-cover rounded-2xl"
                            />
                          </div>
                          
                          {/* Text - embaixo da foto */}
                          <div className="text-center">
                            <p 
                              className="text-sm md:text-xl text-gray-700 italic leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: `"${highlightKeywords(slide.testimonial)}"` }}
                            />
                            <p className="mt-3 md:mt-4 font-bold text-black text-base md:text-lg">
                              — {slide.name}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex -left-12 bg-white border-gray-300 text-black hover:bg-gray-100" />
              <CarouselNext className="hidden md:flex -right-12 bg-white border-gray-300 text-black hover:bg-gray-100" />
            </Carousel>

            {/* Dots indicators */}
            <div className="flex justify-center gap-3 mt-6">
              {testimonialSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => testimonialCarouselApi?.scrollTo(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    testimonialCurrentSlide === index 
                      ? 'bg-[#25D366] scale-125' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Ir para depoimento ${index + 1}`}
                />
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

          <div className="flex justify-center mt-6">
            {/* Annual Plan */}
            <Card className="relative border-2 border-[#3c83f6] shadow-xl bg-white max-w-md w-full">
              <CardContent className="p-8 space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold text-black">Plano Anual</h3>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-2xl md:text-3xl font-semibold text-red-500 line-through">de R$ 147</span>
                    <span className="text-xl md:text-2xl font-medium text-gray-700">por</span>
                  </div>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#3c83f6]">R$ 97,90</span>
                    <span className="text-gray-500">/ano</span>
                  </div>
                  <p className="text-sm text-gray-500">Equivale a R$ 8,16/mês</p>
                </div>

                <div className="p-4 rounded-lg bg-green-500/20 border border-green-500/30">
                  <p className="text-lg font-bold text-center text-green-700">
                    🎉 Economia de R$ 49,10 por ano!
                  </p>
                </div>

                <ul className="text-left space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500 text-3xl font-bold">✓</span>
                    <span className="text-black text-lg font-bold">Ganhos Por Hora</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500 text-3xl font-bold">✓</span>
                    <span className="text-black text-lg font-bold">Ganhos Por Km</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500 text-3xl font-bold">✓</span>
                    <span className="text-black text-lg font-bold">Despesas Por Km</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500 text-3xl font-bold">✓</span>
                    <span className="text-black text-lg font-bold">Horas Trabalhadas</span>
                  </li>
                </ul>

                <Button
                  className="w-full py-5 md:py-6 text-base md:text-lg font-bold bg-[#25D366] hover:bg-[#1da851] text-white rounded-lg animate-soft-pulse"
                  onClick={() => handleSelectPlan()}
                >
                  COMEÇAR AGORA
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-10">
            <div className="inline-flex items-center gap-2 md:gap-3 px-4 py-3 md:px-8 md:py-5 rounded-xl bg-green-600">
              <ShieldCheck className="h-5 w-5 md:h-8 md:w-8 text-white flex-shrink-0" />
              <span className="text-sm md:text-lg lg:text-xl font-bold text-white">7 dias de Garantia ou Seu Dinheiro de Volta</span>
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
              href="https://wa.me/5512981796135" 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={() => handleContactClick('WhatsApp Footer')}
              className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity font-medium"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#25D366">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              (12) 98179-6135
            </a>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <a href="#" className="text-[#3c83f6] hover:text-[#c41313] transition-colors">Política de Privacidade</a>
            <span className="text-gray-600">•</span>
            <a href="#" className="text-[#3c83f6] hover:text-[#c41313] transition-colors">Termos de Uso</a>
            <span className="text-gray-600">•</span>
            <a href="#" className="text-[#3c83f6] hover:text-[#c41313] transition-colors">Política de Reembolso</a>
          </div>

          <p className="text-sm text-gray-400 pt-4">
            © {new Date().getFullYear()} Bateu A Meta. Todos os direitos reservados.
          </p>
        </div>
      </section>

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/5512981796135?text=Ol%C3%A1%0A%0AQuero%20saber%20mais%20sobre%20o%20Aplicativo%20Bateu%20A%20Meta%20"
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
