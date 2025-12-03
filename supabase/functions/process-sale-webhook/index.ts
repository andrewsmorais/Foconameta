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

    const payload = await req.json();
    console.log('Received webhook payload:', JSON.stringify(payload, null, 2));

    // Extract data from Mercado Pago webhook or direct API call
    // Mercado Pago sends: action, data.id for payment
    // We support both direct data and MP format
    
    let userData: {
      email: string;
      nome: string;
      telefone?: string;
      cpf?: string;
      plan_id?: string;
    };

    // Check if it's a Mercado Pago webhook format
    if (payload.action === 'payment.created' || payload.action === 'payment.updated') {
      // For MP webhooks, we need to fetch payment details
      // This is a simplified version - in production you'd fetch from MP API
      console.log('Mercado Pago webhook received, action:', payload.action);
      
      // For now, we'll require the data to be passed directly
      // In production, implement MP API call to get payer details
      return new Response(
        JSON.stringify({ 
          message: 'Mercado Pago webhook received. Configure payment details fetch.',
          action: payload.action 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (payload.email) {
      // Direct API call with user data
      userData = {
        email: payload.email,
        nome: payload.nome || payload.name || 'Usuário',
        telefone: payload.telefone || payload.phone,
        cpf: payload.cpf,
        plan_id: payload.plan_id,
      };
    } else {
      throw new Error('Invalid payload: email is required');
    }

    console.log('Processing user data:', userData);

    // Generate provisional password
    const provisionalPassword = '1234';

    // Check if user already exists
    const { data: existingUser } = await supabaseClient.auth.admin.listUsers();
    const userExists = existingUser?.users?.find(u => u.email === userData.email);

    let userId: string;
    let isNewUser = false;

    if (userExists) {
      console.log('User already exists:', userExists.id);
      userId = userExists.id;
      
      // Reset password to provisional
      const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
        userId,
        { password: provisionalPassword }
      );
      
      if (updateError) {
        console.error('Error updating user password:', updateError);
      }
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
        email: userData.email,
        password: provisionalPassword,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: userData.nome,
        }
      });

      if (createError) {
        console.error('Error creating user:', createError);
        throw createError;
      }

      userId = newUser.user.id;
      isNewUser = true;
      console.log('New user created:', userId);

      // Create profile
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .upsert({
          id: userId,
          nome_completo: userData.nome,
          telefone: userData.telefone,
          cpf: userData.cpf,
          status: 'active',
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
      }

      // Assign default role
      const { error: roleError } = await supabaseClient
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'basic',
        });

      if (roleError) {
        console.error('Error assigning role:', roleError);
      }

      // Create subscription if plan_id provided
      if (userData.plan_id) {
        const { error: subError } = await supabaseClient
          .from('subscriptions')
          .insert({
            user_id: userId,
            plan_id: userData.plan_id,
            status: 'active',
          });

        if (subError) {
          console.error('Error creating subscription:', subError);
        }
      }
    }

    // Prepare webhook data
    const webhookData = {
      nome: userData.nome,
      email: userData.email,
      telefone: userData.telefone || '',
      cpf: userData.cpf || '',
      senha: provisionalPassword,
      is_new_user: isNewUser,
      user_id: userId,
    };

    // Get active webhooks for sale_approved event
    const { data: webhooks, error: webhooksError } = await supabaseClient
      .from('webhook_config')
      .select('*')
      .eq('event_type', 'sale_approved')
      .eq('is_active', true);

    if (webhooksError) {
      console.error('Error fetching webhooks:', webhooksError);
    }

    // Send to all configured webhooks
    const webhookResults = [];
    if (webhooks && webhooks.length > 0) {
      for (const webhook of webhooks) {
        try {
          const response = await fetch(webhook.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              event: 'sale_approved',
              timestamp: new Date().toISOString(),
              data: webhookData,
            }),
          });

          webhookResults.push({
            webhook: webhook.name,
            success: response.ok,
            status: response.status,
          });
          
          console.log(`Webhook ${webhook.name} sent:`, response.ok);
        } catch (error) {
          console.error(`Error sending webhook ${webhook.name}:`, error);
          webhookResults.push({
            webhook: webhook.name,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: isNewUser ? 'Usuário criado com sucesso' : 'Senha resetada com sucesso',
        user_id: userId,
        email: userData.email,
        is_new_user: isNewUser,
        webhooks_sent: webhookResults.length,
        webhook_results: webhookResults,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in process-sale-webhook:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
