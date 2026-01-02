import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN");

// Mapeamento dos antigos priceId do Stripe para planType do Mercado Pago
const STRIPE_TO_MP_MAP: Record<string, string> = {
  "price_1SdmK9K6aMDv1DOlgCL7bq41": "mensal",
  "price_1SdmJnK6aMDv1DOlafIvA9GC": "anual",
};

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
    console.log("[create-checkout -> MP] Received body:", JSON.stringify(body));
    
    const { priceId, email } = body;

    // Mapear priceId do Stripe para planType do Mercado Pago
    const planType = STRIPE_TO_MP_MAP[priceId];
    
    if (!planType) {
      console.log("[create-checkout -> MP] Error: Unknown priceId:", priceId);
      return new Response(
        JSON.stringify({ 
          error: "Plano inválido. Stripe desativado - use Mercado Pago.",
          details: `priceId '${priceId}' não reconhecido`
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log("[create-checkout -> MP] Mapped to planType:", planType);

    const origin = req.headers.get("origin") || "https://bateuameta.com";
    const supabaseUrl = "https://grfyoqsbypvvuzdudtgu.supabase.co";

    // Se não tiver email, redirecionar para Edge Function HTML de coleta de email
    // Isso funciona para qualquer versão do app (inclusive cache/PWA antigo)
    if (!email) {
      const redirectUrl = `${supabaseUrl}/functions/v1/mp-email?planType=${planType}&origin=${encodeURIComponent(origin)}`;
      console.log("[create-checkout -> MP] No email provided, redirecting to mp-email:", redirectUrl);
      return new Response(
        JSON.stringify({ url: redirectUrl }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    if (!MP_ACCESS_TOKEN) {
      console.error("[create-checkout -> MP] MP_ACCESS_TOKEN not configured");
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

    console.log("[create-checkout -> MP] Creating preapproval:", JSON.stringify(preapprovalData));

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
      console.error("[create-checkout -> MP] Mercado Pago API error:", JSON.stringify(data));
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

    console.log("[create-checkout -> MP] PreApproval created:", data.id);
    console.log("[create-checkout -> MP] Redirecting to Mercado Pago:", data.init_point);

    // Retorna no mesmo formato que o Stripe retornava para compatibilidade
    return new Response(JSON.stringify({ url: data.init_point }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[create-checkout -> MP] Error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
