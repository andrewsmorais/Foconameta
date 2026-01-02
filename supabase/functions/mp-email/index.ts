import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN");
const SUPABASE_URL = "https://grfyoqsbypvvuzdudtgu.supabase.co";

const ALLOWED_ORIGINS = [
  "https://bateuameta.com",
  "https://www.bateuameta.com",
  "https://bateuameta.lovable.app",
];

const PLANS = {
  mensal: {
    name: "Mensal",
    price: "R$ 12,90/mês",
    reason: "Bateu a Meta - Plano Mensal",
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: 12.90,
      currency_id: "BRL",
    },
  },
  anual: {
    name: "Anual",
    price: "R$ 97,90/ano",
    reason: "Bateu a Meta - Plano Anual",
    auto_recurring: {
      frequency: 12,
      frequency_type: "months",
      transaction_amount: 97.90,
      currency_id: "BRL",
    },
  },
};

function sanitizeOrigin(origin: string | null): string {
  if (origin && ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed.replace("https://", "https://")) || origin.includes("lovable.app"))) {
    return origin;
  }
  return "https://bateuameta.com";
}

// URL da página HTML estática no Storage (não serve HTML via Edge Function)
function getStoragePageUrl(planType: string, origin: string, error?: string): string {
  let url = `${SUPABASE_URL}/storage/v1/object/public/public-pages/checkout-email.html?planType=${planType}&origin=${encodeURIComponent(origin)}`;
  if (error) {
    url += `&error=${encodeURIComponent(error)}`;
  }
  return url;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  const url = new URL(req.url);
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  // GET: Redireciona para a página HTML no Storage
  // Edge Functions em *.supabase.co não servem HTML corretamente (Content-Type vira text/plain)
  if (req.method === "GET") {
    const planType = url.searchParams.get("planType") || "mensal";
    const origin = sanitizeOrigin(url.searchParams.get("origin"));
    const error = url.searchParams.get("error");
    
    const storageUrl = getStoragePageUrl(planType, origin, error || undefined);
    console.log("[mp-email] GET - Redirecting to Storage page:", storageUrl);
    
    return Response.redirect(storageUrl, 303);
  }
  
  // POST: Process form and create preapproval
  if (req.method === "POST") {
    try {
      const formData = await req.formData();
      const email = formData.get("email")?.toString().trim();
      const planType = formData.get("planType")?.toString() || "mensal";
      const origin = sanitizeOrigin(formData.get("origin")?.toString() || null);
      
      console.log("[mp-email] POST - email:", email, "planType:", planType, "origin:", origin);
      
      // Validate email
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        const storageUrl = getStoragePageUrl(planType, origin, "Por favor, insira um e-mail válido.");
        console.log("[mp-email] Invalid email, redirecting back:", storageUrl);
        return Response.redirect(storageUrl, 303);
      }
      
      // Check MP token
      if (!MP_ACCESS_TOKEN) {
        console.error("[mp-email] MP_ACCESS_TOKEN not configured");
        const storageUrl = getStoragePageUrl(planType, origin, "Erro de configuração. Tente novamente mais tarde.");
        return Response.redirect(storageUrl, 303);
      }
      
      const plan = PLANS[planType as keyof typeof PLANS] || PLANS.mensal;
      
      // Create PreApproval
      const preapprovalData = {
        reason: plan.reason,
        auto_recurring: plan.auto_recurring,
        back_url: `${origin}/auth?payment_success=true`,
        payer_email: email,
      };
      
      console.log("[mp-email] Creating preapproval:", JSON.stringify(preapprovalData));
      
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
        console.error("[mp-email] Mercado Pago error:", JSON.stringify(data));
        const storageUrl = getStoragePageUrl(planType, origin, "Erro ao processar. Tente novamente.");
        return Response.redirect(storageUrl, 303);
      }
      
      console.log("[mp-email] PreApproval created:", data.id);
      console.log("[mp-email] Redirecting to Mercado Pago:", data.init_point);
      
      // Redirect to Mercado Pago checkout
      return Response.redirect(data.init_point, 303);
      
    } catch (error) {
      console.error("[mp-email] Error:", error);
      const planType = url.searchParams.get("planType") || "mensal";
      const storageUrl = getStoragePageUrl(planType, "https://bateuameta.com", "Erro inesperado. Tente novamente.");
      return Response.redirect(storageUrl, 303);
    }
  }
  
  return new Response("Method not allowed", { status: 405 });
});
