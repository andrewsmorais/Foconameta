import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mail, Loader2, ArrowLeft } from "lucide-react";
import logo from "@/assets/bateu-a-meta-logo.png";

type PlanType = "mensal" | "anual";

const FinalizarAssinatura = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const planType = searchParams.get("planType") as PlanType | null;
  const planName = planType === "anual" ? "Anual" : "Mensal";
  const planPrice = planType === "anual" ? "R$ 97,90/ano" : "R$ 12,90/mês";

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !isValidEmail(email)) {
      toast.error("Por favor, insira um e-mail válido.");
      return;
    }

    if (!planType || !["mensal", "anual"].includes(planType)) {
      toast.error("Plano inválido. Por favor, volte e selecione novamente.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-mp-checkout", {
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <img src={logo} alt="Bateu a Meta" className="w-16 h-16 object-contain" />
        </div>

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
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Você receberá seu acesso neste e-mail após a confirmação do pagamento.
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-[#15a249] hover:bg-[#128a3d] text-white font-bold py-6"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Continuar para pagamento"
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full text-gray-600"
                onClick={() => navigate("/")}
                disabled={loading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-500 mt-4">
          Pagamento seguro processado pelo Mercado Pago
        </p>
      </div>
    </div>
  );
};

export default FinalizarAssinatura;
