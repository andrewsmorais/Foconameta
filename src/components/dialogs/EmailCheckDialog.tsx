import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, MessageCircle, Instagram, PartyPopper } from "lucide-react";

const emailSchema = z.object({
  email: z.string().trim().email({ message: "Email inválido" }).max(255),
});

type EmailFormData = z.infer<typeof emailSchema>;

interface EmailCheckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planType: "mensal" | "anual";
  onProceedToCheckout: (email: string) => void;
}

export function EmailCheckDialog({ 
  open, 
  onOpenChange, 
  planType, 
  onProceedToCheckout 
}: EmailCheckDialogProps) {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [userName, setUserName] = useState("");
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);
  const [checkedEmail, setCheckedEmail] = useState("");
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);

  const form = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const handleCheckEmail = async (data: EmailFormData) => {
    setIsChecking(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("check-email-subscription", {
        body: { email: data.email },
      });

      if (error) throw error;

      if (result.hasActiveSubscription) {
        setHasActiveSubscription(true);
        setUserName(result.userName || "");
        setStripeCustomerId(result.stripeCustomerId);
        setCheckedEmail(data.email);
      } else {
        // No active subscription, proceed to checkout
        onProceedToCheckout(data.email);
        onOpenChange(false);
        resetDialog();
      }
    } catch (error) {
      console.error("Error checking email:", error);
      toast({
        title: "Erro",
        description: "Não foi possível verificar o email. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleLogin = () => {
    onOpenChange(false);
    resetDialog();
    navigate("/auth");
  };

  const handleManagePlan = async () => {
    setIsLoadingPortal(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("create-billing-portal", {
        body: { stripeCustomerId, email: checkedEmail },
      });

      if (error) throw error;

      if (result.url) {
        window.location.href = result.url;
      } else {
        throw new Error("URL do portal não retornada");
      }
    } catch (error) {
      console.error("Error creating billing portal:", error);
      toast({
        title: "Erro",
        description: "Não foi possível abrir o portal de gerenciamento. Entre em contato pelo WhatsApp.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPortal(false);
    }
  };

  const resetDialog = () => {
    setHasActiveSubscription(false);
    setUserName("");
    setStripeCustomerId(null);
    setCheckedEmail("");
    form.reset();
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetDialog();
    }
    onOpenChange(newOpen);
  };

  const planLabel = planType === "mensal" ? "Mensal R$ 12,90" : "Anual R$ 97,90";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-[#121212] border-border/50 text-foreground max-w-md">
        {!hasActiveSubscription ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-center">
                Assinar Plano {planLabel}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-muted-foreground text-center mb-6">
                Informe seu email para continuar com a assinatura
              </p>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCheckEmail)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            className="bg-background/50 border-border"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full bg-[#3c83f6] hover:bg-[#3c83f6]/90 text-white"
                    disabled={isChecking}
                  >
                    {isChecking ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      "Continuar"
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-center flex items-center justify-center gap-2">
                <PartyPopper className="h-6 w-6 text-[#3c83f6]" />
                Você já possui uma assinatura ativa!
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-6">
              <p className="text-muted-foreground text-center">
                {userName ? `Olá, ${userName}! ` : ""}
                Identificamos que seu e-mail já tem acesso Premium liberado. 
                Você pode entrar direto no Dashboard ou gerenciar seu plano atual.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleLogin}
                  className="flex-1 bg-[#3c83f6] hover:bg-[#3c83f6]/90 text-white"
                >
                  Fazer Login
                </Button>
                <Button
                  onClick={handleManagePlan}
                  variant="outline"
                  className="flex-1 border-[#3c83f6] text-[#3c83f6] hover:bg-[#3c83f6]/10"
                  disabled={isLoadingPortal}
                >
                  {isLoadingPortal ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    "Gerenciar Plano"
                  )}
                </Button>
              </div>

              <div className="border-t border-border/50 pt-4">
                <p className="text-sm text-muted-foreground text-center mb-3">
                  Ainda tem dúvidas?
                </p>
                <div className="flex justify-center gap-4">
                  <a
                    href="https://wa.me/5512981796135"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span>WhatsApp</span>
                  </a>
                  <a
                    href="https://instagram.com/bateu_meta"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white transition-colors"
                  >
                    <Instagram className="h-5 w-5" />
                    <span>Instagram</span>
                  </a>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
