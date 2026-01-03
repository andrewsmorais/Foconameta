import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN");

// Preços dos planos no Mercado Pago
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("[create-checkout] Received body:", JSON.stringify(body));
    
    const { planType, email } = body;

    if (!planType || !PLANS[planType as keyof typeof PLANS]) {
      console.log("[create-checkout] Error: Invalid planType:", planType);
      return new Response(
        JSON.stringify({ 
          error: "Plano inválido. Use 'mensal' ou 'anual'.",
          details: `planType '${planType}' não reconhecido`
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log("[create-checkout] Processing planType:", planType);

    if (!MP_ACCESS_TOKEN) {
      console.error("[create-checkout] MP_ACCESS_TOKEN not configured");
      return new Response(
        JSON.stringify({ error: "Mercado Pago não configurado" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    const origin = req.headers.get("origin") || "https://bateuameta.com";
    const plan = PLANS[planType as keyof typeof PLANS];

    // Criar PreApproval (assinatura) no Mercado Pago
    const preapprovalData: Record<string, unknown> = {
      reason: plan.reason,
      auto_recurring: plan.auto_recurring,
      back_url: `${origin}/auth?payment_success=true`,
    };

    // Só adiciona payer_email se foi fornecido
    if (email) {
      preapprovalData.payer_email = email;
    }

    console.log("[create-checkout] Creating preapproval:", JSON.stringify(preapprovalData));

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
      console.error("[create-checkout] Mercado Pago API error:", JSON.stringify(data));
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

    console.log("[create-checkout] PreApproval created:", data.id);
    console.log("[create-checkout] Redirecting to Mercado Pago:", data.init_point);

    return new Response(JSON.stringify({ url: data.init_point }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[create-checkout] Error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
