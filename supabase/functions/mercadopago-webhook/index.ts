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
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Bem-vindo ao Bateu A Meta!</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f5f5f5;">
      <!-- Header Verde -->
      <div style="background: linear-gradient(135deg, #15a249 0%, #0d7a35 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🚗 Bateu A Meta</h1>
      </div>
      
      <!-- Conteúdo Principal -->
      <div style="background: #ffffff; padding: 30px;">
        <!-- Saudação -->
        <h2 style="color: #333; margin-top: 0; font-size: 24px;">Olá, ${nome}! 🎉</h2>
        
        <!-- Mensagem do Andrews -->
        <p style="font-size: 16px; color: #333; line-height: 1.8;">
          Aqui é o <strong>Andrews Morais</strong>. Fico feliz em ter você conosco! A partir de agora, você não vai mais "bater lata" sem saber o seu lucro. Você tem em mãos a ferramenta certa para dominar suas finanças e bater suas metas com inteligência.
        </p>
        
        <!-- Box de Dados de Acesso -->
        <div style="background: #ffffff; padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #15a249; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">🔑 SEUS DADOS DE ACESSO:</h3>
          <p style="font-size: 16px; margin: 8px 0; color: #333;">
            <strong>Usuário:</strong> ${email}
          </p>
          <p style="font-size: 16px; margin: 8px 0; color: #333;">
            <strong>Senha:</strong> ${password}
          </p>
          <p style="font-size: 14px; color: #666; margin: 15px 0 0 0; font-style: italic;">
            (Dica: Guarde este e-mail ou tire um print para consultas futuras)
          </p>
        </div>
        
        <!-- Seção Manual do App -->
        <div style="margin: 25px 0;">
          <h3 style="color: #333; margin: 0 0 10px 0; font-size: 18px;">📺 PASSO A PASSO (MANUAL DO APP):</h3>
          <p style="font-size: 16px; color: #333; margin: 0 0 15px 0;">
            Antes de começar, assista ao vídeo rápido que preparei explicando como funciona cada detalhe do aplicativo:
          </p>
          <div style="text-align: center;">
            <a href="https://www.youtube.com/watch?v=8mqtvi0tvsU" style="display: inline-block; background-color: #FF0000; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
              ▶️ Assistir ao Manual no YouTube
            </a>
          </div>
        </div>
        
        <!-- Botão Principal -->
        <div style="margin: 30px 0;">
          <h3 style="color: #333; margin: 0 0 10px 0; font-size: 18px;">🚀 COMECE AGORA:</h3>
          <p style="font-size: 16px; color: #333; margin: 0 0 15px 0;">
            Clique no botão abaixo para acessar a área de login e cadastrar seu primeiro turno:
          </p>
          <div style="text-align: center;">
            <a href="https://bateuameta.com/auth?payment_success=true" style="display: inline-block; background-color: #25D366; color: white; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold;">
              👉 ENTRAR NO APLICATIVO AGORA
            </a>
          </div>
        </div>
        
        <!-- Links Úteis -->
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 25px 0;">
          <h3 style="color: #333; margin: 0 0 15px 0; font-size: 16px;">📌 LINKS ÚTEIS:</h3>
          <p style="font-size: 15px; margin: 8px 0; color: #333;">
            • Nosso Site: <a href="https://bateuameta.com" style="color: #15a249; text-decoration: none;">bateuameta.com</a>
          </p>
          <p style="font-size: 15px; margin: 8px 0; color: #333;">
            • Dúvidas ou Suporte: <a href="https://wa.me/5512981796135" style="color: #25D366; text-decoration: none;">Chamar no WhatsApp</a>
          </p>
          <p style="font-size: 15px; margin: 8px 0; color: #333;">
            • Instagram: <a href="https://www.instagram.com/bateu_meta/" style="color: #E1306C; text-decoration: none;">@bateu_meta</a>
          </p>
        </div>
        
        <!-- Assinatura -->
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="font-size: 16px; color: #333; margin: 0; font-weight: bold;">
            Tamo junto no trecho! 🚗
          </p>
          <p style="font-size: 16px; color: #666; margin: 5px 0 0 0;">
            Andrews Morais & Equipe Bateu a Meta
          </p>
        </div>
      </div>
    </body>
    </html>
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
        subject: "Bem-vindo ao Bateu a Meta, " + nome + "! 🎉 Seus dados de acesso estão aqui",
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

async function sendRenewalEmail(email: string, nome: string, planType: string, expiresAt: string) {
  if (!BREVO_API_KEY) {
    console.error("[Email] BREVO_API_KEY not configured");
    return;
  }

  const planName = planType === "anual" ? "Anual (R$ 97,90)" : "Mensal (R$ 12,90)";
  const expirationDate = new Date(expiresAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">
          Olá, ${nome}! 🎉
        </h1>
        <p style="font-size: 20px; color: #15a249; line-height: 1.6; font-weight: bold;">
          Sua assinatura foi renovada com sucesso!
        </p>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 25px; border-radius: 10px; margin-bottom: 25px; border-left: 4px solid #15a249;">
        <h2 style="color: #333; margin-bottom: 15px; font-size: 18px;">📋 DETALHES DA RENOVAÇÃO:</h2>
        <p style="font-size: 16px; margin: 10px 0; color: #333;">
          <strong>Plano:</strong> ${planName}
        </p>
        <p style="font-size: 16px; margin: 10px 0; color: #333;">
          <strong>Válido até:</strong> ${expirationDate}
        </p>
      </div>
      
      <div style="background-color: #e8f5e9; padding: 20px; border-radius: 10px; margin-bottom: 25px; text-align: center;">
        <p style="font-size: 16px; color: #333; margin: 0;">
          ✅ Seu acesso continua ativo.<br/>
          Continue acompanhando seus ganhos e batendo suas metas!
        </p>
      </div>
      
      <div style="text-align: center; margin: 35px 0;">
        <a href="${APP_URL}/auth" style="display: inline-block; background-color: #15a249; color: white; padding: 18px 50px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold;">
          🚀 ACESSAR O APLICATIVO
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
        subject: "🔄 Assinatura Renovada! Continue batendo suas metas - Bateu A Meta",
        htmlContent: emailContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("[Email] Brevo API error (renewal):", errorData);
    } else {
      console.log("[Email] Renewal email sent successfully to:", email);
    }
  } catch (error) {
    console.error("[Email] Error sending renewal email:", error);
  }
}

