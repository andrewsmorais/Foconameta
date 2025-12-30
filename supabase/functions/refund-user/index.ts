import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");

    if (!STRIPE_SECRET_KEY) {
      console.error("STRIPE_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Stripe não configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize clients
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
    });
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser();
    if (authError || !user) {
      console.error("Authentication failed:", authError);
      return new Response(
        JSON.stringify({ error: "Não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is super_admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "super_admin")
      .single();

    if (roleError || !roleData) {
      console.error("User is not super_admin:", user.id);
      return new Response(
        JSON.stringify({ error: "Acesso negado - apenas super admins podem reembolsar" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { email, userId, motivo } = await req.json();

    if (!email || !userId || !motivo) {
      return new Response(
        JSON.stringify({ error: "Email, userId e motivo são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Refund] Processing refund for ${email}, reason: ${motivo}`);

    // Find customer in Stripe by email
    const customers = await stripe.customers.list({ email: email, limit: 1 });
    
    if (customers.data.length === 0) {
      console.log(`[Refund] No Stripe customer found for ${email}`);
      return new Response(
        JSON.stringify({ error: "Cliente não encontrado no Stripe" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const customer = customers.data[0];
    console.log(`[Refund] Found customer: ${customer.id}`);

    // Get the last successful charge for this customer
    const charges = await stripe.charges.list({
      customer: customer.id,
      limit: 20,
    });

    // Filter only successful charges that haven't been fully refunded
    const successfulCharges = charges.data.filter(
      (charge: Stripe.Charge) => charge.status === "succeeded" && !charge.refunded
    );

    // Check if there are any charges at all
    const allCharges = charges.data.filter((c: Stripe.Charge) => c.status === "succeeded");
    const refundedCharges = allCharges.filter((c: Stripe.Charge) => c.refunded);

    console.log(`[Refund] Found ${allCharges.length} total charges, ${refundedCharges.length} already refunded`);

    if (successfulCharges.length === 0) {
      const message = allCharges.length === 0 
        ? "Nenhum pagamento encontrado para este cliente"
        : `Todos os ${allCharges.length} pagamento(s) já foram reembolsados anteriormente`;
      
      console.log(`[Refund] ${message} for ${email}`);
      return new Response(
        JSON.stringify({ 
          error: message,
          totalCharges: allCharges.length,
          refundedCharges: refundedCharges.length 
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lastCharge = successfulCharges[0];
    console.log(`[Refund] Last charge: ${lastCharge.id}, amount: ${lastCharge.amount / 100}`);

    // Create refund in Stripe
    const refund = await stripe.refunds.create({
      charge: lastCharge.id,
      reason: "requested_by_customer",
      metadata: {
        admin_user_id: user.id,
        admin_email: user.email || "",
        motivo: motivo,
        refunded_user_email: email,
      },
    });

    console.log(`[Refund] Refund created: ${refund.id}, status: ${refund.status}`);

    // Cancel any active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: "active",
    });

    for (const sub of subscriptions.data) {
      await stripe.subscriptions.cancel(sub.id);
      console.log(`[Refund] Cancelled Stripe subscription: ${sub.id}`);
    }

    // Update subscription status in database
    const { error: subError } = await supabaseAdmin
      .from("subscriptions")
      .update({ status: "cancelled" })
      .eq("user_id", userId);

    if (subError) {
      console.error("[Refund] Error updating subscription status:", subError);
    } else {
      console.log(`[Refund] Database subscription status updated to cancelled`);
    }

    // Get current admin notes
    const { data: profileData } = await supabaseAdmin
      .from("profiles")
      .select("admin_notes")
      .eq("id", userId)
      .single();

    // Append refund reason to admin notes
    const currentNotes = profileData?.admin_notes || "";
    const refundNote = `\n\n[REEMBOLSO - ${new Date().toLocaleString("pt-BR")}]\nValor: R$ ${(lastCharge.amount / 100).toFixed(2)}\nMotivo: ${motivo}\nProcessado por: ${user.email}`;
    const updatedNotes = currentNotes + refundNote;

    const { error: notesError } = await supabaseAdmin
      .from("profiles")
      .update({ admin_notes: updatedNotes })
      .eq("id", userId);

    if (notesError) {
      console.error("[Refund] Error saving refund notes:", notesError);
    } else {
      console.log(`[Refund] Refund notes saved to profile`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        refund_id: refund.id,
        amount_refunded: lastCharge.amount / 100,
        message: `Reembolso de R$ ${(lastCharge.amount / 100).toFixed(2).replace(".", ",")} processado com sucesso!`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Refund] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro ao processar reembolso" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
