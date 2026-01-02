import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN");

const ALLOWED_ORIGINS = [
  "https://bateuameta.com",
  "https://www.bateuameta.com",
  "https://bateuameta.lovable.app",
];

const PLANS = {
  mensal: {
    name: "Plano Mensal",
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
    name: "Plano Anual",
    price: "R$ 97,90/ano (economia de 37%)",
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

// Gera o HTML do formulário de email diretamente
function generateEmailFormHTML(planType: string, origin: string, error?: string): string {
  const plan = PLANS[planType as keyof typeof PLANS] || PLANS.mensal;
  const errorHtml = error 
    ? `<div class="error-message show">${error}</div>` 
    : '<div class="error-message" id="errorMessage"></div>';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Finalizar Assinatura - Bateu a Meta</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      color: #fff;
    }
    .container {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 32px;
      max-width: 400px;
      width: 100%;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }
    .logo {
      text-align: center;
      margin-bottom: 24px;
    }
    .logo h1 {
      font-size: 24px;
      font-weight: 700;
      background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .plan-info {
      background: rgba(249, 115, 22, 0.1);
      border: 1px solid rgba(249, 115, 22, 0.3);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 24px;
      text-align: center;
    }
    .plan-name {
      font-size: 18px;
      font-weight: 600;
      color: #f97316;
      margin-bottom: 4px;
    }
    .plan-price {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.7);
    }
    .error-message {
      background: rgba(239, 68, 68, 0.2);
      border: 1px solid rgba(239, 68, 68, 0.5);
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 16px;
      color: #fca5a5;
      font-size: 14px;
      display: none;
    }
    .error-message.show { display: block; }
    label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 8px;
      color: rgba(255, 255, 255, 0.9);
    }
    input[type="email"] {
      width: 100%;
      padding: 14px 16px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.05);
      color: #fff;
      font-size: 16px;
      margin-bottom: 20px;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    input[type="email"]:focus {
      outline: none;
      border-color: #f97316;
      box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.2);
    }
    input[type="email"]::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }
    button {
      width: 100%;
      padding: 14px 24px;
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      border: none;
      border-radius: 10px;
      color: #fff;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    button:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(249, 115, 22, 0.4);
    }
    button:active {
      transform: translateY(0);
    }
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
    .secure-note {
      text-align: center;
      margin-top: 16px;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.5);
    }
    .secure-note svg {
      width: 14px;
      height: 14px;
      vertical-align: middle;
      margin-right: 4px;
    }
    .back-link {
      display: block;
      text-align: center;
      margin-top: 20px;
      color: rgba(255, 255, 255, 0.6);
      text-decoration: none;
      font-size: 14px;
      transition: color 0.2s;
    }
    .back-link:hover {
      color: #f97316;
    }
    .spinner {
      display: none;
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-right: 8px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .btn-content {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <h1>🎯 Bateu a Meta</h1>
    </div>
    
    <div class="plan-info">
      <div class="plan-name">${plan.name}</div>
      <div class="plan-price">${plan.price}</div>
    </div>
    
    ${errorHtml}
    
    <form id="checkoutForm" method="POST" action="https://grfyoqsbypvvuzdudtgu.supabase.co/functions/v1/mp-email">
      <input type="hidden" name="planType" value="${planType}">
      <input type="hidden" name="origin" value="${origin}">
      
      <label for="email">Seu e-mail</label>
      <input 
        type="email" 
        id="email" 
        name="email" 
        placeholder="seu@email.com" 
        required 
        autocomplete="email"
      >
      
      <button type="submit" id="submitBtn">
        <span class="btn-content">
          <span class="spinner" id="spinner"></span>
          <span id="btnText">Continuar para pagamento</span>
        </span>
      </button>
    </form>
    
    <p class="secure-note">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
      Pagamento processado com segurança via Mercado Pago
    </p>
    
    <a href="${origin}" class="back-link">← Voltar</a>
  </div>

  <script>
    (function() {
      const form = document.getElementById('checkoutForm');
      const submitBtn = document.getElementById('submitBtn');
      const spinner = document.getElementById('spinner');
      const btnText = document.getElementById('btnText');

      form.addEventListener('submit', function() {
        submitBtn.disabled = true;
        spinner.style.display = 'block';
        btnText.textContent = 'Processando...';
      });
    })();
  </script>
</body>
</html>`;
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
  
  // GET: Serve o HTML diretamente
  if (req.method === "GET") {
    const planType = url.searchParams.get("planType") || "mensal";
    const origin = sanitizeOrigin(url.searchParams.get("origin"));
    const error = url.searchParams.get("error") || undefined;
    
    console.log("[mp-email] GET - Serving HTML directly for planType:", planType, "origin:", origin);
    
    const html = generateEmailFormHTML(planType, origin, error);
    
    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
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
        console.log("[mp-email] Invalid email, returning form with error");
        const html = generateEmailFormHTML(planType, origin, "Por favor, insira um e-mail válido.");
        return new Response(html, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }
      
      // Check MP token
      if (!MP_ACCESS_TOKEN) {
        console.error("[mp-email] MP_ACCESS_TOKEN not configured");
        const html = generateEmailFormHTML(planType, origin, "Erro de configuração. Tente novamente mais tarde.");
        return new Response(html, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
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
        const html = generateEmailFormHTML(planType, origin, "Erro ao processar. Tente novamente.");
        return new Response(html, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }
      
      console.log("[mp-email] PreApproval created:", data.id);
      console.log("[mp-email] Redirecting to Mercado Pago:", data.init_point);
      
      // Redirect to Mercado Pago checkout
      return Response.redirect(data.init_point, 303);
      
    } catch (error) {
      console.error("[mp-email] Error:", error);
      const html = generateEmailFormHTML("mensal", "https://bateuameta.com", "Erro inesperado. Tente novamente.");
      return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
  }
  
  return new Response("Method not allowed", { status: 405 });
});
