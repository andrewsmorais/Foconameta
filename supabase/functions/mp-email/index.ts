import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN");

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

function renderHTML(planType: string, origin: string, error?: string): string {
  const plan = PLANS[planType as keyof typeof PLANS] || PLANS.mensal;
  
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Finalizar Assinatura - Bateu a Meta</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #fafafa;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      padding: 32px;
      max-width: 400px;
      width: 100%;
    }
    .logo {
      text-align: center;
      margin-bottom: 24px;
    }
    .logo img {
      width: 64px;
      height: 64px;
    }
    h1 {
      font-size: 24px;
      color: #111;
      text-align: center;
      margin-bottom: 8px;
    }
    .plan-info {
      text-align: center;
      color: #666;
      margin-bottom: 24px;
    }
    .plan-info strong {
      color: #2563eb;
    }
    .error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 14px;
    }
    label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      margin-bottom: 6px;
    }
    .input-wrapper {
      position: relative;
      margin-bottom: 8px;
    }
    input[type="email"] {
      width: 100%;
      padding: 12px 12px 12px 40px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 16px;
      outline: none;
      transition: border-color 0.2s;
    }
    input[type="email"]:focus {
      border-color: #2563eb;
    }
    .email-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #9ca3af;
    }
    .hint {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 20px;
    }
    button[type="submit"] {
      width: 100%;
      padding: 14px;
      background: #15a249;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    button[type="submit"]:hover {
      background: #128a3d;
    }
    button[type="submit"]:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }
    .back-link {
      display: block;
      text-align: center;
      margin-top: 16px;
      color: #6b7280;
      text-decoration: none;
      font-size: 14px;
    }
    .back-link:hover {
      color: #374151;
    }
    .footer {
      text-align: center;
      margin-top: 20px;
      font-size: 12px;
      color: #9ca3af;
    }
    .loading {
      display: none;
    }
    form.submitting .loading {
      display: inline;
    }
    form.submitting .btn-text {
      display: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <img src="https://bateuameta.com/pwa-icon.png" alt="Bateu a Meta" onerror="this.style.display='none'">
    </div>
    <h1>Finalizar Assinatura</h1>
    <p class="plan-info">Plano <strong>${plan.name}</strong> - ${plan.price}</p>
    
    ${error ? `<div class="error">${error}</div>` : ''}
    
    <form method="POST" onsubmit="this.classList.add('submitting'); this.querySelector('button').disabled=true;">
      <input type="hidden" name="planType" value="${planType}">
      <input type="hidden" name="origin" value="${origin}">
      
      <label for="email">Seu melhor e-mail</label>
      <div class="input-wrapper">
        <svg class="email-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
          <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
        <input type="email" id="email" name="email" placeholder="seu@email.com" required>
      </div>
      <p class="hint">Você receberá seu acesso neste e-mail após a confirmação do pagamento.</p>
      
      <button type="submit">
        <span class="btn-text">Continuar para pagamento</span>
        <span class="loading">Processando...</span>
      </button>
    </form>
    
    <a href="${origin}" class="back-link">← Voltar</a>
    
    <p class="footer">Pagamento seguro processado pelo Mercado Pago</p>
  </div>
</body>
</html>`;
}

serve(async (req) => {
  const url = new URL(req.url);
  
  // GET: Render HTML form
  if (req.method === "GET") {
    const planType = url.searchParams.get("planType") || "mensal";
    const origin = sanitizeOrigin(url.searchParams.get("origin"));
    const error = url.searchParams.get("error");
    
    console.log("[mp-email] GET - planType:", planType, "origin:", origin);
    
    return new Response(renderHTML(planType, origin, error ? decodeURIComponent(error) : undefined), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
  
  // POST: Process form and create preapproval
  if (req.method === "POST") {
    try {
      const formData = await req.formData();
      const email = formData.get("email")?.toString().trim();
      const planType = formData.get("planType")?.toString() || "mensal";
      const origin = sanitizeOrigin(formData.get("origin")?.toString() || null);
      
      console.log("[mp-email] POST - email:", email, "planType:", planType);
      
      // Validate email
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        const errorMsg = encodeURIComponent("Por favor, insira um e-mail válido.");
        return Response.redirect(`${url.origin}${url.pathname}?planType=${planType}&origin=${encodeURIComponent(origin)}&error=${errorMsg}`, 303);
      }
      
      // Check MP token
      if (!MP_ACCESS_TOKEN) {
        console.error("[mp-email] MP_ACCESS_TOKEN not configured");
        const errorMsg = encodeURIComponent("Erro de configuração. Tente novamente mais tarde.");
        return Response.redirect(`${url.origin}${url.pathname}?planType=${planType}&origin=${encodeURIComponent(origin)}&error=${errorMsg}`, 303);
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
        const errorMsg = encodeURIComponent("Erro ao processar. Tente novamente.");
        return Response.redirect(`${url.origin}${url.pathname}?planType=${planType}&origin=${encodeURIComponent(origin)}&error=${errorMsg}`, 303);
      }
      
      console.log("[mp-email] PreApproval created:", data.id);
      console.log("[mp-email] Redirecting to:", data.init_point);
      
      // Redirect to Mercado Pago checkout
      return Response.redirect(data.init_point, 303);
      
    } catch (error) {
      console.error("[mp-email] Error:", error);
      const planType = url.searchParams.get("planType") || "mensal";
      const errorMsg = encodeURIComponent("Erro inesperado. Tente novamente.");
      return Response.redirect(`${url.origin}${url.pathname}?planType=${planType}&error=${errorMsg}`, 303);
    }
  }
  
  return new Response("Method not allowed", { status: 405 });
});
