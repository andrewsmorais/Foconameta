import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");

async function sendWelcomeEmail(email: string, name: string, password: string) {
  console.log(`Sending welcome email to ${email}`);
  
  const appUrl = "https://bateuameta.com";
  
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Bem-vindo ao Bateu A Meta!</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #15a249 0%, #0d7a35 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🚗 Bateu A Meta</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Sua assinatura foi aprovada!</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #15a249; margin-top: 0;">Olá, ${name || 'Motorista'}!</h2>
        
        <p>Parabéns! Sua assinatura do <strong>Bateu A Meta</strong> foi aprovada com sucesso. Agora você tem acesso completo ao dashboard financeiro mais completo para motoristas de aplicativo.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #15a249;">
          <h3 style="margin-top: 0; color: #333;">📧 Seus dados de acesso:</h3>
          <p style="margin: 5px 0;"><strong>Usuário:</strong> ${email}</p>
          <p style="margin: 5px 0;"><strong>Senha:</strong> ${password}</p>
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #856404;"><strong>⚠️ Importante:</strong> Recomendamos que você altere sua senha após o primeiro acesso nas configurações do aplicativo.</p>
        </div>
        
        <h3 style="color: #15a249;">🎯 O QUE FAZER AGORA:</h3>
        <ol style="padding-left: 20px;">
          <li style="margin-bottom: 10px;">Clique no botão abaixo para acessar o aplicativo</li>
          <li style="margin-bottom: 10px;">Cadastre seu veículo e registre seu primeiro turno</li>
          <li style="margin-bottom: 10px;">Acompanhe seu lucro líquido real no Dashboard</li>
        </ol>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${appUrl}/auth?payment_success=true" style="background: #15a249; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">ENTRAR NO APLICATIVO</a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="color: #666; font-size: 14px;">
          <strong>Precisa de ajuda?</strong><br>
          📱 WhatsApp: (12) 98179-6135<br>
          📸 Instagram: @bateu_meta
        </p>
        
        <p style="color: #999; font-size: 12px; margin-top: 20px;">
          Este email foi enviado automaticamente pelo sistema Bateu A Meta.<br>
          © 2024 Bateu A Meta - Todos os direitos reservados.
        </p>
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
        name: "Bateu A Meta",
        email: "suporte@bateuameta.com",
      },
      to: [{ email }],
      subject: "🚗 Acesso Liberado! Sua assinatura foi aprovada - Bateu A Meta",
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
    const { email } = await req.json();

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
    const tempPassword = crypto.randomUUID().slice(0, 12);

    // Update user password
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: tempPassword,
    });

    if (updateError) {
      console.error("Error updating password:", updateError);
      throw new Error("Failed to update password");
    }

    // Send welcome email
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
