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

    // Verify authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[delete-user] No authorization header');
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: requestingUser }, error: authError } = 
      await supabaseClient.auth.getUser(token);

    if (authError || !requestingUser) {
      console.error('[delete-user] Invalid authentication:', authError);
      throw new Error('Invalid authentication');
    }

    console.log('[delete-user] Request from user:', requestingUser.email);

    let user_id = null;
    try {
      const body = await req.json();
      user_id = body?.user_id;
    } catch (e) {
      // Body might be empty
    }

    let targetUserId = user_id;

    if (!targetUserId) {
      // Self-deletion
      targetUserId = requestingUser.id;
      console.log('[delete-user] Self-deletion requested by:', targetUserId);
    } else {
      // Admin deleting another user
      const { data: roleData } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('user_id', requestingUser.id)
        .eq('role', 'super_admin')
        .maybeSingle();

      if (!roleData) {
        console.error('[delete-user] User is not super_admin:', requestingUser.id);
        throw new Error('Unauthorized: Super admin access required');
      }
    }

    console.log('[delete-user] Attempting to delete user:', targetUserId);

    // Delete user from auth.users (cascades to profiles, user_roles, subscriptions)
    const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(targetUserId);

    if (deleteError) {
      console.error('[delete-user] Error deleting user:', deleteError);
      throw deleteError;
    }

    console.log('[delete-user] User deleted successfully:', user_id);

    return new Response(
      JSON.stringify({ success: true, message: 'Usuario excluido completamente' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[delete-user] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: errorMessage.includes('Unauthorized') ? 403 : 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
