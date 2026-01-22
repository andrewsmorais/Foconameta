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
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "Bateu A Meta", email: "suporte@bateuameta.com" },
        to: [{ email: email, name: name || "Usuário" }],
        subject: "Bem-vindo ao Bateu A Meta! 🎉",
        htmlContent: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .credentials-box { background: #fff; border: 2px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 8px; }
              .password { font-size: 28px; font-weight: bold; color: #10b981; letter-spacing: 6px; text-align: center; margin: 10px 0; }
              .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
              .feature { display: flex; align-items: center; margin: 10px 0; }
              .feature-icon { margin-right: 10px; color: #10b981; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🚗 Bem-vindo ao Bateu A Meta!</h1>
                <p>Sua conta foi criada com sucesso</p>
              </div>
              <div class="content">
                <h2>Olá, ${name || "Motorista"}!</h2>
                <p>Parabéns! Sua conta no Bateu A Meta foi criada. Agora você pode começar a controlar seus ganhos e alcançar suas metas!</p>
                
                <div class="credentials-box">
                  <p style="margin: 0 0 10px 0;"><strong>📧 Seu email:</strong> ${email}</p>
                  <p style="margin: 0;"><strong>🔐 Sua senha:</strong></p>
                  <p class="password">${password}</p>
                </div>
                
                <h3>O que você pode fazer:</h3>
                <div class="feature">
                  <span class="feature-icon">✅</span>
                  <span>Registrar seus turnos e ganhos diários</span>
                </div>
                <div class="feature">
                  <span class="feature-icon">✅</span>
                  <span>Definir metas diárias, semanais e mensais</span>
                </div>
                <div class="feature">
                  <span class="feature-icon">✅</span>
                  <span>Acompanhar relatórios detalhados</span>
                </div>
                <div class="feature">
                  <span class="feature-icon">✅</span>
                  <span>Controlar despesas com combustível e manutenção</span>
                </div>
                
                <center>
                  <a href="https://appdriver-track.lovable.app/auth" class="button">Acessar Minha Conta</a>
                </center>
                
                <div class="footer">
                  <p>Dúvidas? Responda este e-mail ou entre em contato pelo suporte.</p>
                  <p>© ${new Date().getFullYear()} Bateu A Meta - Todos os direitos reservados</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
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
