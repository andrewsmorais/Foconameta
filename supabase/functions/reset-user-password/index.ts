import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Generate or use provisional password
    const provisionalPassword = '1234';

    // Reset user password
    const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
      user_id,
      { password: provisionalPassword }
    );

    if (updateError) {
      console.error('Error resetting password:', updateError);
      throw updateError;
    }

    console.log('Password reset successful for user:', user_id);

    // Get user info for webhook notification
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single();

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
                email: '', // Would need to fetch from auth
                senha: provisionalPassword,
              },
            }),
          });
        } catch (err) {
          console.error('Webhook error:', err);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        password: provisionalPassword,
        message: 'Senha resetada com sucesso',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in reset-user-password:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: errorMessage.includes('Unauthorized') ? 403 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
