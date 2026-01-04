import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN");

// Plan prices
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
    console.log("[MP Card Payment] Received body:", JSON.stringify({
      ...body,
      token: body.token ? "***REDACTED***" : undefined,
    }));

    const { 
      planType, 
      token, 
      payment_method_id, 
      issuer_id, 
      installments,
      payer 
    } = body;

    // Validate plan type
    if (!planType || !PLANS[planType as keyof typeof PLANS]) {
      console.log("[MP Card Payment] Error: Invalid plan type:", planType);
      return new Response(
        JSON.stringify({ error: "Tipo de plano inválido. Use 'mensal' ou 'anual'" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Validate required fields
    if (!token) {
      console.log("[MP Card Payment] Error: Token is required");
      return new Response(
        JSON.stringify({ error: "Token do cartão é obrigatório" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    if (!payer?.email) {
      console.log("[MP Card Payment] Error: Payer email is required");
      return new Response(
        JSON.stringify({ error: "Email do pagador é obrigatório" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    if (!MP_ACCESS_TOKEN) {
      console.error("[MP Card Payment] MP_ACCESS_TOKEN not configured");
      return new Response(
        JSON.stringify({ error: "Mercado Pago não configurado" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    const plan = PLANS[planType as keyof typeof PLANS];
    const idempotencyKey = `card_${planType}_${payer.email}_${Date.now()}`;

    // Montar nome completo
    const fullName = `${payer.first_name || ""} ${payer.last_name || ""}`.trim();

    // Create card payment
    const paymentData: Record<string, unknown> = {
      transaction_amount: plan.unit_price,
      token: token,
      description: plan.title,
      installments: installments || 1,
      payment_method_id: payment_method_id,
      payer: {
        email: payer.email,
        identification: payer.identification,
        first_name: payer.first_name,
        last_name: payer.last_name,
      },
      external_reference: JSON.stringify({
        planType,
        fullName,
        phone: payer.phone || "",
        cpf: payer.identification?.number || "",
        timestamp: Date.now(),
      }),
      notification_url: "https://grfyoqsbypvvuzdudtgu.supabase.co/functions/v1/mercadopago-payment-webhook",
    };

    // Add issuer_id if provided
    if (issuer_id) {
      paymentData.issuer_id = issuer_id;
    }

    console.log("[MP Card Payment] Creating payment with data:", JSON.stringify({
      ...paymentData,
      token: "***REDACTED***",
    }));

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
      console.error("[MP Card Payment] Mercado Pago API error:", JSON.stringify(data));
      
      // Handle specific error messages
      let errorMessage = "Erro ao processar pagamento";
      if (data.cause && data.cause.length > 0) {
        const cause = data.cause[0];
        if (cause.code === "cc_rejected_bad_filled_card_number") {
          errorMessage = "Número do cartão inválido";
        } else if (cause.code === "cc_rejected_bad_filled_date") {
          errorMessage = "Data de validade inválida";
        } else if (cause.code === "cc_rejected_bad_filled_security_code") {
          errorMessage = "Código de segurança inválido";
        } else if (cause.code === "cc_rejected_insufficient_amount") {
          errorMessage = "Saldo insuficiente";
        } else if (cause.code === "cc_rejected_call_for_authorize") {
          errorMessage = "Você deve autorizar esta compra com sua operadora";
        } else if (cause.code === "cc_rejected_card_disabled") {
          errorMessage = "Cartão desabilitado. Contate sua operadora";
        } else if (cause.code === "cc_rejected_duplicated_payment") {
          errorMessage = "Pagamento duplicado";
        } else if (cause.code === "cc_rejected_high_risk") {
          errorMessage = "Pagamento rejeitado por segurança";
        }
      }

      return new Response(
        JSON.stringify({ 
          error: errorMessage, 
          details: data,
          status: data.status,
          status_detail: data.status_detail,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: response.status,
        }
      );
    }

    console.log("[MP Card Payment] Payment created successfully:", data.id);
    console.log("[MP Card Payment] Status:", data.status);
    console.log("[MP Card Payment] Status detail:", data.status_detail);

    return new Response(
      JSON.stringify({
        payment_id: data.id,
        status: data.status,
        status_detail: data.status_detail,
        payment_method_id: data.payment_method_id,
        installments: data.installments,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[MP Card Payment] Error creating payment:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
