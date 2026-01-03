import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Loader2, 
  CreditCard, 
  QrCode, 
  Copy, 
  Check, 
  Clock,
  Shield,
  ChevronDown,
  ChevronUp,
  Phone,
  Lock,
  ShieldCheck
} from "lucide-react";
import logo from "@/assets/bateu-a-meta-logo.png";
import eloLogo from "@/assets/payment/elo.png";
import hipercardLogo from "@/assets/payment/hipercard.png";

type PlanType = "mensal" | "anual";

interface PixData {
  payment_id: string;
  qr_code: string;
  qr_code_base64: string;
  ticket_url: string;
  expiration_date: string;
}

interface FormData {
  email: string;
  confirmEmail: string;
  fullName: string;
  cpf: string;
  phone: string;
  coupon: string;
}

interface CardData {
  cardNumber: string;
  expiry: string;
  cvv: string;
  holderName: string;
  installments: number;
}

// Mercado Pago Public Key
const MP_PUBLIC_KEY = "APP_USR-0eb91d31-0f75-4e5d-bb89-ce5ed15a93b7";

// SVG Card Brand Logos
const VisaLogo = () => (
  <svg viewBox="0 0 780 500" className="h-6 w-auto">
    <path fill="#1434CB" d="M293.2 348.7l33.4-195.7h53.4l-33.4 195.7zM518.7 158.6c-10.5-4-27-8.3-47.6-8.3-52.3 0-89.2 26.3-89.5 64-0.3 27.9 26.3 43.4 46.4 52.7 20.7 9.5 27.6 15.5 27.5 24-0.1 13-16.5 18.9-31.8 18.9-21.3 0-32.6-3-50.1-10.2l-6.9-3.1-7.5 43.8c12.4 5.4 35.4 10.1 59.3 10.4 55.6 0 91.7-26 92.2-66.3 0.2-22.1-13.9-38.9-44.5-52.8-18.5-9-29.9-14.9-29.8-24 0-8 9.6-16.6 30.4-16.6 17.3-0.3 29.9 3.5 39.7 7.4l4.8 2.2 7.2-42.1zM609.5 153h-41c-12.7 0-22.2 3.5-27.8 16.2l-78.8 178.5h55.7s9.1-24 11.2-29.2c6.1 0 60.2 0.1 67.9 0.1 1.6 6.8 6.5 29.1 6.5 29.1h49.2l-42.9-194.7zm-65.2 125.9c4.4-11.2 21.2-54.3 21.2-54.3-0.3 0.5 4.4-11.3 7.1-18.6l3.6 16.8s10.2 46.6 12.3 56.1h-44.2zM248.5 153l-51.9 133.4-5.5-27c-9.6-30.8-39.5-64.2-73-81l47.4 169.9h56l83.4-195.3h-56.4z"/>
    <path fill="#F9A533" d="M146.9 153H60.9l-0.7 4.2c66.5 16.1 110.5 54.9 128.8 101.6l-18.5-89.1c-3.2-12.3-12.5-16.2-23.6-16.7z"/>
  </svg>
);

const MastercardLogo = () => (
  <svg viewBox="0 0 780 500" className="h-6 w-auto">
    <circle fill="#EB001B" cx="250" cy="250" r="150"/>
    <circle fill="#F79E1B" cx="530" cy="250" r="150"/>
    <path fill="#FF5F00" d="M325 127.5c-38.2 30.5-62.7 77.3-62.7 130s24.5 99.5 62.7 130c38.2-30.5 62.7-77.3 62.7-130s-24.5-99.5-62.7-130z"/>
  </svg>
);

const AmexLogo = () => (
  <svg viewBox="0 0 780 500" className="h-6 w-auto">
    <rect fill="#006FCF" width="780" height="500" rx="40"/>
    <path fill="#FFF" d="M40 241h80l16-38 16 38h80v-82l-40 82h-32l-40-82v82h-80v-120h64l16 38 16-38h224v24l-24 36 24 36v24h-64l-16-38-16 38h-224z"/>
  </svg>
);

const MercadoPagoLogo = () => (
  <svg viewBox="0 0 120 30" className="h-5 w-auto">
    <path fill="#009EE3" d="M15 0C6.7 0 0 6.7 0 15s6.7 15 15 15 15-6.7 15-15S23.3 0 15 0zm0 24c-5 0-9-4-9-9s4-9 9-9 9 4 9 9-4 9-9 9z"/>
    <path fill="#009EE3" d="M15 8c-3.9 0-7 3.1-7 7s3.1 7 7 7 7-3.1 7-7-3.1-7-7-7zm0 11c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z"/>
    <text x="35" y="20" fill="#00214B" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold">Mercado Pago</text>
  </svg>
);

