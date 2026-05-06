import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is super admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "super_admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Unauthorized - Super admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Super admin verified, fetching all users...");

    // Get all users from auth.users using admin client
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error("Error fetching auth users:", authError);
      throw authError;
    }

    // Get all profiles (including provisional_password for admin viewing)
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select(`
        id,
        nome_completo,
        cpf,
        telefone,
        status,
        admin_notes,
        provisional_password,
        created_at,
        subscription_id,
        subscriptions(
          id,
          status,
          plan_id,
          started_at,
          expires_at,
          plans(name, price)
        )
      `);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }

    // Get user roles
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role");

    // Create a map of user_id -> email from auth.users
    const emailMap = new Map<string, string>();
    authUsers?.users?.forEach((authUser) => {
      if (authUser.email) {
        emailMap.set(authUser.id, authUser.email);
      }
    });

    const now = new Date();

    // Combine all data
    const usersWithEmails = profiles?.map((profile) => {
      // Handle subscriptions - can be array or single object depending on Supabase config
      const subscriptionData = profile.subscriptions;
      const subscription = Array.isArray(subscriptionData) ? subscriptionData[0] : subscriptionData;
      
      // Handle plans inside subscription
      const plansData = subscription?.plans;
      const plan = Array.isArray(plansData) ? plansData[0] : plansData;
      
      const planPrice = plan?.price || 0;
      const expiresAt = subscription?.expires_at ? new Date(subscription.expires_at) : null;

      // Calculate renewal status
      let renewal_status: "active" | "expired" | "churned" | "free" = "free";
      if (planPrice === 0 || !subscription) {
        renewal_status = "free";
      } else if (subscription.status === "active" && (!expiresAt || expiresAt > now)) {
        renewal_status = "active";
      } else if (expiresAt && expiresAt < now) {
        renewal_status = "churned";
      } else {
        renewal_status = "expired";
      }

      // Calculate days remaining
      let daysRemaining: number | null = null;
      if (expiresAt && expiresAt > now) {
        const diffTime = expiresAt.getTime() - now.getTime();
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      } else if (expiresAt && expiresAt < now) {
        daysRemaining = 0;
      }

      // Current effective plan: a cancelled/expired/refunded subscription means the user
      // is now on the Free plan, even though we keep the historical record.
      const isCurrentlyPaid =
        !!subscription &&
        subscription.status === "active" &&
        planPrice > 0 &&
        (!expiresAt || expiresAt > now);

      const currentPlanName = isCurrentlyPaid ? (plan?.name || "Free") : "Free";
      const currentPlanPrice = isCurrentlyPaid ? planPrice : 0;
      const currentPlanId = isCurrentlyPaid ? subscription?.plan_id : undefined;

      return {
        id: profile.id,
        nome_completo: profile.nome_completo,
        email: emailMap.get(profile.id) || null,
        cpf: profile.cpf,
        telefone: profile.telefone,
        status: profile.status,
        admin_notes: profile.admin_notes,
        provisional_password: profile.provisional_password,
        role: roles?.find((r) => r.user_id === profile.id)?.role || "free",
        plan: currentPlanName,
        planPrice: currentPlanPrice,
        plan_id: currentPlanId,
        subscription_id: subscription?.id,
        renewal_status,
        expires_at: subscription?.expires_at,
        started_at: subscription?.started_at,
        daysRemaining,
        created_at: profile.created_at,
      };
    });

    console.log(`Returning ${usersWithEmails?.length || 0} users with emails`);

    return new Response(JSON.stringify({ users: usersWithEmails || [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in get-admin-users:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
