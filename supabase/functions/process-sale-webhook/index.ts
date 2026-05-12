import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate random 6-digit password
function generateRandomPassword(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send welcome email via Brevo
async function sendWelcomeEmail(email: string, name: string, password: string): Promise<void> {
  const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
  
  if (!BREVO_API_KEY) {
    console.error("[Process Sale] BREVO_API_KEY not configured");
    return;
  }

  try {
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bem-vindo ao Bateu A Meta!</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f5f5f5;">
        <!-- Header Verde -->
        <div style="background: linear-gradient(135deg, #15a249 0%, #0d7a35 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🚗 Bateu A Meta</h1>
        </div>
        
        <!-- Conteúdo Principal -->
        <div style="background: #ffffff; padding: 30px;">
          <!-- Saudação -->
          <h2 style="color: #333; margin-top: 0; font-size: 24px;">Olá, ${name}! 🎉</h2>
          
          <!-- Mensagem do Andrews -->
          <p style="font-size: 16px; color: #333; line-height: 1.8;">
            Aqui é o <strong>Andrews Morais</strong>. Fico feliz em ter você conosco! A partir de agora, você não vai mais "bater lata" sem saber o seu lucro. Você tem em mãos a ferramenta certa para dominar suas finanças e bater suas metas com inteligência.
          </p>
          
          <!-- Box de Dados de Acesso -->
          <div style="background: #ffffff; padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #15a249; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">🔑 SEUS DADOS DE ACESSO:</h3>
            <p style="font-size: 16px; margin: 8px 0; color: #333;">
              <strong>Usuário:</strong> ${email}
            </p>
            <p style="font-size: 16px; margin: 8px 0; color: #333;">
              <strong>Senha:</strong> ${password}
            </p>
            <p style="font-size: 14px; color: #666; margin: 15px 0 0 0; font-style: italic;">
              (Dica: Guarde este e-mail ou tire um print para consultas futuras)
            </p>
          </div>
          
          <!-- Seção Manual do App -->
          <div style="margin: 25px 0;">
            <h3 style="color: #333; margin: 0 0 10px 0; font-size: 18px;">📺 PASSO A PASSO (MANUAL DO APP):</h3>
            <p style="font-size: 16px; color: #333; margin: 0 0 15px 0;">
              Antes de começar, assista ao vídeo rápido que preparei explicando como funciona cada detalhe do aplicativo:
            </p>
            <div style="text-align: center;">
              <a href="https://www.youtube.com/watch?v=8mqtvi0tvsU" style="display: inline-block; background-color: #FF0000; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
                ▶️ Assistir ao Manual no YouTube
              </a>
            </div>
          </div>
          
          <!-- Botão Principal -->
          <div style="margin: 30px 0;">
            <h3 style="color: #333; margin: 0 0 10px 0; font-size: 18px;">🚀 COMECE AGORA:</h3>
            <p style="font-size: 16px; color: #333; margin: 0 0 15px 0;">
              Clique no botão abaixo para acessar a área de login e cadastrar seu primeiro turno:
            </p>
            <div style="text-align: center;">
              <a href="https://bateuameta.com/auth?payment_success=true" style="display: inline-block; background-color: #25D366; color: white; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold;">
                👉 ENTRAR NO APLICATIVO AGORA
              </a>
            </div>
          </div>
          
          <!-- Links Úteis -->
          <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 25px 0;">
            <h3 style="color: #333; margin: 0 0 15px 0; font-size: 16px;">📌 LINKS ÚTEIS:</h3>
            <p style="font-size: 15px; margin: 8px 0; color: #333;">
              • Nosso Site: <a href="https://bateuameta.com" style="color: #15a249; text-decoration: none;">bateuameta.com</a>
            </p>
            <p style="font-size: 15px; margin: 8px 0; color: #333;">
              • Dúvidas ou Suporte: <a href="https://wa.me/5512981387508" style="color: #25D366; text-decoration: none;">Chamar no WhatsApp</a>
            </p>
            <p style="font-size: 15px; margin: 8px 0; color: #333;">
              • Instagram: <a href="https://www.instagram.com/bateu_meta/" style="color: #E1306C; text-decoration: none;">@bateu_meta</a>
            </p>
          </div>
          
          <!-- Assinatura -->
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="font-size: 16px; color: #333; margin: 0; font-weight: bold;">
              Tamo junto no trecho! 🚗
            </p>
            <p style="font-size: 16px; color: #666; margin: 5px 0 0 0;">
              Andrews Morais & Equipe Bateu a Meta
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "Bateu A Meta", email: "suporte@bateuameta.com" },
        to: [{ email: email, name: name || "Usuário" }],
        subject: "Bem-vindo ao Bateu a Meta, " + (name || "Motorista") + "! 🎉 Seus dados de acesso estão aqui",
        htmlContent: emailHtml,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Process Sale] Brevo API error:", errorText);
    } else {
      console.log("[Process Sale] Welcome email sent successfully to:", email);
    }
  } catch (error) {
    console.error("[Process Sale] Error sending welcome email:", error);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const body = await req.json();
    const { email, nome, telefone, cpf, plan_id } = body;

    console.log("[Process Sale] Received request:", { email, nome, plan_id });

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    let user = existingUsers?.users?.find(u => u.email === email);

    // Generate random 6-digit password
    const provisionalPassword = generateRandomPassword();
    let isNewUser = false;

    if (!user) {
      // Create new user with random 6-digit password
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: provisionalPassword,
        email_confirm: true,
        user_metadata: {
          full_name: nome || "Usuário",
        },
      });

      if (createError) {
        console.error("[Process Sale] Error creating user:", createError);
        return new Response(
          JSON.stringify({ error: "Error creating user: " + createError.message }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      user = newUser.user;
      isNewUser = true;
      console.log("[Process Sale] New user created:", user.id);
    } else {
      console.log("[Process Sale] User already exists:", user.id);
    }

    // Create or update profile with provisional password
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: user.id,
        nome_completo: nome || "Usuário",
        telefone: telefone || null,
        cpf: cpf || null,
        status: "active",
        provisional_password: isNewUser ? provisionalPassword : undefined,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });

    if (profileError) {
      console.error("[Process Sale] Profile error:", profileError);
    }

    // Get plan details to determine role
    let planName = "free";
    let isFreeUser = true;

    if (plan_id) {
      const { data: plan } = await supabaseAdmin
        .from("plans")
        .select("name, price")
        .eq("id", plan_id)
        .maybeSingle();

      if (plan) {
        planName = plan.name.toLowerCase();
        // If plan has price > 0, it's not free
        isFreeUser = plan.price === 0 || planName === "free";
        console.log("[Process Sale] Plan found:", planName, "isFreeUser:", isFreeUser);
      }
    }

    // Determine role based on plan
    const role = isFreeUser ? "free" : "premium";

    // Update or insert user role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({
        user_id: user.id,
        role: role,
      }, { onConflict: "user_id,role" });

    if (roleError) {
      console.error("[Process Sale] Role error:", roleError);
    }

    console.log("[Process Sale] Assigned role:", role);

    // If not a free user, create subscription
    if (!isFreeUser && plan_id) {
      const now = new Date();
      const expiresAt = new Date(now.setFullYear(now.getFullYear() + 1)).toISOString();

      const { data: newSubscription, error: subError } = await supabaseAdmin
        .from("subscriptions")
        .upsert({
          user_id: user.id,
          plan_id: plan_id,
          status: "active",
          started_at: new Date().toISOString(),
          expires_at: expiresAt,
        }, { onConflict: "user_id" })
        .select("id")
        .single();

      if (subError) {
        console.error("[Process Sale] Subscription error:", subError);
      } else {
        // Update profile with subscription_id
        await supabaseAdmin
          .from("profiles")
          .update({ subscription_id: newSubscription.id })
          .eq("id", user.id);
        
        console.log("[Process Sale] Subscription created:", newSubscription.id);
      }
    }

    // Send welcome email to new users
    if (isNewUser) {
      await sendWelcomeEmail(email, nome || "Usuário", provisionalPassword);
      console.log("[Process Sale] Welcome email triggered for new user");
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: user.id,
        email: email,
        role: role,
        is_new_user: isNewUser,
        password: isNewUser ? provisionalPassword : undefined,
        message: isNewUser 
          ? `Usuário criado com sucesso. Senha: ${provisionalPassword}. E-mail enviado.` 
          : "Usuário atualizado com sucesso",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[Process Sale] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
