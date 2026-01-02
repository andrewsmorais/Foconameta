import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN");
const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
const FB_ACCESS_TOKEN = Deno.env.get("FB_ACCESS_TOKEN");
const FB_PIXEL_ID = "1290319795205025";
const APP_URL = "https://bateuameta.lovable.app";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Função auxiliar para hash SHA256 (requisito do Facebook)
async function hashSHA256(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Função para enviar evento para Facebook Conversions API
async function sendFacebookConversionEvent(
  eventName: string,
  email: string,
  value: number,
  currency: string = "BRL"
) {
  if (!FB_ACCESS_TOKEN) {
    console.log("[FB Conversions API] Token não configurado, pulando envio");
    return;
  }

  const hashedEmail = await hashSHA256(email.toLowerCase().trim());

  const eventData = {
    data: [{
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      action_source: "website",
      user_data: {
        em: [hashedEmail],
      },
      custom_data: {
        value: value,
        currency: currency,
      },
    }],
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${FB_PIXEL_ID}/events?access_token=${FB_ACCESS_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      }
    );
    
    const result = await response.json();
    
    if (response.ok) {
      console.log("[FB Conversions API] Evento enviado com sucesso:", eventName, result);
    } else {
      console.error("[FB Conversions API] Erro ao enviar evento:", result);
    }
  } catch (error) {
    console.error("[FB Conversions API] Erro de conexão:", error);
  }
}

