import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN");

// Preços dos planos
const PLANS = {
  mensal: {
    title: "Bateu a Meta - Plano Mensal",
    unit_price: 12.90,
    period: "mensal",
  },
  anual: {
    title: "Bateu a Meta - Plano Anual",
    unit_price: 97.90,
    period: "anual",
  },
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("[MP Preference] Received body:", JSON.stringify(body));

    const { planType, email } = body;

    if (!planType || !PLANS[planType as keyof typeof PLANS]) {
      console.log("[MP Preference] Error: Invalid plan type:", planType);
      return new Response(
        JSON.stringify({ error: "Tipo de plano inválido. Use 'mensal' ou 'anual'" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    if (!MP_ACCESS_TOKEN) {
      console.error("[MP Preference] MP_ACCESS_TOKEN not configured");
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

    // Criar Preference (pagamento único) no Mercado Pago
    // Permite PIX e Cartão de Crédito
    const preferenceData: Record<string, unknown> = {
      items: [
        {
          title: plan.title,
          quantity: 1,
          unit_price: plan.unit_price,
          currency_id: "BRL",
        },
      ],
      payment_methods: {
        // Permite PIX e Cartão de Crédito (exclui débito e boleto)
        excluded_payment_types: [
          { id: "debit_card" },
          { id: "ticket" }
        ],
        excluded_payment_methods: [],
      },
      back_urls: {
        success: `${origin}/auth?payment_success=true&plan=${planType}`,
        failure: `${origin}/planos?payment=failed`,
        pending: `${origin}/auth?payment_pending=true&plan=${planType}`,
      },
      auto_return: "approved",
      external_reference: `${planType}_${Date.now()}`, // Para identificar o plano no webhook
      notification_url: "https://grfyoqsbypvvuzdudtgu.supabase.co/functions/v1/mercadopago-payment-webhook",
    };

    // Adiciona email do pagador se fornecido
    if (email) {
      preferenceData.payer = { email };
      console.log("[MP Preference] Adding payer email:", email);
    }

    console.log("[MP Preference] Creating preference:", JSON.stringify(preferenceData));

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preferenceData),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[MP Preference] Mercado Pago API error:", JSON.stringify(data));
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

    console.log("[MP Preference] Preference created successfully:", data.id);

    const isTestToken = typeof MP_ACCESS_TOKEN === "string" && MP_ACCESS_TOKEN.startsWith("TEST-");
    const checkoutUrl = (isTestToken && data?.sandbox_init_point) ? data.sandbox_init_point : data.init_point;

    console.log("[MP Preference] Mode:", isTestToken ? "sandbox" : "production");
    console.log("[MP Preference] Checkout URL:", checkoutUrl);

    return new Response(
      JSON.stringify({
        url: checkoutUrl,
        preference_id: data.id,
        mode: isTestToken ? "sandbox" : "production",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[MP Preference] Error creating preference:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
