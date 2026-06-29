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
import { CheckCircle, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Capacitor } from "@capacitor/core";

const Auth = () => {
  const { t } = useTranslation();
  const authSchema = z.object({
    email: z.string().email(t("auth.invalidEmail")),
    password: z.string().min(4, t("auth.invalidPassword")),
  });
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const paymentSuccess = searchParams.get("payment_success") === "true";
  const navigate = useNavigate();
  const { toast } = useToast();

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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("auth.errEmailRequired"),
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
          title: t("common.error"),
          description: error.message,
        });
      } else {
        toast({
          title: t("auth.emailSent"),
          description: t("auth.emailSentDesc"),
        });
        setIsForgotPassword(false);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("auth.errUnexpected"),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      authSchema.parse({ email, password });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: t("auth.errValidation"),
          description: error.errors[0].message,
        });
        return;
      }
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            variant: "destructive",
            title: t("auth.errLogin"),
            description: t("auth.errInvalidCreds"),
          });
        } else {
          toast({
            variant: "destructive",
            title: t("auth.errLogin"),
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
            title: t("auth.loginOk"),
            description: t("auth.welcomeBack"),
          });
          navigate("/dashboard");
        } else {
          toast({
            title: t("auth.loginOkChoosePlan"),
            description: t("auth.choosePlan"),
          });
          navigate("/planos");
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("auth.errUnexpected"),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'apple') => {
    try {
      setLoading(true);
      const isNative = Capacitor.isNativePlatform();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: isNative ? 'br.com.foconameta.app://auth-callback' : `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message || t("auth.errUnexpected"),
      });
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md flex flex-col items-center relative">
        <Button 
          variant="ghost" 
          className="absolute -top-12 left-0 text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para o site
        </Button>
        <img 
          src={logoImage} 
          alt="Meu Faturamento App" 
          className="w-48 h-48 md:w-64 md:h-64 rounded-full object-cover mb-4"
        />
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 text-center w-full">Meu Faturamento App</h1>
        
        {paymentSuccess && (
          <Card className="w-full mb-4 border-green-500 bg-green-500/10">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-500 flex-shrink-0" />
                <div>
                  <p className="font-bold text-green-500">{t("auth.paymentConfirmed")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("auth.paymentConfirmedDesc")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card className="w-full">
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl md:text-4xl font-bold text-center">
              {isForgotPassword ? t("auth.forgotTitle") : t("auth.title")}
            </CardTitle>
            <CardDescription className="text-center">
              {isForgotPassword ? t("auth.forgotSubtitle") : t("auth.subtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isForgotPassword ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t("auth.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t("auth.sending") : t("auth.sendReset")}
                </Button>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(false)}
                    className="text-primary hover:underline text-sm"
                  >
                    {t("auth.backToLogin")}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("auth.email")}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">{t("auth.password")}</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-primary hover:underline text-sm"
                    >
                      {t("auth.forgotLink")}
                    </button>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? t("auth.processing") : t("auth.submit")}
                  </Button>
                </form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground font-medium">
                      OU
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full h-12 bg-white text-black hover:bg-gray-100 hover:text-black border-gray-200 shadow-sm"
                    onClick={() => handleOAuthLogin('google')}
                    disabled={loading}
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Entrar com Google
                  </Button>

                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full h-12 bg-black text-white hover:bg-gray-900 hover:text-white border-gray-800 shadow-sm"
                    onClick={() => handleOAuthLogin('apple')}
                    disabled={loading}
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                      <path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.15 2.67.72 3.4 1.8-3.12 1.83-2.61 5.96.48 7.15-.75 1.8-1.57 3.33-2.53 4.06zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.02 4.69-3.74 4.25z"/>
                    </svg>
                    Entrar com Apple
                  </Button>
                </div>

                <div className="mt-4 text-center text-sm text-muted-foreground">
                  <p>{t("auth.notClient")}</p>
                  <button
                    onClick={() => navigate("/#pricing")}
                    className="text-primary hover:underline font-medium"
                  >
                    {t("auth.subscribeCta")}
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
