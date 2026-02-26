import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@/assets/bateu-a-meta-logo.png";
import { z } from "zod";
import { useFacebookPixel } from "@/hooks/useFacebookPixel";
import { useGoogleAds } from "@/hooks/useGoogleAds";

const registrationSchema = z.object({
  nomeCompleto: z.string().min(2, "Nome completo é obrigatório"),
  telefone: z.string().regex(/^\(\d{2}\)\s\d{5}-\d{4}$/, "Telefone deve estar no formato (XX) XXXXX-XXXX"),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF deve estar no formato XXX.XXX.XXX-XX"),
  senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  confirmarSenha: z.string(),
}).refine((data) => data.senha === data.confirmarSenha, {
  message: "As senhas não coincidem",
  path: ["confirmarSenha"],
});

const isValidCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, "");
  if (cleanCPF.length !== 11 || /^(\d)\1+$/.test(cleanCPF)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cleanCPF[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF[9])) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cleanCPF[i]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  return remainder === parseInt(cleanCPF[10]);
};

const PagamentoSucesso = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { trackAddPaymentInfo } = useFacebookPixel();
  const { trackConversion } = useGoogleAds();
  const sessionId = searchParams.get("session_id");
  const hasTrackedPixel = useRef(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPendingRegistration = async () => {
      if (!sessionId) {
        setError("Sessão de pagamento não encontrada");
        setLoading(false);
        return;
      }

      try {
        // Use secure edge function instead of direct database query
        const { data, error } = await supabase.functions.invoke("get-pending-registration", {
          body: { session_id: sessionId },
        });

        if (error) {
          console.error("Error fetching pending registration:", error);
          setError("Registro de pagamento não encontrado ou já utilizado");
          setLoading(false);
          return;
        }

        if (data?.error) {
          setError(data.error);
          setLoading(false);
          return;
        }

        setEmail(data.email);
        
        // Dispara evento AddPaymentInfo quando carrega com sucesso
        if (!hasTrackedPixel.current) {
          trackAddPaymentInfo(data.plan_type || 'Premium', 29.90);
          trackConversion(sessionId || undefined);
          hasTrackedPixel.current = true;
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error:", err);
        setError("Erro ao carregar dados do pagamento");
        setLoading(false);
      }
    };

    fetchPendingRegistration();
  }, [sessionId]);

  const formatTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 11);
    if (numbers.length <= 2) return numbers.length ? `(${numbers}` : "";
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 11);
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      registrationSchema.parse({ nomeCompleto, telefone, cpf, senha, confirmarSenha });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Erro de validação",
          description: error.errors[0].message,
        });
        return;
      }
    }

    if (!isValidCPF(cpf)) {
      toast({
        variant: "destructive",
        title: "CPF inválido",
        description: "Por favor, verifique o CPF informado.",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("complete-registration", {
        body: {
          session_id: sessionId,
          nome_completo: nomeCompleto,
          telefone: telefone.replace(/\D/g, ""),
          cpf: cpf.replace(/\D/g, ""),
          senha: senha,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Conta criada com sucesso!",
        description: "Fazendo login automaticamente...",
      });

      // Auto login
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: senha,
      });

      if (signInError) {
        toast({
          title: "Conta criada!",
          description: "Faça login com suas credenciais.",
        });
        navigate("/auth");
      } else {
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error("Error completing registration:", error);
      toast({
        variant: "destructive",
        title: "Erro ao criar conta",
        description: error.message || "Tente novamente mais tarde",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-6">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Carregando dados do pagamento...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto mb-4 p-4 rounded-full bg-destructive/10 w-fit">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-xl text-destructive">Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => navigate("/planos")} className="w-full">
              Voltar para Planos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <img 
              src={logoImage} 
              alt="Bateu a Meta" 
              className="w-20 h-20 rounded-full object-cover mx-auto"
            />
          </div>
          <div className="mx-auto mb-4 p-4 rounded-full bg-green-500/10 w-fit">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>
          <CardTitle className="text-2xl text-green-500">
            Pagamento Confirmado!
          </CardTitle>
          <CardDescription className="text-base">
            Complete seu cadastro para acessar o app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nomeCompleto">Nome Completo</Label>
              <Input
                id="nomeCompleto"
                type="text"
                value={nomeCompleto}
                onChange={(e) => setNomeCompleto(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                type="text"
                value={cpf}
                onChange={(e) => setCpf(formatCPF(e.target.value))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(formatTelefone(e.target.value))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmarSenha">Confirmar Senha</Label>
              <Input
                id="confirmarSenha"
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                "Criar Conta e Acessar"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PagamentoSucesso;
