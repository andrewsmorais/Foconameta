import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CAKTO_WEBHOOK_SECRET = Deno.env.get("CAKTO_WEBHOOK_SECRET");
const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
const FB_ACCESS_TOKEN = Deno.env.get("FB_ACCESS_TOKEN");
const FB_PIXEL_ID = "1163164178906906";
const APP_BASE_URL = "https://appdriver-track.lovable.app";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const PLAN_CONFIG = {
  mensal: { name: "mensal", price: 19.9, label: "Mensal (R$ 19,90)" },
  anual: { name: "anual", price: 97.9, label: "Anual (R$ 97,90)" },
};

type PlanType = keyof typeof PLAN_CONFIG;

async function hashSHA256(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function detectPlanType(data: any): PlanType {
  const eventData = data.data || data;
  const sale = eventData.sale || eventData.purchase || eventData;
  const product = sale?.product || sale?.offer || eventData.product || eventData.offer || {};

  const productName = (product.name || product.title || sale?.product_name || sale?.offer_name || "").toLowerCase();
  if (productName.includes("mensal")) return "mensal";
  if (productName.includes("anual")) return "anual";

  const price = parseFloat(sale?.price || sale?.amount || product.price || eventData.price || "0");
  if (price > 0 && price <= 15) return "mensal";

  return "anual";
}

function getExpirationDate(planType: PlanType): string {
  const expirationDate = new Date();

  if (planType === "mensal") {
    expirationDate.setMonth(expirationDate.getMonth() + 1);
  } else {
    expirationDate.setFullYear(expirationDate.getFullYear() + 1);
  }

  return expirationDate.toISOString();
}

function extractSessionId(data: any): string {
  const eventData = data.data || data;
  const sale = eventData.sale || eventData.purchase || eventData;

  const candidates = [
    sale?.session_id,
    sale?.sessionId,
    sale?.checkout_session_id,
    sale?.checkoutSessionId,
    sale?.transaction_id,
    sale?.transactionId,
    sale?.order_id,
    sale?.orderId,
    sale?.id,
    eventData?.session_id,
    eventData?.sessionId,
    eventData?.checkout_session_id,
    eventData?.checkoutSessionId,
    eventData?.transaction_id,
    eventData?.transactionId,
    eventData?.order_id,
    eventData?.orderId,
    eventData?.id,
    data?.session_id,
    data?.sessionId,
    data?.checkout_session_id,
    data?.checkoutSessionId,
    data?.transaction_id,
    data?.transactionId,
    data?.order_id,
    data?.orderId,
    data?.id,
  ];

  const sessionId = candidates.find((value) => value !== undefined && value !== null && String(value).trim() !== "");
  return sessionId ? String(sessionId).trim() : crypto.randomUUID();
}

function buildRegistrationLink(sessionId: string): string {
  return `${APP_BASE_URL}/pagamento-sucesso?session_id=${encodeURIComponent(sessionId)}`;
}

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
        value,
        currency,
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

async function sendWelcomeEmail(email: string, nome: string, registrationLink: string, planLabel: string) {
  if (!BREVO_API_KEY) {
    console.error("[Cakto Webhook] BREVO_API_KEY não configurada");
    return;
  }

  const emailContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Pagamento confirmado - Bateu A Meta</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f5f5f5;">
      <div style="background: linear-gradient(135deg, #15a249 0%, #0d7a35 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🚗 Bateu A Meta</h1>
      </div>

      <div style="background: #ffffff; padding: 30px;">
        <h2 style="color: #333; margin-top: 0; font-size: 24px;">Olá, ${nome}! 🎉</h2>

        <p style="font-size: 16px; color: #333; line-height: 1.8;">
          Seu pagamento foi confirmado com sucesso e seu acesso ao plano <strong>${planLabel}</strong> já está reservado.
        </p>

        <div style="background: #ffffff; padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #15a249; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">✅ FINALIZE SEU CADASTRO</h3>
          <p style="font-size: 16px; margin: 8px 0; color: #333;"><strong>Email:</strong> ${email}</p>
          <p style="font-size: 16px; margin: 8px 0; color: #333;">
            Clique no botão abaixo para criar sua senha e entrar no aplicativo.
          </p>
          <p style="font-size: 14px; color: #666; margin: 15px 0 0 0; font-style: italic;">
            Se o botão não abrir, copie e cole este link no navegador:
          </p>
          <p style="font-size: 13px; color: #666; margin: 10px 0 0 0; word-break: break-all;">${registrationLink}</p>
        </div>

        <div style="margin: 25px 0;">
          <h3 style="color: #333; margin: 0 0 10px 0; font-size: 18px;">📺 PASSO A PASSO (MANUAL DO APP):</h3>
          <p style="font-size: 16px; color: #333; margin: 0 0 15px 0;">
            Antes de começar, assista ao vídeo rápido explicando como funciona cada detalhe do aplicativo:
          </p>
          <div style="text-align: center;">
            <a href="https://www.youtube.com/watch?v=8mqtvi0tvsU" style="display: inline-block; background-color: #FF0000; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
              ▶️ Assistir ao Manual no YouTube
            </a>
          </div>
        </div>

        <div style="margin: 30px 0; text-align: center;">
          <a href="${registrationLink}" style="display: inline-block; background-color: #25D366; color: white; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold;">
            👉 CRIAR SENHA E ACESSAR AGORA
          </a>
        </div>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 25px 0;">
          <h3 style="color: #333; margin: 0 0 15px 0; font-size: 16px;">📌 LINKS ÚTEIS:</h3>
          <p style="font-size: 15px; margin: 8px 0; color: #333;">• Nosso Site: <a href="https://bateuameta.com" style="color: #15a249; text-decoration: none;">bateuameta.com</a></p>
          <p style="font-size: 15px; margin: 8px 0; color: #333;">• Dúvidas ou Suporte: <a href="https://wa.me/5512981796135" style="color: #25D366; text-decoration: none;">Chamar no WhatsApp</a></p>
          <p style="font-size: 15px; margin: 8px 0; color: #333;">• Instagram: <a href="https://www.instagram.com/bateu_meta/" style="color: #E1306C; text-decoration: none;">@bateu_meta</a></p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="font-size: 16px; color: #333; margin: 0; font-weight: bold;">Tamo junto no trecho! 🚗</p>
          <p style="font-size: 16px; color: #666; margin: 5px 0 0 0;">Andrews Morais & Equipe Bateu a Meta</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: {
          name: "Bateu A Meta",
          email: "suporte@bateuameta.com",
        },
        to: [{ email }],
        subject: "Pagamento confirmado! Finalize seu cadastro no Bateu A Meta",
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

async function sendRenewalEmail(email: string, nome: string, expiresAt: string, planLabel: string = "Anual (R$ 97,90)") {
  if (!BREVO_API_KEY) {
    console.error("[Cakto Webhook] BREVO_API_KEY não configurada");
    return;
  }

  const expirationDate = new Date(expiresAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
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
          <strong>Plano:</strong> ${planLabel}
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
        Accept: "application/json",
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

async function createOrUpdatePendingRegistration(email: string, planType: PlanType, sessionId: string) {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { data: existingPending, error: lookupError } = await supabaseAdmin
    .from("pending_registrations")
    .select("id")
    .eq("session_id", sessionId)
    .limit(1)
    .maybeSingle();

  if (lookupError) {
    console.error("[Cakto Webhook] Pending registration lookup error:", lookupError);
    throw lookupError;
  }

  const payload = {
    email,
    session_id: sessionId,
    plan_type: planType,
    status: "pending",
    expires_at: expiresAt,
    completed_at: null,
  };

  const { error } = existingPending
    ? await supabaseAdmin.from("pending_registrations").update(payload).eq("id", existingPending.id)
    : await supabaseAdmin.from("pending_registrations").insert(payload);

  if (error) {
    console.error("[Cakto Webhook] Pending registration error:", error);
    throw error;
  }
}

async function resolvePlanId(planType: PlanType): Promise<string> {
  const planConfig = PLAN_CONFIG[planType];

  const { data: existingPlan, error: lookupError } = await supabaseAdmin
    .from("plans")
    .select("id")
    .eq("name", planConfig.name)
    .maybeSingle();

  if (lookupError) {
    console.error("[Cakto Webhook] Plan lookup error:", lookupError);
    throw lookupError;
  }

  if (existingPlan) {
    return existingPlan.id;
  }

  const { data: newPlan, error: insertError } = await supabaseAdmin
    .from("plans")
    .insert({
      name: planConfig.name,
      price: planConfig.price,
      features: { premium: true },
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("[Cakto Webhook] Plan creation error:", insertError);
    throw insertError;
  }

  return newPlan.id;
}

async function createOrUpdateSubscription(userId: string, planId: string, planType: PlanType) {
  const startedAt = new Date().toISOString();
  const expiresAt = getExpirationDate(planType);

  const { data: existingSubscription, error: lookupError } = await supabaseAdmin
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lookupError) {
    console.error("[Cakto Webhook] Subscription lookup error:", lookupError);
    throw lookupError;
  }

  if (existingSubscription) {
    const { error: updateError } = await supabaseAdmin
      .from("subscriptions")
      .update({
        plan_id: planId,
        status: "active",
        started_at: startedAt,
        expires_at: expiresAt,
      })
      .eq("id", existingSubscription.id);

    if (updateError) {
      console.error("[Cakto Webhook] Subscription update error:", updateError);
      throw updateError;
    }

    return { id: existingSubscription.id, expiresAt };
  }

  const { data: newSubscription, error: insertError } = await supabaseAdmin
    .from("subscriptions")
    .insert({
      user_id: userId,
      plan_id: planId,
      status: "active",
      started_at: startedAt,
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("[Cakto Webhook] Subscription insert error:", insertError);
    throw insertError;
  }

  return { id: newSubscription.id, expiresAt };
}

async function finalizeCheckoutArtifacts(email: string) {
  await Promise.all([
    supabaseAdmin
      .from("abandoned_checkouts")
      .update({
        status: "converted",
        converted_at: new Date().toISOString(),
      })
      .eq("email", email),
    supabaseAdmin
      .from("discount_coupons")
      .update({ used_at: new Date().toISOString() })
      .eq("email", email)
      .is("used_at", null),
  ]);
}

serve(async (req) => {
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

    const event = data.event || data.type || data.action;
    const eventData = data.data || data;

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

    if (event === "purchase_approved" || event === "sale_approved" || event === "purchase.approved" || event === "SALE_APPROVED") {
      const planType = detectPlanType(data);
      const plan = PLAN_CONFIG[planType];
      const sessionId = extractSessionId(data);
      console.log("[Cakto Webhook] Processing approved purchase for:", email, "Plan:", planType, "Session:", sessionId);

      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const user = existingUsers?.users?.find((u) => u.email === email);

      if (!user) {
        const registrationLink = buildRegistrationLink(sessionId);
        await createOrUpdatePendingRegistration(email, planType, sessionId);
        await sendWelcomeEmail(email, nome, registrationLink, plan.label);
        console.log("[Cakto Webhook] Pending registration created for new buyer:", email);
      } else {
        console.log("[Cakto Webhook] User already exists:", user.id);

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

        const planId = await resolvePlanId(planType);
        const subscription = await createOrUpdateSubscription(user.id, planId, planType);

        await supabaseAdmin
          .from("profiles")
          .update({ subscription_id: subscription.id })
          .eq("id", user.id);

        const { error: roleError } = await supabaseAdmin
          .from("user_roles")
          .upsert({ user_id: user.id, role: "premium" }, { onConflict: "user_id,role" });

        if (roleError) {
          console.error("[Cakto Webhook] Role error:", roleError);
        }

        await supabaseAdmin
          .from("pending_registrations")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("email", email)
          .eq("status", "pending");

        await sendRenewalEmail(email, nome, subscription.expiresAt, plan.label);
      }

      await sendFacebookConversionEvent("Purchase", email, plan.price, "BRL");
      await finalizeCheckoutArtifacts(email);
      console.log("[Cakto Webhook] Completed approved purchase for:", email);
    } else if (event === "subscription_created" || event === "subscription.created" || event === "SUBSCRIPTION_CREATED") {
      const planType = detectPlanType(data);
      const plan = PLAN_CONFIG[planType];
      const sessionId = extractSessionId(data);
      console.log("[Cakto Webhook] Processing subscription created for:", email, "Plan:", planType, "Session:", sessionId);

      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const user = existingUsers?.users?.find((u) => u.email === email);

      if (!user) {
        const registrationLink = buildRegistrationLink(sessionId);
        await createOrUpdatePendingRegistration(email, planType, sessionId);
        await sendWelcomeEmail(email, nome, registrationLink, plan.label);
        console.log("[Cakto Webhook] Pending registration created (subscription_created) for:", email);
      } else {
        console.log("[Cakto Webhook] User already exists (subscription_created):", user.id);

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

        const planId = await resolvePlanId(planType);
        const subscription = await createOrUpdateSubscription(user.id, planId, planType);

        await supabaseAdmin
          .from("profiles")
          .update({ subscription_id: subscription.id })
          .eq("id", user.id);

        const { error: roleError } = await supabaseAdmin
          .from("user_roles")
          .upsert({ user_id: user.id, role: "premium" }, { onConflict: "user_id,role" });

        if (roleError) {
          console.error("[Cakto Webhook] Role error:", roleError);
        }

        await supabaseAdmin
          .from("pending_registrations")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("email", email)
          .eq("status", "pending");

        await sendRenewalEmail(email, nome, subscription.expiresAt, plan.label);
      }

      await sendFacebookConversionEvent("Purchase", email, plan.price, "BRL");
      await finalizeCheckoutArtifacts(email);
      console.log("[Cakto Webhook] Completed subscription_created for:", email);
    } else if (event === "subscription_renewed" || event === "subscription.renewed" || event === "SUBSCRIPTION_RENEWED") {
      const planType = detectPlanType(data);
      const plan = PLAN_CONFIG[planType];
      console.log("[Cakto Webhook] Processing subscription renewal for:", email, "Plan:", planType);

      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const user = existingUsers?.users?.find((u) => u.email === email);

      if (user) {
        const planId = await resolvePlanId(planType);
        const subscription = await createOrUpdateSubscription(user.id, planId, planType);

        await supabaseAdmin
          .from("profiles")
          .update({ subscription_id: subscription.id, status: "active", updated_at: new Date().toISOString() })
          .eq("id", user.id);

        await sendRenewalEmail(email, nome, subscription.expiresAt, plan.label);
        await sendFacebookConversionEvent("Purchase", email, plan.price, "BRL");

        console.log("[Cakto Webhook] Subscription renewed for:", user.id);
      }
    } else if (event === "subscription_canceled" || event === "subscription.canceled" || event === "SUBSCRIPTION_CANCELED") {
      console.log("[Cakto Webhook] Processing subscription cancellation for:", email);

      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const user = existingUsers?.users?.find((u) => u.email === email);

      if (user) {
        await supabaseAdmin
          .from("subscriptions")
          .update({ status: "cancelled" })
          .eq("user_id", user.id);

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
      const user = existingUsers?.users?.find((u) => u.email === email);

      if (user) {
        await supabaseAdmin
          .from("subscriptions")
          .update({ status: "refunded" })
          .eq("user_id", user.id);

        await supabaseAdmin
          .from("user_roles")
          .delete()
          .eq("user_id", user.id)
          .eq("role", "premium");

        console.log("[Cakto Webhook] Refund processed for:", user.id);
      }
    } else if (event === "checkout_abandonment" || event === "cart_abandoned" || event === "CHECKOUT_ABANDONMENT") {
      const planType = detectPlanType(data);
      console.log("[Cakto Webhook] Processing checkout abandonment for:", email, "Plan:", planType);

      const { data: existingAbandonment } = await supabaseAdmin
        .from("abandoned_checkouts")
        .select("id, status")
        .eq("email", email)
        .eq("plan_type", planType)
        .maybeSingle();

      if (existingAbandonment) {
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
        const { error: abandonError } = await supabaseAdmin
          .from("abandoned_checkouts")
          .insert({
            email,
            plan_type: planType,
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