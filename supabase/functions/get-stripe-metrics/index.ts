import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
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
    const { data: roleData } = await supabaseClient
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

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      return new Response(JSON.stringify({ error: "Stripe not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Get date 6 months ago
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const sixMonthsAgoTimestamp = Math.floor(sixMonthsAgo.getTime() / 1000);

    // Fetch all charges from last 6 months
    const charges = await stripe.charges.list({
      created: { gte: sixMonthsAgoTimestamp },
      limit: 100,
    });

    // Fetch refunds
    const refunds = await stripe.refunds.list({
      created: { gte: sixMonthsAgoTimestamp },
      limit: 100,
    });

    // Fetch active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      status: "active",
      limit: 100,
    });

    // Calculate metrics
    let grossRevenue = 0;
    let totalFees = 0;
    let totalRefunds = 0;
    let monthlyPlanCount = 0;
    let annualPlanCount = 0;

    // Process charges
    const monthlyData: { [key: string]: { gross: number; fees: number; refunds: number } } = {};
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const key = `${months[date.getMonth()]}/${date.getFullYear().toString().slice(2)}`;
      monthlyData[key] = { gross: 0, fees: 0, refunds: 0 };
    }

    for (const charge of charges.data) {
      if (charge.status === "succeeded") {
        const amountBRL = charge.amount / 100; // Convert from cents
        grossRevenue += amountBRL;

        // Estimate Stripe fees (3.99% + R$ 0.39 for cards)
        const fee = (amountBRL * 0.0399) + 0.39;
        totalFees += fee;

        // Add to monthly data
        const chargeDate = new Date(charge.created * 1000);
        const key = `${months[chargeDate.getMonth()]}/${chargeDate.getFullYear().toString().slice(2)}`;
        if (monthlyData[key]) {
          monthlyData[key].gross += amountBRL;
          monthlyData[key].fees += fee;
        }
      }
    }

    // Process refunds
    for (const refund of refunds.data) {
      if (refund.status === "succeeded") {
        const refundAmount = refund.amount / 100;
        totalRefunds += refundAmount;

        const refundDate = new Date(refund.created * 1000);
        const key = `${months[refundDate.getMonth()]}/${refundDate.getFullYear().toString().slice(2)}`;
        if (monthlyData[key]) {
          monthlyData[key].refunds += refundAmount;
        }
      }
    }

    // Count subscriptions by plan price
    for (const sub of subscriptions.data) {
      if (sub.items.data.length > 0) {
        const price = sub.items.data[0].price;
        const amount = (price.unit_amount || 0) / 100;
        
        // R$ 12.90 = monthly, R$ 97.90 = annual
        if (amount >= 12 && amount <= 13) {
          monthlyPlanCount++;
        } else if (amount >= 97 && amount <= 98) {
          annualPlanCount++;
        }
      }
    }

    // Calculate net profit
    const netProfit = grossRevenue - totalFees - totalRefunds;

    // Check webhook health (last event within 24h)
    let webhookHealthy = true;
    try {
      const events = await stripe.events.list({
        limit: 1,
        created: { gte: Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000) },
      });
      webhookHealthy = events.data.length > 0;
    } catch {
      webhookHealthy = false;
    }

    // Format monthly history for chart
    const monthlyHistory = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      lucro: Number((data.gross - data.fees - data.refunds).toFixed(2)),
      receita: Number(data.gross.toFixed(2)),
    }));

    const response = {
      grossRevenue: Number(grossRevenue.toFixed(2)),
      netProfit: Number(netProfit.toFixed(2)),
      totalRefunds: Number(totalRefunds.toFixed(2)),
      totalFees: Number(totalFees.toFixed(2)),
      monthlyPlanCount,
      annualPlanCount,
      webhookHealthy,
      monthlyHistory,
      totalCharges: charges.data.length,
    };

    console.log("Stripe metrics calculated:", response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error fetching Stripe metrics:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
