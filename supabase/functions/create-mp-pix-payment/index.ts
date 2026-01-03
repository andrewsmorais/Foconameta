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
    console.log("[MP PIX Payment] Received body:", JSON.stringify(body));

    const { planType, email } = body;

    if (!planType || !PLANS[planType as keyof typeof PLANS]) {
      console.log("[MP PIX Payment] Error: Invalid plan type:", planType);
      return new Response(
        JSON.stringify({ error: "Tipo de plano inválido. Use 'mensal' ou 'anual'" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    if (!email) {
      console.log("[MP PIX Payment] Error: Email is required");
      return new Response(
        JSON.stringify({ error: "Email é obrigatório" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    if (!MP_ACCESS_TOKEN) {
      console.error("[MP PIX Payment] MP_ACCESS_TOKEN not configured");
      return new Response(
        JSON.stringify({ error: "Mercado Pago não configurado" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    const plan = PLANS[planType as keyof typeof PLANS];
    const idempotencyKey = `pix_${planType}_${email}_${Date.now()}`;

    // Criar Payment direto com PIX
    const paymentData = {
      transaction_amount: plan.unit_price,
      description: plan.title,
      payment_method_id: "pix",
      payer: {
        email: email,
      },
      external_reference: `${planType}_${Date.now()}`,
      notification_url: "https://grfyoqsbypvvuzdudtgu.supabase.co/functions/v1/mercadopago-payment-webhook",
    };

    console.log("[MP PIX Payment] Creating payment:", JSON.stringify(paymentData));

    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(paymentData),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[MP PIX Payment] Mercado Pago API error:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ 
          error: data.message || "Erro ao criar pagamento PIX", 
          details: data 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: response.status,
        }
      );
    }

    console.log("[MP PIX Payment] Payment created successfully:", data.id);
    console.log("[MP PIX Payment] Status:", data.status);

    // Extrair dados do PIX
    const pointOfInteraction = data.point_of_interaction;
    const transactionData = pointOfInteraction?.transaction_data;

    if (!transactionData) {
      console.error("[MP PIX Payment] No transaction data in response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ 
          error: "Dados do PIX não disponíveis", 
          details: data 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    console.log("[MP PIX Payment] PIX QR Code generated successfully");

    return new Response(
      JSON.stringify({
        payment_id: data.id,
        status: data.status,
        status_detail: data.status_detail,
        qr_code: transactionData.qr_code,
        qr_code_base64: transactionData.qr_code_base64,
        ticket_url: transactionData.ticket_url,
        expiration_date: data.date_of_expiration,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[MP PIX Payment] Error creating payment:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
