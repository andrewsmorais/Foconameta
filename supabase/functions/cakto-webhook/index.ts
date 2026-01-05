import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CAKTO_WEBHOOK_SECRET = Deno.env.get("CAKTO_WEBHOOK_SECRET");
const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
const FB_ACCESS_TOKEN = Deno.env.get("FB_ACCESS_TOKEN");
const FB_PIXEL_ID = "1290319795205025";

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

// Gerar senha aleatória de 7 dígitos
function generatePassword(): string {
  return Math.floor(1000000 + Math.random() * 9000000).toString();
}

// Função para enviar evento para Facebook Conversions API
async function sendFacebookConversionEvent(
  eventName: string,
  email: string,
  value: number,
  currency: string = "BRL"
) {
  if (!FB_ACCESS_TOKEN) {
    console.log("[Cakto Webhook] FB Token não configurado, pulando envio");
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
      console.log("[Cakto Webhook] FB Event enviado:", eventName, result);
    } else {
      console.error("[Cakto Webhook] FB Event erro:", result);
    }
  } catch (error) {
    console.error("[Cakto Webhook] FB Event conexão erro:", error);
  }
}

async function sendWelcomeEmail(email: string, password: string, nome: string) {
  if (!BREVO_API_KEY) {
    console.error("[Cakto Webhook] BREVO_API_KEY não configurada");
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
      console.error("[Cakto Webhook] Brevo API error:", errorData);
    } else {
      console.log("[Cakto Webhook] Welcome email sent to:", email);
    }
  } catch (error) {
    console.error("[Cakto Webhook] Error sending welcome email:", error);
  }
}

