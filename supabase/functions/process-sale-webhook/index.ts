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

    const provisionalPassword = "1234";
    let isNewUser = false;

    if (!user) {
      // Create new user with provisional password
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

    // Create or update profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: user.id,
        nome_completo: nome || "Usuário",
        telefone: telefone || null,
        cpf: cpf || null,
        status: "active",
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

    // Initialize default goals for new users
    if (isNewUser) {
      try {
        // The trigger should handle this, but we can also call it manually if needed
        console.log("[Process Sale] New user goals will be initialized by trigger");
      } catch (goalError) {
        console.error("[Process Sale] Error initializing goals:", goalError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: user.id,
        email: email,
        role: role,
        is_new_user: isNewUser,
        message: isNewUser 
          ? `Usuário criado com sucesso. Senha provisória: ${provisionalPassword}` 
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