const FinalizarAssinatura = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    email: "",
    confirmEmail: "",
    fullName: "",
    cpf: "",
    phone: "",
    coupon: "",
  });
  
  // Card state
  const [cardData, setCardData] = useState<CardData>({
    cardNumber: "",
    expiry: "",
    cvv: "",
    holderName: "",
    installments: 1,
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"card" | "pix">("card");
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [copied, setCopied] = useState(false);
  const [showCoupon, setShowCoupon] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<FormData>>({});
  const [cardErrors, setCardErrors] = useState<Partial<CardData>>({});
  const [mpReady, setMpReady] = useState(false);
  const [cardBrand, setCardBrand] = useState<string>("");
  
  // Plan info
  const planType = searchParams.get("planType") as PlanType | null;
  const planPrice = planType === "anual" ? 97.90 : 12.90;
  const planName = planType === "anual" ? "Plano Anual" : "Plano Mensal";
  const installmentValue = planType === "anual" ? (97.90 / 12).toFixed(2) : "12,90";

  // Pre-populate email from query params
  useEffect(() => {
    const emailFromParams = searchParams.get("email");
    if (emailFromParams) {
      setFormData(prev => ({ 
        ...prev, 
        email: emailFromParams,
        confirmEmail: emailFromParams 
      }));
    }
  }, [searchParams]);

  // Initialize Mercado Pago SDK
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.async = true;
    script.onload = () => {
      setMpReady(true);
      console.log("[Checkout] MercadoPago SDK loaded");
    };
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Format CPF
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    return value.slice(0, 14);
  };

  // Format phone
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");
    }
    return value.slice(0, 15);
  };

  // Format card number
  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    const formatted = numbers.match(/.{1,4}/g)?.join(" ") || numbers;
    return formatted.slice(0, 19);
  };

  // Format expiry date
  const formatExpiry = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length >= 2) {
      return numbers.slice(0, 2) + "/" + numbers.slice(2, 4);
    }
    return numbers;
  };

  // Detect card brand
  const detectCardBrand = useCallback((number: string) => {
    const cleanNumber = number.replace(/\D/g, "");
    if (/^4/.test(cleanNumber)) return "visa";
    if (/^5[1-5]/.test(cleanNumber)) return "master";
    if (/^3[47]/.test(cleanNumber)) return "amex";
    if (/^6/.test(cleanNumber)) return "elo";
    if (/^(36|38|30[0-5])/.test(cleanNumber)) return "diners";
    if (/^(50|6[0-9])/.test(cleanNumber)) return "hipercard";
    return "";
  }, []);

  // Handle card number change
  const handleCardNumberChange = (value: string) => {
    const formatted = formatCardNumber(value);
    setCardData(prev => ({ ...prev, cardNumber: formatted }));
    setCardBrand(detectCardBrand(value));
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Partial<FormData> = {};
    
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Email inválido";
    }
    if (formData.email !== formData.confirmEmail) {
      errors.confirmEmail = "Os emails não coincidem";
    }
    if (!formData.fullName || formData.fullName.trim().split(" ").length < 2) {
      errors.fullName = "Digite seu nome completo";
    }
    if (!formData.cpf || formData.cpf.replace(/\D/g, "").length !== 11) {
      errors.cpf = "CPF inválido";
    }
    if (!formData.phone || formData.phone.replace(/\D/g, "").length < 10) {
      errors.phone = "Telefone inválido";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate card
  const validateCard = (): boolean => {
    const errors: Partial<CardData> = {};
    
    const cardNumber = cardData.cardNumber.replace(/\D/g, "");
    if (!cardNumber || cardNumber.length < 13) {
      errors.cardNumber = "Número do cartão inválido";
    }
    if (!cardData.expiry || cardData.expiry.length !== 5) {
      errors.expiry = "Data inválida";
    }
    if (!cardData.cvv || cardData.cvv.length < 3) {
      errors.cvv = "CVV inválido";
    }
    if (!cardData.holderName || cardData.holderName.trim().length < 3) {
      errors.holderName = "Nome do titular inválido";
    }
    
    setCardErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Process card payment
  const handleCardPayment = async () => {
    if (!validateForm() || !validateCard()) {
      toast.error("Por favor, corrija os erros no formulário");
      return;
    }

    if (!mpReady) {
      toast.error("Sistema de pagamento ainda carregando. Aguarde...");
      return;
    }

    setLoading(true);

    try {
      // Initialize MercadoPago
      // @ts-expect-error MercadoPago is loaded from SDK
      const mp = new window.MercadoPago(MP_PUBLIC_KEY);
      
      // Parse expiry date
      const [expMonth, expYear] = cardData.expiry.split("/");
      const fullYear = parseInt(expYear) < 50 ? `20${expYear}` : `19${expYear}`;
      
      // Create card token
      const cardTokenData = {
        cardNumber: cardData.cardNumber.replace(/\D/g, ""),
        cardholderName: cardData.holderName,
        cardExpirationMonth: expMonth,
        cardExpirationYear: fullYear,
        securityCode: cardData.cvv,
        identificationType: "CPF",
        identificationNumber: formData.cpf.replace(/\D/g, ""),
      };

      console.log("[Checkout] Creating card token...");
      
      const tokenResponse = await mp.createCardToken(cardTokenData);
      
      if (tokenResponse.error) {
        throw new Error(tokenResponse.error);
      }

      console.log("[Checkout] Card token created:", tokenResponse.id);

      // Split name for API
      const nameParts = formData.fullName.trim().split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ") || firstName;

      // Send to edge function
      const { data, error } = await supabase.functions.invoke("create-mp-card-payment", {
        body: {
          planType,
          token: tokenResponse.id,
          payment_method_id: cardBrand || "visa",
          installments: cardData.installments,
          payer: {
            email: formData.email,
            first_name: firstName,
            last_name: lastName,
            identification: {
              type: "CPF",
              number: formData.cpf.replace(/\D/g, ""),
            },
          },
        },
      });

      if (error) throw error;

      console.log("[Checkout] Payment response:", data);

      if (data.status === "approved") {
        toast.success("Pagamento aprovado! Redirecionando...");
        navigate(`/auth?payment_success=true&plan=${planType}`);
      } else if (data.status === "in_process" || data.status === "pending") {
        toast.info("Pagamento em processamento. Aguarde a confirmação.");
        navigate(`/auth?payment_pending=true&plan=${planType}`);
      } else {
        toast.error(data.error || "Pagamento não aprovado. Tente novamente.");
      }
    } catch (error: unknown) {
      console.error("[Checkout] Card payment error:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao processar pagamento";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Process PIX payment
  const handlePixPayment = async () => {
    if (!validateForm()) {
      toast.error("Por favor, corrija os erros no formulário");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-mp-pix-payment", {
        body: { 
          planType, 
          email: formData.email,
          fullName: formData.fullName,
          phone: formData.phone,
        },
      });

      if (error) throw error;

      if (data?.qr_code && data?.qr_code_base64) {
        setPixData(data);
        toast.success("PIX gerado com sucesso!");
      } else {
        throw new Error("Dados do PIX não retornados");
      }
    } catch (error: unknown) {
      console.error("[Checkout] PIX error:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao gerar PIX";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Copy PIX code
  const handleCopyPixCode = async () => {
    if (pixData?.qr_code) {
      try {
        await navigator.clipboard.writeText(pixData.qr_code);
        setCopied(true);
        toast.success("Código PIX copiado!");
        setTimeout(() => setCopied(false), 3000);
      } catch {
        toast.error("Erro ao copiar código");
      }
    }
  };

  // Generate installment options
  const getInstallmentOptions = () => {
    if (planType !== "anual") return [{ value: 1, label: `1x de R$ ${planPrice.toFixed(2).replace(".", ",")}` }];
    
    const options = [];
    for (let i = 1; i <= 12; i++) {
      const value = planPrice / i;
      const label = i === 1 
        ? `1x de R$ ${planPrice.toFixed(2).replace(".", ",")} (sem juros)`
        : `${i}x de R$ ${value.toFixed(2).replace(".", ",")} (sem juros)`;
      options.push({ value: i, label });
    }
    return options;
  };

  if (!planType) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-[#e5e7eb]">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600">Plano não selecionado.</p>
            <Button onClick={() => navigate("/planos")} className="mt-4 bg-[#10b981] hover:bg-[#059669]">
              Ver Planos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      {/* Header with Plan Details - Hotmart Style */}
      <header className="bg-white border-b border-[#e5e7eb]">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Product info */}
            <div className="flex items-center gap-4">
              <img src={logo} alt="Bateu a Meta" className="w-12 h-12 object-contain rounded-lg" />
              <div>
                <h1 className="font-semibold text-gray-900 text-lg">Bateu a Meta - {planName}</h1>
                <p className="text-sm text-gray-500">Aplicativo de Gestão para Motoristas</p>
              </div>
            </div>
            
            {/* Right side - Security badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
              <Lock className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">Checkout Seguro</span>
            </div>
          </div>
          
          {/* Price details row */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
            {planType === "anual" ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-gray-900">12x de R$ {installmentValue}</span>
                  <span className="text-gray-500">/ano</span>
                </div>
                <span className="text-gray-400">ou</span>
                <span className="text-gray-600">R$ {planPrice.toFixed(2).replace(".", ",")} à vista</span>
                <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded-full">
                  Plano Anual - Parcelado
                </span>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-gray-900">R$ {planPrice.toFixed(2).replace(".", ",")}</span>
                  <span className="text-gray-500">/mês</span>
                </div>
                <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded-full">
                  Plano Mensal
                </span>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Mobile Summary - Top */}
        <div className="md:hidden mb-6">
          <Card className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={logo} alt="Bateu a Meta" className="w-10 h-10 object-contain" />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{planName}</p>
                    <p className="text-xs text-gray-500">Bateu a Meta</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    R$ {planPrice.toFixed(2).replace(".", ",")}
                  </p>
                  {planType === "anual" && (
                    <p className="text-xs text-gray-500">ou 12x de R$ {installmentValue}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-5 gap-8">
          {/* Form Column */}
          <div className="md:col-span-3 space-y-6">
            {/* Personal Data Card */}
            <Card className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm">
              <CardContent className="p-6 space-y-5">
                <h2 className="font-semibold text-gray-900">Dados pessoais</h2>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-sm text-gray-500 font-normal">
                      Seu e-mail
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className={`mt-1.5 bg-white border-gray-200 focus:border-blue-400 focus:ring-blue-400 ${formErrors.email ? "border-red-400" : ""}`}
                    />
                    {formErrors.email && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="confirmEmail" className="text-sm text-gray-500 font-normal">
                      Confirme seu e-mail
                    </Label>
                    <Input
                      id="confirmEmail"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.confirmEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmEmail: e.target.value }))}
                      className={`mt-1.5 bg-white border-gray-200 focus:border-blue-400 focus:ring-blue-400 ${formErrors.confirmEmail ? "border-red-400" : ""}`}
                    />
                    {formErrors.confirmEmail && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.confirmEmail}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="fullName" className="text-sm text-gray-500 font-normal">
                      Nome completo
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="João da Silva"
                      value={formData.fullName}
                      onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                      className={`mt-1.5 bg-white border-gray-200 focus:border-blue-400 focus:ring-blue-400 ${formErrors.fullName ? "border-red-400" : ""}`}
                    />
                    {formErrors.fullName && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.fullName}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cpf" className="text-sm text-gray-500 font-normal">
                        CPF
                      </Label>
                      <Input
                        id="cpf"
                        type="text"
                        placeholder="000.000.000-00"
                        value={formData.cpf}
                        onChange={(e) => setFormData(prev => ({ ...prev, cpf: formatCPF(e.target.value) }))}
                        className={`mt-1.5 bg-white border-gray-200 focus:border-blue-400 focus:ring-blue-400 ${formErrors.cpf ? "border-red-400" : ""}`}
                        maxLength={14}
                      />
                      {formErrors.cpf && (
                        <p className="text-xs text-red-500 mt-1">{formErrors.cpf}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="phone" className="text-sm text-gray-500 font-normal">
                        Celular
                      </Label>
                      <div className="flex mt-1.5">
                        <div className="flex items-center bg-gray-50 border border-r-0 border-gray-200 rounded-l-md px-3">
                          <Phone className="w-3.5 h-3.5 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-500">+55</span>
                        </div>
                        <Input
                          id="phone"
                          type="text"
                          placeholder="(00) 00000-0000"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                          className={`rounded-l-none bg-white border-gray-200 focus:border-blue-400 focus:ring-blue-400 ${formErrors.phone ? "border-red-400" : ""}`}
                          maxLength={15}
                        />
                      </div>
                      {formErrors.phone && (
                        <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>
                      )}
                    </div>
                  </div>

                  {/* Coupon */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowCoupon(!showCoupon)}
                      className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {showCoupon ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                      Possui cupom de desconto?
                    </button>
                    {showCoupon && (
                      <div className="mt-2">
                        <Input
                          id="coupon"
                          type="text"
                          placeholder="Digite seu cupom"
                          value={formData.coupon}
                          onChange={(e) => setFormData(prev => ({ ...prev, coupon: e.target.value.toUpperCase() }))}
                          className="bg-white border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method Card */}
            <Card className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm">
              <CardContent className="p-6">
                <h2 className="font-semibold text-gray-900 mb-5">Forma de pagamento</h2>
                
                {/* Custom Tab Buttons */}
                <div className="flex gap-3 mb-6">
                  <button
                    onClick={() => setActiveTab("card")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all ${
                      activeTab === "card"
                        ? "border-blue-400 bg-blue-50/50 text-gray-900"
                        : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span className="text-sm font-medium">Cartão de Crédito</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("pix")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all ${
                      activeTab === "pix"
                        ? "border-blue-400 bg-blue-50/50 text-gray-900"
                        : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span className="text-sm font-medium">PIX</span>
                  </button>
                </div>

                {/* Card Tab Content */}
                {activeTab === "card" && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="cardNumber" className="text-sm text-gray-500 font-normal">
                        Número do cartão
                      </Label>
                      <div className="relative mt-1.5">
                        <Input
                          id="cardNumber"
                          type="text"
                          placeholder="0000 0000 0000 0000"
                          value={cardData.cardNumber}
                          onChange={(e) => handleCardNumberChange(e.target.value)}
                          className={`pr-16 bg-white border-gray-200 focus:border-blue-400 focus:ring-blue-400 ${cardErrors.cardNumber ? "border-red-400" : ""}`}
                          maxLength={19}
                        />
                        {cardBrand && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <span className="text-xs font-medium text-gray-400 uppercase">{cardBrand}</span>
                          </div>
                        )}
                      </div>
                      {cardErrors.cardNumber && (
                        <p className="text-xs text-red-500 mt-1">{cardErrors.cardNumber}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiry" className="text-sm text-gray-500 font-normal">
                          Validade
                        </Label>
                        <Input
                          id="expiry"
                          type="text"
                          placeholder="MM/AA"
                          value={cardData.expiry}
                          onChange={(e) => setCardData(prev => ({ ...prev, expiry: formatExpiry(e.target.value) }))}
                          className={`mt-1.5 bg-white border-gray-200 focus:border-blue-400 focus:ring-blue-400 ${cardErrors.expiry ? "border-red-400" : ""}`}
                          maxLength={5}
                        />
                        {cardErrors.expiry && (
                          <p className="text-xs text-red-500 mt-1">{cardErrors.expiry}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="cvv" className="text-sm text-gray-500 font-normal">
                          CVV
                        </Label>
                        <Input
                          id="cvv"
                          type="text"
                          placeholder="000"
                          value={cardData.cvv}
                          onChange={(e) => setCardData(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                          className={`mt-1.5 bg-white border-gray-200 focus:border-blue-400 focus:ring-blue-400 ${cardErrors.cvv ? "border-red-400" : ""}`}
                          maxLength={4}
                        />
                        {cardErrors.cvv && (
                          <p className="text-xs text-red-500 mt-1">{cardErrors.cvv}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="holderName" className="text-sm text-gray-500 font-normal">
                        Nome impresso no cartão
                      </Label>
                      <Input
                        id="holderName"
                        type="text"
                        placeholder="JOÃO DA SILVA"
                        value={cardData.holderName}
                        onChange={(e) => setCardData(prev => ({ ...prev, holderName: e.target.value.toUpperCase() }))}
                        className={`mt-1.5 bg-white border-gray-200 focus:border-blue-400 focus:ring-blue-400 ${cardErrors.holderName ? "border-red-400" : ""}`}
                      />
                      {cardErrors.holderName && (
                        <p className="text-xs text-red-500 mt-1">{cardErrors.holderName}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="installments" className="text-sm text-gray-500 font-normal">
                        Parcelas
                      </Label>
                      <select
                        id="installments"
                        value={cardData.installments}
                        onChange={(e) => setCardData(prev => ({ ...prev, installments: parseInt(e.target.value) }))}
                        className="mt-1.5 w-full h-10 px-3 border border-gray-200 rounded-md bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                      >
                        {getInstallmentOptions().map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <Button
                      onClick={handleCardPayment}
                      disabled={loading}
                      className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-semibold py-6 text-base mt-2 rounded-lg shadow-sm"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        "Finalizar Compra"
                      )}
                    </Button>
                  </div>
                )}

                {/* PIX Tab Content */}
                {activeTab === "pix" && (
                  <div className="space-y-4">
                    {!pixData ? (
                      <>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                          <p className="text-sm text-gray-600">
                            O pagamento via PIX é aprovado instantaneamente e libera seu acesso na hora!
                          </p>
                        </div>

                        <Button
                          onClick={handlePixPayment}
                          disabled={loading}
                          className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-semibold py-6 text-base rounded-lg shadow-sm"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Gerando PIX...
                            </>
                          ) : (
                            <>
                              <QrCode className="mr-2 h-5 w-5" />
                              Gerar Código PIX
                            </>
                          )}
                        </Button>
                      </>
                    ) : (
                      <>
                        {/* QR Code */}
                        <div className="flex justify-center">
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <img
                              src={`data:image/png;base64,${pixData.qr_code_base64}`}
                              alt="QR Code PIX"
                              className="w-48 h-48"
                            />
                          </div>
                        </div>

                        {/* Copy Code */}
                        <div className="space-y-2">
                          <Label className="text-sm text-gray-500 font-normal">
                            Ou copie o código PIX:
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              value={pixData.qr_code}
                              readOnly
                              className="text-xs font-mono bg-white border-gray-200"
                            />
                            <Button
                              onClick={handleCopyPixCode}
                              variant="outline"
                              className="shrink-0 border-gray-200 hover:bg-gray-50"
                            >
                              {copied ? (
                                <Check className="h-4 w-4 text-[#10b981]" />
                              ) : (
                                <Copy className="h-4 w-4 text-gray-500" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 text-amber-700 mb-2">
                            <Clock className="h-4 w-4" />
                            <span className="font-medium text-sm">Aguardando pagamento</span>
                          </div>
                          <p className="text-xs text-amber-600">
                            Após o pagamento, você receberá seu acesso automaticamente por e-mail.
                          </p>
                        </div>

                        <Button
                          variant="outline"
                          onClick={() => setPixData(null)}
                          className="w-full border-gray-200 hover:bg-gray-50 text-gray-600"
                        >
                          Gerar Novo Código
                        </Button>
                      </>
                    )}
                  </div>
                )}

                {/* Trust Badges Section */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                  {/* Security Badges Row */}
                  <div className="flex flex-wrap items-center justify-center gap-6 mb-6">
                    <div className="flex items-center gap-2">
                      <Lock className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">Checkout Seguro</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">Pagamento 100% Seguro</span>
                    </div>
                  </div>
                  
                  {/* Card Brands - Colored Logos */}
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <VisaLogo />
                    <MastercardLogo />
                    <img src={eloLogo} alt="Elo" className="h-6 w-auto object-contain" />
                    <AmexLogo />
                    <img src={hipercardLogo} alt="Hipercard" className="h-6 w-auto object-contain" />
                  </div>
                  
                  {/* Mercado Pago */}
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                    <Shield className="h-4 w-4 text-[#009EE3]" />
                    <span>Pagamento processado com segurança via</span>
                    <MercadoPagoLogo />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Column - Desktop Only */}
          <div className="hidden md:block md:col-span-2">
            <Card className="sticky top-4 bg-white border border-[#e5e7eb] rounded-xl shadow-sm">
              <CardContent className="p-6 space-y-5">
                <h2 className="font-semibold text-gray-900">Resumo da compra</h2>
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <img src={logo} alt="Bateu a Meta" className="w-12 h-12 object-contain" />
                  <div>
                    <p className="font-medium text-gray-900">{planName}</p>
                    <p className="text-sm text-gray-500">Bateu a Meta</p>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">R$ {planPrice.toFixed(2).replace(".", ",")}</span>
                  </div>
                  {formData.coupon && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Cupom: {formData.coupon}</span>
                      <span className="text-[#10b981]">-R$ 0,00</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-gray-900">Total</span>
                    <div className="text-right">
                      <p className="font-bold text-xl text-gray-900">
                        R$ {planPrice.toFixed(2).replace(".", ",")}
                      </p>
                      {planType === "anual" && (
                        <p className="text-xs text-gray-500">
                          ou 12x de R$ {installmentValue}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Security badges in summary */}
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Lock className="h-4 w-4 text-green-600" />
                      <span>Checkout Seguro</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <ShieldCheck className="h-4 w-4 text-green-600" />
                      <span>Pagamento 100% Seguro</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinalizarAssinatura;
