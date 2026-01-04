import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const PLANS = {
  mensal: { original: 12.90, discounted: 11.61 },
  anual: { original: 97.90, discounted: 88.11 },
};

function generateCouponCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "VOLTA10-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function sendAbandonedCartEmail(
  email: string,
  couponCode: string,
  planType: string
) {
  if (!BREVO_API_KEY) {
    console.error("[Abandoned Cart] BREVO_API_KEY not configured");
    return false;
  }

  const prices = PLANS[planType as keyof typeof PLANS] || PLANS.mensal;
  const checkoutUrl = `https://grfyoqsbypvvuzdudtgu.supabase.co/functions/v1/mp-email?planType=${planType}&coupon=${couponCode}`;

  const emailContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Esqueceu algo? Seu cupom de 10% OFF está aqui!</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f5f5f5;">
      <!-- Header Verde -->
      <div style="background: linear-gradient(135deg, #15a249 0%, #0d7a35 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🚗 Bateu A Meta</h1>
      </div>
      
      <!-- Conteúdo Principal -->
      <div style="background: #ffffff; padding: 30px;">
        <!-- Título -->
        <h2 style="color: #333; margin-top: 0; font-size: 24px; text-align: center;">Esqueceu algo? 🤔</h2>
        
        <!-- Mensagem -->
        <p style="font-size: 16px; color: #333; line-height: 1.8;">
          Vi que você estava prestes a assinar o <strong>Bateu a Meta</strong>, mas não finalizou. Sem problemas! Para te ajudar a tomar essa decisão, preparei algo especial:
        </p>
        
        <!-- Box do Cupom -->
        <div style="background: linear-gradient(135deg, #fff3cd 0%, #ffeeba 100%); padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center; border: 2px dashed #f5a623;">
          <h3 style="color: #333; margin: 0 0 10px 0; font-size: 16px;">🎁 CUPOM DE 10% DE DESCONTO</h3>
          <div style="background: #333; color: #fff; padding: 15px 25px; border-radius: 8px; display: inline-block; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 10px 0;">
            ${couponCode}
          </div>
          <p style="color: #d32f2f; margin: 15px 0 0 0; font-weight: bold; font-size: 16px;">
            ⏰ Válido por apenas 24 HORAS!
          </p>
        </div>
        
        <!-- Preços com Desconto -->
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 25px 0;">
          <h3 style="color: #333; margin: 0 0 15px 0; font-size: 16px;">💰 Com esse cupom, seu plano fica assim:</h3>
          <p style="font-size: 16px; margin: 8px 0; color: #333;">
            • <strong>Plano Mensal:</strong> <span style="text-decoration: line-through; color: #999;">R$ ${PLANS.mensal.original.toFixed(2).replace('.', ',')}</span> por <span style="color: #15a249; font-weight: bold;">R$ ${PLANS.mensal.discounted.toFixed(2).replace('.', ',')}</span>
          </p>
          <p style="font-size: 16px; margin: 8px 0; color: #333;">
            • <strong>Plano Anual:</strong> <span style="text-decoration: line-through; color: #999;">R$ ${PLANS.anual.original.toFixed(2).replace('.', ',')}</span> por <span style="color: #15a249; font-weight: bold;">R$ ${PLANS.anual.discounted.toFixed(2).replace('.', ',')}</span>
          </p>
        </div>
        
        <!-- Botão Principal -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="${checkoutUrl}" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold;">
            🎯 USAR MEU CUPOM AGORA
          </a>
        </div>
        
        <!-- Aviso de Urgência -->
        <div style="background: #ffebee; padding: 15px; border-radius: 8px; margin: 25px 0; text-align: center; border-left: 4px solid #d32f2f;">
          <p style="font-size: 14px; color: #c62828; margin: 0; font-weight: bold;">
            ⚠️ Este cupom expira em 24 horas. Depois disso, o desconto não estará mais disponível!
          </p>
        </div>
        
        <!-- Benefícios -->
        <div style="margin: 25px 0;">
          <h3 style="color: #333; margin: 0 0 15px 0; font-size: 16px;">✅ O que você ganha com o Bateu a Meta:</h3>
          <ul style="font-size: 15px; color: #333; line-height: 2;">
            <li>Controle total dos seus ganhos e despesas</li>
            <li>Acompanhamento de metas diárias, semanais e mensais</li>
            <li>Relatórios completos de performance</li>
            <li>Controle de combustível e manutenção</li>
            <li>Suporte via WhatsApp</li>
          </ul>
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
        
        <!-- Links Úteis -->
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 25px; text-align: center;">
          <p style="font-size: 13px; color: #666; margin: 0;">
            Dúvidas? <a href="https://wa.me/5512981796135" style="color: #25D366;">Chama no WhatsApp</a> • 
            <a href="https://www.instagram.com/bateu_meta/" style="color: #E1306C;">@bateu_meta</a>
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
        subject: "🎁 Esqueceu algo? Aqui está um cupom de 10% OFF válido por 24h!",
        htmlContent: emailContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("[Abandoned Cart] Brevo API error:", errorData);
      return false;
    }
    
    console.log("[Abandoned Cart] Email sent successfully to:", email);
    return true;
  } catch (error) {
    console.error("[Abandoned Cart] Error sending email:", error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[Abandoned Cart] Starting abandoned cart email job...");

    // Find abandoned checkouts:
    // - status = 'pending'
    // - created more than 1 hour ago
    // - no email sent yet (reminder_sent_at is null)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: abandonedCheckouts, error: fetchError } = await supabaseAdmin
      .from("abandoned_checkouts")
      .select("*")
      .eq("status", "pending")
      .is("reminder_sent_at", null)
      .lt("created_at", oneHourAgo)
      .limit(50);

    if (fetchError) {
      console.error("[Abandoned Cart] Error fetching abandoned checkouts:", fetchError);
      throw fetchError;
    }

    console.log("[Abandoned Cart] Found", abandonedCheckouts?.length || 0, "abandoned checkouts");

    if (!abandonedCheckouts || abandonedCheckouts.length === 0) {
      return new Response(JSON.stringify({ message: "No abandoned checkouts to process", processed: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processed = 0;
    let failed = 0;

    for (const checkout of abandonedCheckouts) {
      try {
        // Check if user already converted (has active subscription)
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === checkout.email);

        if (existingUser) {
          // Check if user has active subscription
          const { data: subscription } = await supabaseAdmin
            .from("subscriptions")
            .select("status")
            .eq("user_id", existingUser.id)
            .eq("status", "active")
            .maybeSingle();

          if (subscription) {
            // User already converted, mark as converted
            await supabaseAdmin
              .from("abandoned_checkouts")
              .update({ status: "converted", converted_at: new Date().toISOString() })
              .eq("id", checkout.id);
            console.log("[Abandoned Cart] User already converted:", checkout.email);
            continue;
          }
        }

        // Generate unique coupon code
        const couponCode = generateCouponCode();
        const planType = checkout.plan_type || "mensal";
        const prices = PLANS[planType as keyof typeof PLANS] || PLANS.mensal;

        // Save coupon to database
        const validUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
        
        const { error: couponError } = await supabaseAdmin
          .from("discount_coupons")
          .insert({
            code: couponCode,
            email: checkout.email,
            discount_percent: 10,
            plan_type: planType,
            original_price: prices.original,
            discounted_price: prices.discounted,
            valid_until: validUntil,
          });

        if (couponError) {
          console.error("[Abandoned Cart] Error creating coupon:", couponError);
          failed++;
          continue;
        }

        // Send email
        const emailSent = await sendAbandonedCartEmail(checkout.email, couponCode, planType);

        if (emailSent) {
          // Update checkout status
          await supabaseAdmin
            .from("abandoned_checkouts")
            .update({
              status: "email_sent",
              coupon_code: couponCode,
              reminder_sent_at: new Date().toISOString(),
            })
            .eq("id", checkout.id);
          
          processed++;
          console.log("[Abandoned Cart] Processed checkout for:", checkout.email, "Coupon:", couponCode);
        } else {
          failed++;
        }

      } catch (err) {
        console.error("[Abandoned Cart] Error processing checkout:", checkout.id, err);
        failed++;
      }
    }

    console.log("[Abandoned Cart] Job completed. Processed:", processed, "Failed:", failed);

    return new Response(
      JSON.stringify({ 
        message: "Abandoned cart emails processed", 
        processed, 
        failed,
        total: abandonedCheckouts.length 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[Abandoned Cart] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
