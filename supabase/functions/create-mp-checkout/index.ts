import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN");

// Preços dos planos em centavos
const PLANS = {
  mensal: {
    reason: "Bateu a Meta - Plano Mensal",
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: 12.90,
      currency_id: "BRL",
    },
  },
  anual: {
    reason: "Bateu a Meta - Plano Anual",
    auto_recurring: {
      frequency: 12,
      frequency_type: "months",
      transaction_amount: 97.90,
      currency_id: "BRL",
    },
  },
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("[MP Checkout] Received body:", JSON.stringify(body));

    const { planType, email } = body;

    if (!planType || !PLANS[planType as keyof typeof PLANS]) {
      console.log("[MP Checkout] Error: Invalid plan type:", planType);
      return new Response(
        JSON.stringify({ error: "Tipo de plano inválido. Use 'mensal' ou 'anual'" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const origin = req.headers.get("origin") || "https://bateuameta.com";

    // Se não tiver email, redirecionar para página React de coleta de email
    if (!email) {
      const emailFormUrl = `${origin}/finalizar-assinatura?planType=${planType}`;
      console.log("[MP Checkout] No email provided, redirecting to React page:", emailFormUrl);
      return new Response(
        JSON.stringify({ url: emailFormUrl }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    if (!MP_ACCESS_TOKEN) {
      console.error("[MP Checkout] MP_ACCESS_TOKEN not configured");
      return new Response(
        JSON.stringify({ error: "Mercado Pago não configurado" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    const plan = PLANS[planType as keyof typeof PLANS];

    // Criar PreApproval (assinatura) no Mercado Pago
    const preapprovalData = {
      reason: plan.reason,
      auto_recurring: plan.auto_recurring,
      back_url: `${origin}/auth?payment_success=true`,
      payer_email: email,
    };

    console.log("[MP Checkout] Creating preapproval:", JSON.stringify(preapprovalData));

    const response = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preapprovalData),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[MP Checkout] Mercado Pago API error:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ 
          error: data.message || "Erro ao criar checkout", 
          details: data 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: response.status,
        }
      );
    }

    console.log("[MP Checkout] PreApproval created successfully:", data.id);
    console.log("[MP Checkout] Init point:", data.init_point);

    return new Response(
      JSON.stringify({ 
        url: data.init_point,
        preapproval_id: data.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[MP Checkout] Error creating checkout:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
