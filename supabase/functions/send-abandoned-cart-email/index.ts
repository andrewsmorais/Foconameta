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

// Preços - Desconto apenas para o plano anual
const PLAN_ANUAL = {
  original: 97.90,
  discounted: 88.11,
  savings: 9.79,
};

function generateCouponCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "ANUAL10-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function sendAbandonedCartEmail(
  email: string,
  couponCode: string
) {
  if (!BREVO_API_KEY) {
    console.error("[Abandoned Cart] BREVO_API_KEY not configured");
    return false;
  }

  const checkoutUrl = `https://pay.cakto.com.br/pxje8kx_669077?email=${encodeURIComponent(email)}`;

  // Extract name from email (before @)
  const userName = email.split("@")[0].charAt(0).toUpperCase() + email.split("@")[0].slice(1);

  const emailContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ficou parado no semáforo? Garanta seu desconto no Plano Anual!</title>
      <style>
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        .cta-button {
          animation: pulse 2s infinite;
        }
      </style>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f5f5f5;">
      <!-- Container Principal -->
      <div style="background: #ffffff; margin: 20px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        
        <!-- Header com Logo -->
        <div style="background: #ffffff; padding: 30px; text-align: center; border-top: 4px solid #25D366;">
          <h1 style="color: #25D366; margin: 0; font-size: 32px; font-weight: bold;">🚗 Bateu A Meta</h1>
        </div>
        
        <!-- Conteúdo Principal -->
        <div style="padding: 30px;">
          
          <!-- Saudação Pessoal -->
          <p style="font-size: 18px; color: #333; margin: 0 0 20px 0;">
            Olá, <strong>${userName}</strong>!
          </p>
          
          <!-- Mensagem do Andrews -->
          <p style="font-size: 16px; color: #333; line-height: 1.8; margin: 0 0 15px 0;">
            Aqui é o <strong>Andrews Morais</strong>. Notei que você começou a preencher seu acesso ao <strong>Bateu a Meta</strong>, mas não finalizou.
          </p>
          
          <p style="font-size: 16px; color: #333; line-height: 1.8; margin: 0 0 15px 0;">
            Eu sei como é a correria no trecho — às vezes entra uma corrida boa ou o sinal cai bem na hora, né?
          </p>
          
          <p style="font-size: 16px; color: #333; line-height: 1.8; margin: 0 0 25px 0;">
            Para te ajudar a ter controle total do seu lucro o ano inteiro, gerei um cupom especial de <strong>10% de desconto</strong> exclusivo para o nosso <strong>PLANO ANUAL</strong>.
          </p>
          
          <!-- Bloco do Cupom com Borda Tracejada -->
          <div style="border: 3px dashed #25D366; padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center; background: #f8fff8;">
            <p style="font-size: 24px; color: #333; margin: 0 0 10px 0;">🎁</p>
            <h2 style="color: #333; margin: 0 0 10px 0; font-size: 24px; font-weight: bold;">
              CUPOM: ANUAL10
            </h2>
            <p style="color: #25D366; font-size: 20px; font-weight: bold; margin: 0 0 15px 0;">
              (10% de DESCONTO)
            </p>
            <p style="color: #1976d2; margin: 0 0 10px 0; font-weight: bold; font-size: 14px;">
              ✨ Válido apenas para o PLANO ANUAL
            </p>
            <p style="color: #d32f2f; margin: 0; font-weight: bold; font-size: 14px;">
              ⏰ Válido pelas próximas 24 horas!
            </p>
          </div>
          
          <!-- Preço com Desconto - APENAS ANUAL -->
          <div style="background: linear-gradient(135deg, #f8fff8 0%, #e8f5e9 100%); padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center; border: 2px solid #25D366;">
            <p style="font-size: 18px; margin: 0 0 10px 0; color: #333; font-weight: bold;">
              📅 Plano Anual
            </p>
            <p style="font-size: 16px; margin: 0 0 5px 0; color: #999;">
              <span style="text-decoration: line-through;">De R$ ${PLAN_ANUAL.original.toFixed(2).replace('.', ',')}</span>
            </p>
            <p style="font-size: 28px; margin: 0 0 10px 0; color: #25D366; font-weight: bold;">
              por R$ ${PLAN_ANUAL.discounted.toFixed(2).replace('.', ',')}
            </p>
            <p style="font-size: 14px; margin: 0; color: #4caf50; font-weight: bold;">
              💰 Economize R$ ${PLAN_ANUAL.savings.toFixed(2).replace('.', ',')}!
            </p>
          </div>
          
          <!-- Botão CTA Verde com Efeito Pulsante -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${checkoutUrl}" class="cta-button" style="display: inline-block; background: #25D366; color: white; padding: 20px 45px; text-decoration: none; border-radius: 10px; font-size: 18px; font-weight: bold; text-transform: uppercase; box-shadow: 0 4px 15px rgba(37, 211, 102, 0.4);">
              RESGATAR MEU DESCONTO ANUAL
            </a>
          </div>
          
          <!-- Link do Manual -->
          <div style="text-align: center; margin: 25px 0;">
            <p style="font-size: 15px; color: #666; margin: 0;">
              Ainda tem dúvidas? 
              <a href="https://www.youtube.com/watch?v=8mqtvi0tvsU" style="color: #1976d2; text-decoration: underline; font-weight: bold;">
                Veja como o app funciona
              </a>
            </p>
          </div>
          
          <!-- Assinatura -->
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="font-size: 18px; color: #333; margin: 0; font-weight: bold;">
              Tamo junto no trecho! 🚗
            </p>
            <p style="font-size: 16px; color: #666; margin: 10px 0 0 0;">
              Andrews Morais & Equipe Bateu a Meta
            </p>
          </div>
          
          <!-- Rodapé com Contatos -->
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 25px; text-align: center;">
            <p style="font-size: 14px; color: #666; margin: 0 0 10px 0;">
              <strong>Precisa de ajuda?</strong>
            </p>
            <p style="font-size: 14px; color: #666; margin: 0;">
              <a href="https://wa.me/5512981796135" style="color: #25D366; text-decoration: none; font-weight: bold;">
                📱 WhatsApp: (12) 98179-6135
              </a>
            </p>
            <p style="font-size: 14px; color: #666; margin: 8px 0 0 0;">
              <a href="https://www.instagram.com/bateu_meta/" style="color: #E1306C; text-decoration: none; font-weight: bold;">
                📸 Instagram: @bateu_meta
              </a>
            </p>
          </div>
          
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
          name: "Andrews Morais | Bateu a Meta",
          email: "suporte@bateuameta.com",
        },
        to: [{ email }],
        subject: `🏁 Ficou parado no semáforo, ${userName}? Garanta seu desconto no Plano Anual!`,
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
      .in("status", ["pending", "abandoned"]) // Aceita ambos status para compatibilidade
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

        // Generate unique coupon code - SEMPRE para plano anual
        const couponCode = generateCouponCode();

        // Save coupon to database - SEMPRE para plano anual
        const validUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
        
        const { error: couponError } = await supabaseAdmin
          .from("discount_coupons")
          .insert({
            code: couponCode,
            email: checkout.email,
            discount_percent: 10,
            plan_type: "anual", // SEMPRE anual
            original_price: PLAN_ANUAL.original,
            discounted_price: PLAN_ANUAL.discounted,
            valid_until: validUntil,
          });

        if (couponError) {
          console.error("[Abandoned Cart] Error creating coupon:", couponError);
          failed++;
          continue;
        }

        // Send email focado no plano anual
        const emailSent = await sendAbandonedCartEmail(checkout.email, couponCode);

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