async function sendRenewalEmail(email: string, nome: string, expiresAt: string) {
  if (!BREVO_API_KEY) {
    console.error("[Cakto Webhook] BREVO_API_KEY não configurada");
    return;
  }

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
          <strong>Plano:</strong> Anual (R$ 97,90)
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
        <a href="https://bateuameta.com/auth" style="display: inline-block; background-color: #15a249; color: white; padding: 18px 50px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold;">
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
      console.error("[Cakto Webhook] Brevo renewal error:", errorData);
    } else {
      console.log("[Cakto Webhook] Renewal email sent to:", email);
    }
  } catch (error) {
    console.error("[Cakto Webhook] Error sending renewal email:", error);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    
    let data;
    try {
      data = JSON.parse(body);
    } catch {
      console.error("[Cakto Webhook] Invalid JSON");
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validar secret que vem no body (padrão da Cakto)
    if (CAKTO_WEBHOOK_SECRET) {
      const receivedSecret = data.secret;
      if (!receivedSecret || receivedSecret !== CAKTO_WEBHOOK_SECRET) {
        console.error("[Cakto Webhook] Secret inválido ou ausente");
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log("[Cakto Webhook] Secret verificado com sucesso");
    }

    console.log("[Cakto Webhook] Evento recebido:", data.event);

    // Cakto envia diferentes eventos
    // Estrutura típica: { event, data: { customer, sale, ... } }
    const event = data.event || data.type || data.action;
    const eventData = data.data || data;
    
    // Extrair dados do cliente
    const customer = eventData.customer || eventData.buyer || eventData;
    const email = customer?.email || eventData.email || data.email;
    const nome = customer?.name || customer?.nome || eventData.name || email?.split("@")[0] || "Cliente";
    const phone = customer?.phone || customer?.telefone || eventData.phone;
    
    console.log("[Cakto Webhook] Event:", event, "Email:", email, "Nome:", nome);

    if (!email) {
      console.error("[Cakto Webhook] No email found in payload");
      return new Response(JSON.stringify({ error: "No email found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Processar baseado no evento
    if (event === "purchase_approved" || event === "sale_approved" || event === "purchase.approved" || event === "SALE_APPROVED") {
      console.log("[Cakto Webhook] Processing approved purchase for:", email);

      // Verificar se usuário já existe
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      let user = existingUsers?.users?.find(u => u.email === email);
      
      const password = generatePassword();
      let isNewUser = false;

      if (!user) {
        // Criar novo usuário
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: email,
          password: password,
          email_confirm: true,
          user_metadata: {
            full_name: nome,
          },
        });

        if (createError) {
          console.error("[Cakto Webhook] Error creating user:", createError);
          throw createError;
        }

        user = newUser.user;
        isNewUser = true;
        console.log("[Cakto Webhook] New user created:", user.id);

        // Enviar email de boas-vindas
        await sendWelcomeEmail(email, password, nome);
      } else {
        console.log("[Cakto Webhook] User already exists:", user.id);
      }

      // Criar ou atualizar profile
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .upsert({
          id: user.id,
          nome_completo: nome,
          telefone: phone || null,
          status: "active",
          updated_at: new Date().toISOString(),
        }, { onConflict: "id" });

      if (profileError) {
        console.error("[Cakto Webhook] Profile error:", profileError);
      }

      // Encontrar ou criar plano anual
      let planId: string;
      const { data: existingPlan } = await supabaseAdmin
        .from("plans")
        .select("id")
        .eq("name", "anual")
        .maybeSingle();

      if (existingPlan) {
        planId = existingPlan.id;
      } else {
        const { data: newPlan, error: planError } = await supabaseAdmin
          .from("plans")
          .insert({
            name: "anual",
            price: 97.90,
            features: { premium: true },
          })
          .select("id")
          .single();

        if (planError) {
          console.error("[Cakto Webhook] Plan error:", planError);
          throw planError;
        }
        planId = newPlan.id;
      }

      // Calcular data de expiração (1 ano)
      const now = new Date();
      const expiresAt = new Date(now.setFullYear(now.getFullYear() + 1)).toISOString();

      // Criar ou atualizar subscription
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
        console.error("[Cakto Webhook] Subscription error:", subError);
      } else {
        // Atualizar profile com subscription_id
        await supabaseAdmin
          .from("profiles")
          .update({ subscription_id: newSubscription.id })
          .eq("id", user.id);
      }

      // Adicionar role premium
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .upsert({
          user_id: user.id,
          role: "premium",
        }, { onConflict: "user_id,role" });

      if (roleError) {
        console.error("[Cakto Webhook] Role error:", roleError);
      }

      // Enviar email de renovação para usuários existentes
      if (!isNewUser) {
        await sendRenewalEmail(email, nome, expiresAt);
      }

      // Enviar evento Purchase para Facebook
      await sendFacebookConversionEvent("Purchase", email, 97.90, "BRL");

      // Marcar abandoned checkout como convertido
      await supabaseAdmin
        .from("abandoned_checkouts")
        .update({ 
          status: "converted", 
          converted_at: new Date().toISOString() 
        })
        .eq("email", email);

      // Marcar cupom como usado (se houver)
      await supabaseAdmin
        .from("discount_coupons")
        .update({ used_at: new Date().toISOString() })
        .eq("email", email)
        .is("used_at", null);

      console.log("[Cakto Webhook] Completed for:", email, "New user:", isNewUser);

    } else if (event === "subscription_renewed" || event === "subscription.renewed" || event === "SUBSCRIPTION_RENEWED") {
      console.log("[Cakto Webhook] Processing subscription renewal for:", email);

      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const user = existingUsers?.users?.find(u => u.email === email);

      if (user) {
        // Calcular nova data de expiração
        const now = new Date();
        const expiresAt = new Date(now.setFullYear(now.getFullYear() + 1)).toISOString();

        await supabaseAdmin
          .from("subscriptions")
          .update({ 
            status: "active",
            expires_at: expiresAt,
          })
          .eq("user_id", user.id);

        await sendRenewalEmail(email, nome, expiresAt);
        await sendFacebookConversionEvent("Purchase", email, 97.90, "BRL");

        console.log("[Cakto Webhook] Subscription renewed for:", user.id);
      }

    } else if (event === "subscription_canceled" || event === "subscription.canceled" || event === "SUBSCRIPTION_CANCELED") {
      console.log("[Cakto Webhook] Processing subscription cancellation for:", email);

      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const user = existingUsers?.users?.find(u => u.email === email);

      if (user) {
        await supabaseAdmin
          .from("subscriptions")
          .update({ status: "cancelled" })
          .eq("user_id", user.id);

        // Remover role premium
        await supabaseAdmin
          .from("user_roles")
          .delete()
          .eq("user_id", user.id)
          .eq("role", "premium");

        console.log("[Cakto Webhook] Subscription cancelled for:", user.id);
      }

    } else if (event === "refund" || event === "refunded" || event === "REFUND" || event === "purchase.refunded") {
      console.log("[Cakto Webhook] Processing refund for:", email);

      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const user = existingUsers?.users?.find(u => u.email === email);

      if (user) {
        await supabaseAdmin
          .from("subscriptions")
          .update({ status: "refunded" })
          .eq("user_id", user.id);

        // Remover role premium
        await supabaseAdmin
          .from("user_roles")
          .delete()
          .eq("user_id", user.id)
          .eq("role", "premium");

        console.log("[Cakto Webhook] Refund processed for:", user.id);
      }

    } else if (event === "checkout_abandonment" || event === "cart_abandoned" || event === "CHECKOUT_ABANDONMENT") {
      console.log("[Cakto Webhook] Processing checkout abandonment for:", email);

      // Verificar se já existe registro de abandono para este email e plano
      const { data: existingAbandonment } = await supabaseAdmin
        .from("abandoned_checkouts")
        .select("id, status")
        .eq("email", email)
        .eq("plan_type", "anual")
        .maybeSingle();

      if (existingAbandonment) {
        // Atualizar registro existente (reset para pending se não foi email_sent ainda)
        if (existingAbandonment.status !== "email_sent" && existingAbandonment.status !== "converted") {
          await supabaseAdmin
            .from("abandoned_checkouts")
            .update({
              status: "pending",
              created_at: new Date().toISOString(),
              reminder_sent_at: null,
            })
            .eq("id", existingAbandonment.id);
          console.log("[Cakto Webhook] Abandoned checkout updated for:", email);
        } else {
          console.log("[Cakto Webhook] Abandoned checkout already processed:", email, existingAbandonment.status);
        }
      } else {
        // Criar novo registro com status 'pending' (default do banco)
        const { error: abandonError } = await supabaseAdmin
          .from("abandoned_checkouts")
          .insert({
            email: email,
            plan_type: "anual",
            // status: "pending" é o default do banco
          });

        if (abandonError) {
          console.error("[Cakto Webhook] Abandoned checkout error:", abandonError);
        } else {
          console.log("[Cakto Webhook] Abandoned checkout saved for:", email);
        }
      }

    } else {
      console.log("[Cakto Webhook] Ignoring event:", event);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[Cakto Webhook] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