async function getPreapprovalDetails(preapprovalId: string) {
  const response = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
    headers: {
      "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get preapproval: ${response.status}`);
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
    console.log("[MP Webhook] Received webhook:", body);

    let data;
    try {
      data = JSON.parse(body);
    } catch {
      console.error("[MP Webhook] Invalid JSON received");
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[MP Webhook] Parsed data:", JSON.stringify(data));

    // Mercado Pago envia notificações em diferentes formatos
    // IPN tradicional: { topic, id }
    // Webhooks modernos: { action, data: { id }, type }
    
    const topic = data.topic || data.type;
    const resourceId = data.id || data.data?.id;

    console.log("[MP Webhook] Topic:", topic, "Resource ID:", resourceId);

    // Processar apenas eventos de preapproval (assinatura)
    if (topic !== "preapproval" && topic !== "subscription_preapproval") {
      console.log("[MP Webhook] Ignoring non-preapproval event:", topic);
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!resourceId) {
      console.error("[MP Webhook] No resource ID found");
      return new Response(JSON.stringify({ error: "No resource ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Buscar detalhes da assinatura no Mercado Pago
    const preapproval = await getPreapprovalDetails(resourceId);
    console.log("[MP Webhook] Preapproval details:", JSON.stringify(preapproval));

    const status = preapproval.status;
    const payerEmail = preapproval.payer_email;
    const reason = preapproval.reason || "";

    if (!payerEmail) {
      console.error("[MP Webhook] No payer email found in preapproval");
      return new Response(JSON.stringify({ error: "No payer email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[MP Webhook] Status:", status, "Email:", payerEmail);

    // Determinar tipo do plano baseado no reason ou valor
    const isAnnual = reason.toLowerCase().includes("anual") || 
                     preapproval.auto_recurring?.transaction_amount >= 90;
    const planType = isAnnual ? "anual" : "mensal";

    // Processar baseado no status
    if (status === "authorized") {
      // Assinatura aprovada - criar/atualizar usuário
      console.log("[MP Webhook] Processing authorized subscription for:", payerEmail);

      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      let user = existingUsers?.users?.find(u => u.email === payerEmail);
      
      const defaultPassword = "1234";
      const customerName = preapproval.payer_first_name || payerEmail.split("@")[0];
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
          console.error("[MP Webhook] Error creating user:", createError);
          throw createError;
        }

        user = newUser.user;
        isNewUser = true;
        console.log("[MP Webhook] New user created:", user.id);

        // Send welcome email with credentials
        await sendWelcomeEmail(payerEmail, defaultPassword, customerName);
      } else {
        console.log("[MP Webhook] User already exists:", user.id);
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
        console.error("[MP Webhook] Error creating/updating profile:", profileError);
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
          console.error("[MP Webhook] Error creating plan:", planError);
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
        console.error("[MP Webhook] Error creating subscription:", subError);
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
        console.error("[MP Webhook] Error adding premium role:", roleError);
      }

      // Send renewal email for existing users
      if (!isNewUser) {
        await sendRenewalEmail(payerEmail, customerName, planType, expiresAt);
      }

      // Enviar evento Purchase para Facebook Conversions API
      const purchaseValue = isAnnual ? 97.90 : 12.90;
      await sendFacebookConversionEvent("Purchase", payerEmail, purchaseValue, "BRL");

      // Mark abandoned checkout as converted
      await supabaseAdmin
        .from("abandoned_checkouts")
        .update({ 
          status: "converted", 
          converted_at: new Date().toISOString() 
        })
        .eq("email", payerEmail);

      // Mark coupon as used (if any)
      await supabaseAdmin
        .from("discount_coupons")
        .update({ used_at: new Date().toISOString() })
        .eq("email", payerEmail)
        .is("used_at", null);

      console.log("[MP Webhook] User setup completed for:", payerEmail, "Plan:", planType, "New user:", isNewUser);

    } else if (status === "paused" || status === "cancelled") {
      // Assinatura pausada ou cancelada
      console.log("[MP Webhook] Processing", status, "subscription for:", payerEmail);

      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const user = existingUsers?.users?.find(u => u.email === payerEmail);

      if (user) {
        await supabaseAdmin
          .from("subscriptions")
          .update({ status: status === "paused" ? "paused" : "cancelled" })
          .eq("user_id", user.id);

        if (status === "cancelled") {
          // Remove premium role
          await supabaseAdmin
            .from("user_roles")
            .delete()
            .eq("user_id", user.id)
            .eq("role", "premium");
        }

        console.log("[MP Webhook] Subscription updated to", status, "for user:", user.id);
      }
    } else if (status === "pending") {
      console.log("[MP Webhook] Subscription pending for:", payerEmail, "- waiting for payment");
    } else {
      console.log("[MP Webhook] Ignoring status:", status);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[MP Webhook] Error processing webhook:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
