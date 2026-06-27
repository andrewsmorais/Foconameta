import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");

async function sendWelcomeEmail(email: string, name: string, password: string) {
  console.log(`Sending welcome email to ${email}`);
  
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Bem-vindo ao Meu Faturamento App!</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f5f5f5;">
      <!-- Header Verde -->
      <div style="background: linear-gradient(135deg, #15a249 0%, #0d7a35 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🚗 Meu Faturamento App</h1>
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
            Andrews Morais & Equipe Meu Faturamento App
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "api-key": BREVO_API_KEY!,
    },
    body: JSON.stringify({
      sender: {
        name: "Meu Faturamento App",
        email: "suporte@bateuameta.com",
      },
      to: [{ email }],
      subject: "Bem-vindo ao Meu Faturamento App, " + name + "! 🎉 Seus dados de acesso estão aqui",
      htmlContent: emailHtml,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Brevo API error:", errorText);
    throw new Error(`Failed to send email: ${errorText}`);
  }

  console.log("Welcome email sent successfully to:", email);
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json(); const { email } = body; const language = body.language || "pt";

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Resending welcome email to:", email);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error("Error listing users:", listError);
      throw new Error("Failed to list users");
    }

    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get profile for name
    const { data: profile } = await supabase
      .from("profiles")
      .select("nome_completo")
      .eq("id", user.id)
      .single();

    const name = profile?.nome_completo || "Motorista";

    // Generate a new temporary password
    const tempPassword = Math.floor(100000 + Math.random() * 900000).toString();

    // Update user password
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: tempPassword,
    });

    if (updateError) {
      console.error("Error updating password:", updateError);
      throw new Error("Failed to update password");
    }

    // Save provisional password to profile
    await supabase
      .from("profiles")
      .update({ provisional_password: tempPassword })
      .eq("id", user.id);
    await sendWelcomeEmail(email, name, tempPassword);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Welcome email resent to ${email} with new temporary password` 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in resend-welcome-email:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
