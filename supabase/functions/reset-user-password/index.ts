import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate random 6-digit password
function generateRandomPassword(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send email via Brevo
async function sendPasswordResetEmail(email: string, name: string, password: string): Promise<void> {
  const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
  
  if (!BREVO_API_KEY) {
    console.error("[Reset Password] BREVO_API_KEY not configured");
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
        sender: { name: "Meu Faturamento App", email: "suporte@bateuameta.com" },
        to: [{ email: email, name: name || "Usuário" }],
        subject: "Sua nova senha - Meu Faturamento App",
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
              .password-box { background: #fff; border: 2px dashed #10b981; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
              .password { font-size: 32px; font-weight: bold; color: #10b981; letter-spacing: 8px; }
              .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 Senha Redefinida</h1>
              </div>
              <div class="content">
                <h2>Olá, ${name || "Usuário"}!</h2>
                <p>Sua senha foi redefinida pelo administrador. Use a nova senha abaixo para acessar sua conta:</p>
                
                <div class="password-box">
                  <p style="margin: 0; color: #666;">Sua nova senha:</p>
                  <p class="password">${password}</p>
                </div>
                
                <p><strong>Importante:</strong> Recomendamos que você altere sua senha após o primeiro acesso.</p>
                
                <center>
                  <a href="https://appdriver-track.lovable.app/auth" class="button">Acessar Minha Conta</a>
                </center>
                
                <div class="footer">
                  <p>Se você não solicitou esta alteração, entre em contato conosco imediatamente.</p>
                  <p>© ${new Date().getFullYear()} Meu Faturamento App - Todos os direitos reservados</p>
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
      console.error("[Reset Password] Brevo API error:", errorText);
    } else {
      console.log("[Reset Password] Email sent successfully to:", email);
    }
  } catch (error) {
    console.error("[Reset Password] Error sending email:", error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify the request is from an authenticated super admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: requestingUser }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !requestingUser) {
      throw new Error('Invalid authentication');
    }

    // Check if requesting user is super admin
    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)
      .eq('role', 'super_admin')
      .maybeSingle();

    if (!roleData) {
      throw new Error('Unauthorized: Super admin access required');
    }

    const { user_id } = await req.json();

    if (!user_id) {
      throw new Error('user_id is required');
    }

    // Generate random 6-digit password
    const provisionalPassword = generateRandomPassword();

    console.log("[Reset Password] Resetting password for user:", user_id);

    // Reset user password
    const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
      user_id,
      { password: provisionalPassword }
    );

    if (updateError) {
      console.error('[Reset Password] Error resetting password:', updateError);
      throw updateError;
    }

    console.log('[Reset Password] Password reset successful for user:', user_id);

    // Save provisional password to profile for admin viewing
    const { error: profileUpdateError } = await supabaseClient
      .from('profiles')
      .update({ provisional_password: provisionalPassword })
      .eq('id', user_id);

    if (profileUpdateError) {
      console.error('[Reset Password] Error saving provisional password:', profileUpdateError);
    } else {
      console.log('[Reset Password] Provisional password saved to profile');
    }

    // Get user info for email and webhook notification
    const { data: { user: targetUser } } = await supabaseClient.auth.admin.getUserById(user_id);
    
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single();

    // Send email to user with new password
    if (targetUser?.email) {
      await sendPasswordResetEmail(
        targetUser.email,
        profile?.nome_completo || "Usuário",
        provisionalPassword
      );
    }

    // Get active webhooks for password_reset event
    const { data: webhooks } = await supabaseClient
      .from('webhook_config')
      .select('*')
      .eq('event_type', 'password_reset')
      .eq('is_active', true);

    // Send to configured webhooks
    if (webhooks && webhooks.length > 0) {
      for (const webhook of webhooks) {
        try {
          await fetch(webhook.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'password_reset',
              timestamp: new Date().toISOString(),
              data: {
                user_id,
                nome: profile?.nome_completo,
                telefone: profile?.telefone,
                email: targetUser?.email || '',
                senha: provisionalPassword,
              },
            }),
          });
        } catch (err) {
          console.error('[Reset Password] Webhook error:', err);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        password: provisionalPassword,
        message: 'Senha resetada com sucesso. E-mail enviado ao usuário.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Reset Password] Error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: errorMessage.includes('Unauthorized') ? 403 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
