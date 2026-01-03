import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Phone
} from "lucide-react";
import logo from "@/assets/bateu-a-meta-logo.png";

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
  const [activeTab, setActiveTab] = useState("card");
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
        body: { planType, email: formData.email },
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
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600">Plano não selecionado.</p>
            <Button onClick={() => navigate("/planos")} className="mt-4">
              Ver Planos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Bateu a Meta" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="font-bold text-gray-900">{planName}</h1>
              <p className="text-sm text-gray-500">Bateu a Meta</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">
              {planType === "anual" ? "12x de" : ""}
            </p>
            <p className="text-2xl font-bold text-[#15a249]">
              R$ {installmentValue}
            </p>
            {planType === "anual" && (
              <p className="text-xs text-gray-500">ou R$ 97,90 à vista</p>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-5 gap-8">
          {/* Form Column */}
          <div className="md:col-span-3 space-y-6">
            {/* Personal Data */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <h2 className="font-bold text-gray-900 text-lg">Dados pessoais</h2>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Seu e-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className={formErrors.email ? "border-red-500" : ""}
                    />
                    {formErrors.email && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="confirmEmail">Confirme seu e-mail</Label>
                    <Input
                      id="confirmEmail"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.confirmEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmEmail: e.target.value }))}
                      className={formErrors.confirmEmail ? "border-red-500" : ""}
                    />
                    {formErrors.confirmEmail && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.confirmEmail}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="fullName">Nome completo</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="João da Silva"
                      value={formData.fullName}
                      onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                      className={formErrors.fullName ? "border-red-500" : ""}
                    />
                    {formErrors.fullName && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.fullName}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        type="text"
                        placeholder="000.000.000-00"
                        value={formData.cpf}
                        onChange={(e) => setFormData(prev => ({ ...prev, cpf: formatCPF(e.target.value) }))}
                        className={formErrors.cpf ? "border-red-500" : ""}
                        maxLength={14}
                      />
                      {formErrors.cpf && (
                        <p className="text-xs text-red-500 mt-1">{formErrors.cpf}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="phone">Celular</Label>
                      <div className="flex">
                        <div className="flex items-center bg-gray-100 border border-r-0 border-gray-300 rounded-l-md px-3">
                          <Phone className="w-4 h-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-600">+55</span>
                        </div>
                        <Input
                          id="phone"
                          type="text"
                          placeholder="(00) 00000-0000"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                          className={`rounded-l-none ${formErrors.phone ? "border-red-500" : ""}`}
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
                      className="flex items-center text-sm text-[#15a249] hover:underline"
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
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="font-bold text-gray-900 text-lg mb-4">Forma de pagamento</h2>
                
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="card" className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Cartão de Crédito
                    </TabsTrigger>
                    <TabsTrigger value="pix" className="flex items-center gap-2">
                      <QrCode className="w-4 h-4" />
                      PIX
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="card" className="space-y-4">
                    <div>
                      <Label htmlFor="cardNumber">Número do cartão</Label>
                      <div className="relative">
                        <Input
                          id="cardNumber"
                          type="text"
                          placeholder="0000 0000 0000 0000"
                          value={cardData.cardNumber}
                          onChange={(e) => handleCardNumberChange(e.target.value)}
                          className={`pr-12 ${cardErrors.cardNumber ? "border-red-500" : ""}`}
                          maxLength={19}
                        />
                        {cardBrand && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <span className="text-xs font-medium text-gray-500 uppercase">{cardBrand}</span>
                          </div>
                        )}
                      </div>
                      {cardErrors.cardNumber && (
                        <p className="text-xs text-red-500 mt-1">{cardErrors.cardNumber}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiry">Validade</Label>
                        <Input
                          id="expiry"
                          type="text"
                          placeholder="MM/AA"
                          value={cardData.expiry}
                          onChange={(e) => setCardData(prev => ({ ...prev, expiry: formatExpiry(e.target.value) }))}
                          className={cardErrors.expiry ? "border-red-500" : ""}
                          maxLength={5}
                        />
                        {cardErrors.expiry && (
                          <p className="text-xs text-red-500 mt-1">{cardErrors.expiry}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="cvv">CVV</Label>
                        <Input
                          id="cvv"
                          type="text"
                          placeholder="000"
                          value={cardData.cvv}
                          onChange={(e) => setCardData(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                          className={cardErrors.cvv ? "border-red-500" : ""}
                          maxLength={4}
                        />
                        {cardErrors.cvv && (
                          <p className="text-xs text-red-500 mt-1">{cardErrors.cvv}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="holderName">Nome impresso no cartão</Label>
                      <Input
                        id="holderName"
                        type="text"
                        placeholder="JOÃO DA SILVA"
                        value={cardData.holderName}
                        onChange={(e) => setCardData(prev => ({ ...prev, holderName: e.target.value.toUpperCase() }))}
                        className={cardErrors.holderName ? "border-red-500" : ""}
                      />
                      {cardErrors.holderName && (
                        <p className="text-xs text-red-500 mt-1">{cardErrors.holderName}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="installments">Parcelas</Label>
                      <select
                        id="installments"
                        value={cardData.installments}
                        onChange={(e) => setCardData(prev => ({ ...prev, installments: parseInt(e.target.value) }))}
                        className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#15a249]"
                      >
                        {getInstallmentOptions().map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <Button
                      onClick={handleCardPayment}
                      disabled={loading}
                      className="w-full bg-[#15a249] hover:bg-[#128a3d] text-white font-bold py-6 text-lg"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-5 w-5" />
                          Finalizar Compra
                        </>
                      )}
                    </Button>
                  </TabsContent>

                  <TabsContent value="pix" className="space-y-4">
                    {!pixData ? (
                      <>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                          <p className="text-sm text-green-700 font-medium">
                            ✅ O pagamento via PIX é aprovado instantaneamente e libera seu acesso na hora!
                          </p>
                        </div>

                        <Button
                          onClick={handlePixPayment}
                          disabled={loading}
                          className="w-full bg-[#32BCAD] hover:bg-[#2aa89a] text-white font-bold py-6 text-lg"
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
                          <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                            <img
                              src={`data:image/png;base64,${pixData.qr_code_base64}`}
                              alt="QR Code PIX"
                              className="w-48 h-48"
                            />
                          </div>
                        </div>

                        {/* Copy Code */}
                        <div className="space-y-2">
                          <Label>Ou copie o código PIX:</Label>
                          <div className="flex gap-2">
                            <Input
                              value={pixData.qr_code}
                              readOnly
                              className="text-xs font-mono"
                            />
                            <Button
                              onClick={handleCopyPixCode}
                              variant="outline"
                              className="shrink-0"
                            >
                              {copied ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
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
                          className="w-full"
                        >
                          Gerar Novo Código
                        </Button>
                      </>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Summary Column */}
          <div className="md:col-span-2">
            <Card className="sticky top-4">
              <CardContent className="pt-6 space-y-4">
                <h2 className="font-bold text-gray-900 text-lg">Resumo da compra</h2>
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <img src={logo} alt="Bateu a Meta" className="w-12 h-12 object-contain" />
                  <div>
                    <p className="font-medium text-gray-900">{planName}</p>
                    <p className="text-sm text-gray-500">Bateu a Meta</p>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">R$ {planPrice.toFixed(2).replace(".", ",")}</span>
                  </div>
                  {formData.coupon && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Cupom: {formData.coupon}</span>
                      <span className="text-green-600">-R$ 0,00</span>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-900">Total</span>
                    <div className="text-right">
                      <p className="font-bold text-xl text-[#15a249]">
                        R$ {planPrice.toFixed(2).replace(".", ",")}
                      </p>
                      {planType === "anual" && (
                        <p className="text-xs text-gray-500">ou 12x de R$ {installmentValue}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500 pt-4 border-t">
                  <Shield className="h-4 w-4" />
                  <span>Pagamento 100% seguro</span>
                </div>

                <p className="text-xs text-gray-400 text-center">
                  Processado por Mercado Pago
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinalizarAssinatura;
