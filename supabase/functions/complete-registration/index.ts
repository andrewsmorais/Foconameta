import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id, nome_completo, telefone, cpf, senha } = await req.json();

    console.log("Complete registration for session:", session_id);

    // Validate required fields
    if (!session_id || !nome_completo || !telefone || !cpf || !senha) {
      return new Response(
        JSON.stringify({ error: "Todos os campos são obrigatórios" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (senha.length < 6) {
      return new Response(
        JSON.stringify({ error: "Senha deve ter no mínimo 6 caracteres" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Get pending registration
    const { data: pendingReg, error: fetchError } = await supabaseAdmin
      .from("pending_registrations")
      .select("*")
      .eq("session_id", session_id)
      .eq("status", "pending")
      .single();

    if (fetchError || !pendingReg) {
      console.error("Pending registration not found:", fetchError);
      return new Response(
        JSON.stringify({ error: "Registro de pagamento não encontrado ou já utilizado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Check if expired
    if (new Date(pendingReg.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Este link de cadastro expirou" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const email = pendingReg.email;

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    if (existingUser) {
      // Mark as completed and return success (user already exists, they can login)
      await supabaseAdmin
        .from("pending_registrations")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", pendingReg.id);

      return new Response(
        JSON.stringify({ error: "Este email já está cadastrado. Faça login com sua senha." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Create user with the chosen password
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: senha,
      email_confirm: true,
      user_metadata: {
        nome_completo: nome_completo,
        telefone: telefone,
        cpf: cpf,
      },
    });

    if (createError) {
      console.error("Error creating user:", createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const userId = newUser.user.id;
    console.log("User created:", userId);

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: userId,
        nome_completo: nome_completo,
        telefone: telefone,
        cpf: cpf,
      });

    if (profileError) {
      console.error("Error creating profile:", profileError);
    }

    // Find or create plan
    const isAnnual = pendingReg.plan_type === "anual";
    let { data: plan } = await supabaseAdmin
      .from("plans")
      .select("id")
      .eq("name", pendingReg.plan_type)
      .single();

    if (!plan) {
      const { data: newPlan, error: planError } = await supabaseAdmin
        .from("plans")
        .insert({
          name: pendingReg.plan_type,
          price: isAnnual ? 97.90 : 12.90,
          features: { stripe_price_id: pendingReg.price_id },
        })
        .select("id")
        .single();

      if (planError) {
        console.error("Error creating plan:", planError);
      }
      plan = newPlan;
    }

    // Get subscription expiration from Stripe
    let expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + (isAnnual ? 12 : 1));

    if (pendingReg.stripe_subscription_id) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(pendingReg.stripe_subscription_id);
        expiresAt = new Date(stripeSubscription.current_period_end * 1000);
      } catch (e) {
        console.error("Error fetching Stripe subscription:", e);
      }
    }

    // Create subscription
    if (plan) {
      const { error: subError } = await supabaseAdmin
        .from("subscriptions")
        .insert({
          user_id: userId,
          plan_id: plan.id,
          status: "active",
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
        });

      if (subError) {
        console.error("Error creating subscription:", subError);
      }

      // Update profile with subscription
      const { data: sub } = await supabaseAdmin
        .from("subscriptions")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (sub) {
        await supabaseAdmin
          .from("profiles")
          .update({ subscription_id: sub.id })
          .eq("id", userId);
      }
    }

    // Add premium role
    await supabaseAdmin
      .from("user_roles")
      .upsert({
        user_id: userId,
        role: "premium",
      }, {
        onConflict: "user_id,role",
      });

    // Mark pending registration as completed
    await supabaseAdmin
      .from("pending_registrations")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", pendingReg.id);

    console.log("Registration completed for user:", userId);

    return new Response(
      JSON.stringify({ success: true, userId: userId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error completing registration:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
