import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mail, Loader2, ArrowLeft, CreditCard, QrCode, Copy, Check, Clock } from "lucide-react";
import logo from "@/assets/bateu-a-meta-logo.png";

type PlanType = "mensal" | "anual";
type PaymentMethod = "pix" | "card" | null;
type Step = "email" | "method" | "pix";

interface PixData {
  payment_id: string;
  qr_code: string;
  qr_code_base64: string;
  ticket_url: string;
  expiration_date: string;
}

const FinalizarAssinatura = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>("email");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [copied, setCopied] = useState(false);

  const planType = searchParams.get("planType") as PlanType | null;
  const planName = planType === "anual" ? "Anual" : "Mensal";
  const planPrice = planType === "anual" ? "R$ 97,90/ano" : "R$ 12,90/mês";

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !isValidEmail(email)) {
      toast.error("Por favor, insira um e-mail válido.");
      return;
    }

    if (!planType || !["mensal", "anual"].includes(planType)) {
      toast.error("Plano inválido. Por favor, volte e selecione novamente.");
      return;
    }

    setStep("method");
  };

  const handleMethodSelect = async (method: PaymentMethod) => {
    setPaymentMethod(method);
    
    if (method === "card") {
      // Redireciona para checkout do Mercado Pago (cartão)
      await handleCardPayment();
    } else if (method === "pix") {
      // Gera pagamento PIX diretamente
      await handlePixPayment();
    }
  };

  const handleCardPayment = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-mp-preference", {
        body: { planType, email },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("URL de checkout não retornada");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error("Erro ao processar. Tente novamente.");
      setPaymentMethod(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePixPayment = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-mp-pix-payment", {
        body: { planType, email },
      });

      if (error) throw error;

      if (data?.qr_code && data?.qr_code_base64) {
        setPixData(data);
        setStep("pix");
      } else {
        throw new Error("Dados do PIX não retornados");
      }
    } catch (error: any) {
      console.error("PIX error:", error);
      toast.error("Erro ao gerar PIX. Tente novamente.");
      setPaymentMethod(null);
    } finally {
      setLoading(false);
    }
  };

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

  const handleBackToMethods = () => {
    setStep("method");
    setPaymentMethod(null);
    setPixData(null);
  };

  const handleBackToEmail = () => {
    setStep("email");
    setPaymentMethod(null);
    setPixData(null);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <img src={logo} alt="Bateu a Meta" className="w-16 h-16 object-contain" />
        </div>

        {/* Step 1: Email */}
        {step === "email" && (
          <Card className="border-gray-200 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-black">
                Finalizar Assinatura
              </CardTitle>
              <CardDescription className="text-gray-600">
                {planType ? (
                  <>Plano <span className="font-semibold text-brand-blue">{planName}</span> - {planPrice}</>
                ) : (
                  "Informe seu e-mail para continuar"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Seu melhor e-mail
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Você receberá seu acesso neste e-mail após a confirmação do pagamento.
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-[#15a249] hover:bg-[#128a3d] text-white font-bold py-6"
                >
                  Continuar
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-gray-600"
                  onClick={() => navigate("/")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Payment Method Selection */}
        {step === "method" && (
          <Card className="border-gray-200 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-black">
                Escolha a Forma de Pagamento
              </CardTitle>
              <CardDescription className="text-gray-600">
                Plano <span className="font-semibold text-brand-blue">{planName}</span> - {planPrice}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => handleMethodSelect("pix")}
                disabled={loading}
                variant="outline"
                className="w-full h-20 flex items-center justify-between px-6 border-2 hover:border-[#15a249] hover:bg-green-50 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#32BCAD] rounded-full flex items-center justify-center">
                    <QrCode className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-black">PIX</p>
                    <p className="text-sm text-gray-500">Aprovação instantânea</p>
                  </div>
                </div>
                {loading && paymentMethod === "pix" && (
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                )}
              </Button>

              <Button
                onClick={() => handleMethodSelect("card")}
                disabled={loading}
                variant="outline"
                className="w-full h-20 flex items-center justify-between px-6 border-2 hover:border-[#3c83f6] hover:bg-blue-50 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#3c83f6] rounded-full flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-black">Cartão de Crédito</p>
                    <p className="text-sm text-gray-500">Parcelamento disponível</p>
                  </div>
                </div>
                {loading && paymentMethod === "card" && (
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full text-gray-600"
                onClick={handleBackToEmail}
                disabled={loading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: PIX Payment */}
        {step === "pix" && pixData && (
          <Card className="border-gray-200 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-black">
                Pague com PIX
              </CardTitle>
              <CardDescription className="text-gray-600">
                Plano <span className="font-semibold text-brand-blue">{planName}</span> - {planPrice}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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

              {/* Copia e Cola */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block text-center">
                  Ou copie o código PIX:
                </label>
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

              {/* Status info */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-amber-700 mb-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium text-sm">Aguardando pagamento</span>
                </div>
                <p className="text-xs text-amber-600">
                  Após o pagamento, você receberá seu acesso automaticamente por e-mail.
                </p>
              </div>

              {/* Incentive message */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-sm text-green-700 font-medium">
                  ✅ O pagamento via PIX é aprovado instantaneamente e libera seu acesso na hora!
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                className="w-full text-gray-600"
                onClick={handleBackToMethods}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Escolher outra Forma de Pagamento
              </Button>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-gray-500 mt-4">
          Pagamento seguro processado pelo Mercado Pago
        </p>
      </div>
    </div>
  );
};

export default FinalizarAssinatura;