async function sendWelcomeEmail(email: string, password: string, nome: string) {
  if (!BREVO_API_KEY) {
    console.error("[Email] BREVO_API_KEY not configured");
    return;
  }

  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">
          Olá, ${nome}! 🎉
        </h1>
        <p style="font-size: 18px; color: #333; line-height: 1.6;">
          Seu pagamento foi aprovado com sucesso.<br/>
          Veja como começar:
        </p>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 25px; border-radius: 10px; margin-bottom: 25px; border-left: 4px solid #15a249;">
        <h2 style="color: #333; margin-bottom: 15px; font-size: 18px;">1. SEU LOGIN:</h2>
        <p style="font-size: 16px; margin: 10px 0; color: #333;">
          <strong>Usuário:</strong> ${email}
        </p>
        <p style="font-size: 16px; margin: 10px 0; color: #333;">
          <strong>Senha:</strong> ${password}
        </p>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 25px; border-radius: 10px; margin-bottom: 25px; border-left: 4px solid #3c83f6;">
        <h2 style="color: #333; margin-bottom: 15px; font-size: 18px;">2. O QUE FAZER AGORA:</h2>
        <ul style="font-size: 16px; color: #333; line-height: 2; padding-left: 20px; margin: 0;">
          <li>Clique no botão abaixo para logar.</li>
          <li>Cadastre seu veículo e seu primeiro turno.</li>
          <li>Acompanhe seu lucro real no Dashboard.</li>
        </ul>
      </div>
      
      <div style="background-color: #fff3cd; padding: 20px; border-radius: 10px; margin-bottom: 25px; border-left: 4px solid #ffc107;">
        <h2 style="color: #856404; margin-bottom: 10px; font-size: 16px;">⚠️ IMPORTANTE - PAGAMENTO ÚNICO:</h2>
        <p style="font-size: 14px; color: #856404; margin: 0;">
          Você adquiriu um pagamento único (PIX/Boleto). Quando seu plano expirar, você precisará renovar manualmente.
        </p>
      </div>
      
      <div style="text-align: center; margin: 35px 0;">
        <a href="${APP_URL}/auth" style="display: inline-block; background-color: #3c83f6; color: white; padding: 18px 50px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold;">
          🚀 ENTRAR NO APLICATIVO
        </a>
      </div>
      
      <div style="border-top: 2px solid #eee; padding-top: 25px; text-align: center;">
        <p style="color: #333; font-size: 16px; margin-bottom: 15px; font-weight: bold;">Dúvidas?</p>
        <p style="color: #666; font-size: 15px; margin: 8px 0;">
          📱 WhatsApp: <a href="https://wa.me/5512981796135" style="color: #25D366; text-decoration: none;">(12) 98179-6135</a>
        </p>
        <p style="color: #666; font-size: 15px; margin: 8px 0;">
          📸 Instagram: <a href="https://www.instagram.com/bateu_meta/" style="color: #E1306C; text-decoration: none;">@bateu_meta</a>
        </p>
      </div>
    </div>
  `;

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: {
          name: "Bateu A Meta",
          email: "suporte@bateuameta.com",
        },
        to: [{ email }],
        subject: "🚗 Pagamento Aprovado! Seu acesso está liberado - Bateu A Meta",
        htmlContent: emailContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("[Email] Brevo API error:", errorData);
    } else {
      console.log("[Email] Welcome email sent successfully to:", email);
    }
  } catch (error) {
    console.error("[Email] Error sending welcome email:", error);
  }
}

async function getPaymentDetails(paymentId: string) {
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get payment: ${response.status}`);
  }

  return response.json();
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    console.log("[MP Payment Webhook] Received webhook:", body);

    let data;
    try {
      data = JSON.parse(body);
    } catch {
      console.error("[MP Payment Webhook] Invalid JSON received");
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[MP Payment Webhook] Parsed data:", JSON.stringify(data));

    // Mercado Pago envia notificações em diferentes formatos
    const topic = data.topic || data.type;
    const resourceId = data.id || data.data?.id;

    console.log("[MP Payment Webhook] Topic:", topic, "Resource ID:", resourceId);

    // Processar apenas eventos de payment
    if (topic !== "payment") {
      console.log("[MP Payment Webhook] Ignoring non-payment event:", topic);
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!resourceId) {
      console.error("[MP Payment Webhook] No resource ID found");
      return new Response(JSON.stringify({ error: "No resource ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Buscar detalhes do pagamento no Mercado Pago
    const payment = await getPaymentDetails(resourceId);
    console.log("[MP Payment Webhook] Payment details:", JSON.stringify(payment));

    const status = payment.status;
    const payerEmail = payment.payer?.email;
    const externalReference = payment.external_reference || "";
    const transactionAmount = payment.transaction_amount || 0;

    if (!payerEmail) {
      console.error("[MP Payment Webhook] No payer email found in payment");
      return new Response(JSON.stringify({ error: "No payer email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[MP Payment Webhook] Status:", status, "Email:", payerEmail, "Amount:", transactionAmount);

    // Determinar tipo do plano baseado no external_reference ou valor
    const isAnnual = externalReference.toLowerCase().includes("anual") || transactionAmount >= 90;
    const planType = isAnnual ? "anual" : "mensal";

    // Processar apenas pagamentos aprovados
    if (status === "approved") {
      console.log("[MP Payment Webhook] Processing approved payment for:", payerEmail);

      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      let user = existingUsers?.users?.find(u => u.email === payerEmail);
      
      const defaultPassword = "1234";
      const customerName = payment.payer?.first_name || payerEmail.split("@")[0];
      let isNewUser = false;

      if (!user) {
        // Create new user with default password
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: payerEmail,
          password: defaultPassword,
          email_confirm: true,
          user_metadata: {
            full_name: customerName,
          },
        });

        if (createError) {
          console.error("[MP Payment Webhook] Error creating user:", createError);
          throw createError;
        }

        user = newUser.user;
        isNewUser = true;
        console.log("[MP Payment Webhook] New user created:", user.id);

        // Send welcome email with credentials
        await sendWelcomeEmail(payerEmail, defaultPassword, customerName);
      } else {
        console.log("[MP Payment Webhook] User already exists:", user.id);
      }

      // Create or update profile
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .upsert({
          id: user.id,
          nome_completo: customerName,
          status: "active",
          updated_at: new Date().toISOString(),
        }, { onConflict: "id" });

      if (profileError) {
        console.error("[MP Payment Webhook] Error creating/updating profile:", profileError);
      }

      // Find or create the plan
      let planId: string;
      const { data: existingPlan } = await supabaseAdmin
        .from("plans")
        .select("id")
        .eq("name", planType)
        .maybeSingle();

      if (existingPlan) {
        planId = existingPlan.id;
      } else {
        const { data: newPlan, error: planError } = await supabaseAdmin
          .from("plans")
          .insert({
            name: planType,
            price: isAnnual ? 97.90 : 12.90,
            features: { premium: true },
          })
          .select("id")
          .single();

        if (planError) {
          console.error("[MP Payment Webhook] Error creating plan:", planError);
          throw planError;
        }
        planId = newPlan.id;
      }

      // Calculate expiration date
      const now = new Date();
      const expiresAt = isAnnual 
        ? new Date(now.setFullYear(now.getFullYear() + 1)).toISOString()
        : new Date(now.setMonth(now.getMonth() + 1)).toISOString();

      // Create or update subscription
      const { data: newSubscription, error: subError } = await supabaseAdmin
        .from("subscriptions")
        .upsert({
          user_id: user.id,
          plan_id: planId,
          status: "active",
          started_at: new Date().toISOString(),
          expires_at: expiresAt,
        }, { onConflict: "user_id" })
        .select("id")
        .single();

      if (subError) {
        console.error("[MP Payment Webhook] Error creating subscription:", subError);
      } else {
        // Update profile with subscription_id
        await supabaseAdmin
          .from("profiles")
          .update({ subscription_id: newSubscription.id })
          .eq("id", user.id);
      }

      // Add premium role to user_roles table
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .upsert({
          user_id: user.id,
          role: "premium",
        }, { onConflict: "user_id,role" });

      if (roleError) {
        console.error("[MP Payment Webhook] Error adding premium role:", roleError);
      }

      // Enviar evento Purchase para Facebook Conversions API
      await sendFacebookConversionEvent("Purchase", payerEmail, transactionAmount, "BRL");

      console.log("[MP Payment Webhook] User setup completed for:", payerEmail, "Plan:", planType, "New user:", isNewUser);

    } else {
      console.log("[MP Payment Webhook] Payment not approved, status:", status);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[MP Payment Webhook] Error processing webhook:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
