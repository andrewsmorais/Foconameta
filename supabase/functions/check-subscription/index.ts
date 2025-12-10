import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(JSON.stringify({ hasActiveSubscription: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check if user is super admin (always has access)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: isSuperAdmin } = await supabaseAdmin.rpc("is_super_admin", {
      _user_id: user.id,
    });

    if (isSuperAdmin) {
      console.log("User is super admin, granting access:", user.id);
      return new Response(JSON.stringify({ hasActiveSubscription: true, isSuperAdmin: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check subscription status
    const { data: subscription, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select("status, expires_at")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (subError || !subscription) {
      console.log("No active subscription found for user:", user.id);
      return new Response(JSON.stringify({ hasActiveSubscription: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check if subscription is still valid
    const now = new Date();
    const expiresAt = new Date(subscription.expires_at);
    const hasActiveSubscription = subscription.status === "active" && expiresAt > now;

    console.log("Subscription check for user:", user.id, "active:", hasActiveSubscription);

    return new Response(JSON.stringify({ hasActiveSubscription }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error checking subscription:", errorMessage);
    return new Response(JSON.stringify({ hasActiveSubscription: false, error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
