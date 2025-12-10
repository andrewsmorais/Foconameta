import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import logoImage from "@/assets/bateu-a-meta-logo.png";

const authSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

const signupSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  nomeCompleto: z.string().min(2, "Nome completo é obrigatório"),
  telefone: z.string().regex(/^\(\d{2}\)\s\d{5}-\d{4}$/, "Telefone deve estar no formato (XX) XXXXX-XXXX"),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF deve estar no formato XXX.XXX.XXX-XX"),
});

// CPF validation function
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

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if user came from plan selection
  const hasPlanSelected = searchParams.get("plan") !== null;

  useEffect(() => {
    const checkAuthAndSubscription = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase.functions.invoke("check-subscription", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        
        if (data?.hasActiveSubscription) {
          navigate("/dashboard");
        } else {
          navigate("/planos");
        }
      }
    };
    
    checkAuthAndSubscription();
  }, [navigate]);

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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, informe seu email",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: error.message,
        });
      } else {
        toast({
          title: "Email enviado!",
          description: "Verifique sua caixa de entrada para redefinir sua senha",
        });
        setIsForgotPassword(false);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro inesperado",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignupAttempt = () => {
    if (!hasPlanSelected) {
      toast({
        variant: "destructive",
        title: "🚨 Escolha um plano de assinatura",
        description: "Para continuar o cadastro, você precisa escolher um plano primeiro.",
      });
      navigate("/#pricing");
      return false;
    }
    return true;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLogin) {
      try {
        authSchema.parse({ email, password });
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
    } else {
      // Check if user has selected a plan
      if (!handleSignupAttempt()) return;

      try {
        signupSchema.parse({ email, password, nomeCompleto, telefone, cpf });
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

      // Validate CPF digits
      if (!isValidCPF(cpf)) {
        toast({
          variant: "destructive",
          title: "CPF inválido",
          description: "Por favor, verifique o CPF informado.",
        });
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              variant: "destructive",
              title: "Erro ao fazer login",
              description: "Email ou senha incorretos",
            });
          } else {
            toast({
              variant: "destructive",
              title: "Erro ao fazer login",
              description: error.message,
            });
          }
        } else {
          const { data: subData } = await supabase.functions.invoke("check-subscription", {
            headers: {
              Authorization: `Bearer ${data.session?.access_token}`,
            },
          });

          if (subData?.hasActiveSubscription) {
            toast({
              title: "Login realizado com sucesso!",
              description: "Bem-vindo de volta",
            });
            navigate("/dashboard");
          } else {
            toast({
              title: "Login realizado!",
              description: "Escolha seu plano para continuar",
            });
            navigate("/planos");
          }
        }
      } else {
        const redirectUrl = `${window.location.origin}/planos`;
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              nome_completo: nomeCompleto,
              telefone: telefone.replace(/\D/g, ""),
              cpf: cpf.replace(/\D/g, ""),
            },
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              variant: "destructive",
              title: "Erro ao criar conta",
              description: "Este email já está cadastrado",
            });
          } else {
            toast({
              variant: "destructive",
              title: "Erro ao criar conta",
              description: error.message,
            });
          }
        } else {
          if (data.session) {
            // Update profile with additional data
            await supabase.from("profiles").upsert({
              id: data.user?.id,
              nome_completo: nomeCompleto,
              telefone: telefone.replace(/\D/g, ""),
              cpf: cpf.replace(/\D/g, ""),
            });

            toast({
              title: "Conta criada com sucesso!",
              description: "Escolha seu plano para continuar",
            });
            navigate("/planos");
          } else {
            toast({
              title: "Conta criada!",
              description: "Verifique seu email para confirmar sua conta e depois escolha seu plano",
            });
            setIsLogin(true);
          }
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro inesperado",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md flex flex-col items-center">
        <img 
          src={logoImage} 
          alt="Bateu a Meta" 
          className="w-48 h-48 md:w-64 md:h-64 rounded-full object-cover mb-4"
        />
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Bateu a Meta</h1>
        <Card className="w-full">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl md:text-4xl font-bold text-center">
            {isForgotPassword ? "Recuperar Senha" : isLogin ? "Entrar" : "Criar Conta"}
          </CardTitle>
          <CardDescription className="text-center">
            {isForgotPassword
              ? "Digite seu email para receber o link de recuperação"
              : isLogin
              ? "Entre com suas credenciais para acessar o dashboard"
              : "Preencha seus dados para criar sua conta"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Enviando..." : "Enviar Link de Recuperação"}
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(false)}
                  className="text-primary hover:underline text-sm"
                >
                  Voltar ao login
                </button>
              </div>
            </form>
          ) : (
            <>
              <form onSubmit={handleAuth} className="space-y-4">
                {!isLogin && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="nomeCompleto">Nome Completo</Label>
                      <Input
                        id="nomeCompleto"
                        type="text"
                        value={nomeCompleto}
                        onChange={(e) => setNomeCompleto(e.target.value)}
                        required={!isLogin}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input
                        id="telefone"
                        type="tel"
                        value={telefone}
                        onChange={(e) => setTelefone(formatTelefone(e.target.value))}
                        required={!isLogin}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        type="text"
                        value={cpf}
                        onChange={(e) => setCpf(formatCPF(e.target.value))}
                        required={!isLogin}
                      />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {isLogin && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-primary hover:underline text-sm"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                )}
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || (!isLogin && !hasPlanSelected)}
                  onClick={(e) => {
                    if (!isLogin && !hasPlanSelected) {
                      e.preventDefault();
                      handleSignupAttempt();
                    }
                  }}
                >
                  {loading ? "Processando..." : isLogin ? "Entrar" : "Criar Conta"}
                </Button>
                {!isLogin && !hasPlanSelected && (
                  <p className="text-sm text-destructive text-center">
                    Escolha um plano de assinatura para continuar o cadastro
                  </p>
                )}
              </form>

              <div className="mt-4 text-center text-sm">
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary hover:underline"
                >
                  {isLogin
                    ? "Não tem uma conta? Criar conta"
                    : "Já tem uma conta? Entrar"}
                </button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default Auth;
