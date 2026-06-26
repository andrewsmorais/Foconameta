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
import { CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md flex flex-col items-center">
        <img 
          src={logoImage} 
          alt="Foco na Meta" 
          className="w-48 h-48 md:w-64 md:h-64 rounded-full object-cover mb-4"
        />
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Foco na Meta</h1>
        
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
