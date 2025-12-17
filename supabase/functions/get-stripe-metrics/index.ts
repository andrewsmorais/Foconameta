import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Valid plan amounts in cents (BRL)
const MONTHLY_PLAN_AMOUNT = 1290; // R$ 12,90
const ANNUAL_PLAN_AMOUNT = 9790; // R$ 97,90
const VALID_AMOUNTS = [MONTHLY_PLAN_AMOUNT, ANNUAL_PLAN_AMOUNT];

// Stripe fee calculation for Brazil
const calculateStripeFee = (amount: number): number => {
  // 3.99% + R$ 0.39 for cards (most common)
  return (amount * 0.0399) + 0.39;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use service role for admin checks
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

    console.log("User ID:", user.id);

    // Check if user is super admin using service role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "super_admin")
      .maybeSingle();

    console.log("Role data:", roleData, "Role error:", roleError);

    if (!roleData) {
      console.log("User is not super admin");
      return new Response(JSON.stringify({ error: "Unauthorized - Super admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("User is super admin, proceeding...");

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

    // Parse request body for date filters
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    
    try {
      const body = await req.json();
      if (body.startDate) {
        startDate = new Date(body.startDate);
      }
      if (body.endDate) {
        endDate = new Date(body.endDate);
        // Set end date to end of day
        endDate.setHours(23, 59, 59, 999);
      }
    } catch {
      // No body or invalid JSON, use defaults
    }

    // Default to 6 months if no dates provided
    const defaultStartDate = new Date();
    defaultStartDate.setMonth(defaultStartDate.getMonth() - 6);
    
    const filterStartDate = startDate || defaultStartDate;
    const filterEndDate = endDate || new Date();
    
    const startTimestamp = Math.floor(filterStartDate.getTime() / 1000);
    const endTimestamp = Math.floor(filterEndDate.getTime() / 1000);

    console.log("Date filter:", { 
      start: filterStartDate.toISOString(), 
      end: filterEndDate.toISOString() 
    });

    // Fetch Stripe account balance
    let availableBalance = 0;
    let pendingBalance = 0;
    try {
      const balance = await stripe.balance.retrieve();
      // Get BRL balance
      const brlAvailable = balance.available.find((b: { currency: string; amount: number }) => b.currency === 'brl');
      const brlPending = balance.pending.find((b: { currency: string; amount: number }) => b.currency === 'brl');
      availableBalance = brlAvailable ? brlAvailable.amount / 100 : 0;
      pendingBalance = brlPending ? brlPending.amount / 100 : 0;
      console.log("Stripe balance:", { availableBalance, pendingBalance });
    } catch (err) {
      console.error("Error fetching balance:", err);
    }

    // Fetch all charges within date range
    const charges = await stripe.charges.list({
      created: { gte: startTimestamp, lte: endTimestamp },
      limit: 100,
    });

    // Fetch refunds
    const refunds = await stripe.refunds.list({
      created: { gte: startTimestamp, lte: endTimestamp },
      limit: 100,
    });

    // Fetch active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      status: "active",
      limit: 100,
    });

    // Calculate metrics - ONLY FOR VALID PLAN AMOUNTS
    let grossRevenue = 0;
    let totalFees = 0;
    let totalRefunds = 0;
    let monthlyPlanCount = 0;
    let annualPlanCount = 0;
    let validChargesCount = 0;

    // Process charges - FILTER ONLY R$ 12,90 and R$ 97,90
    const monthlyData: { [key: string]: { gross: number; fees: number; refunds: number } } = {};
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    // Initialize months in range
    const currentDate = new Date(filterStartDate);
    while (currentDate <= filterEndDate) {
      const key = `${months[currentDate.getMonth()]}/${currentDate.getFullYear().toString().slice(2)}`;
      if (!monthlyData[key]) {
        monthlyData[key] = { gross: 0, fees: 0, refunds: 0 };
      }
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    for (const charge of charges.data) {
      // ONLY count charges with valid plan amounts (R$ 12,90 or R$ 97,90)
      if (charge.status === "succeeded" && VALID_AMOUNTS.includes(charge.amount)) {
        const amountBRL = charge.amount / 100; // Convert from cents
        grossRevenue += amountBRL;
        validChargesCount++;

        // Calculate Stripe fees
        const fee = calculateStripeFee(amountBRL);
        totalFees += fee;

        // Add to monthly data
        const chargeDate = new Date(charge.created * 1000);
        const key = `${months[chargeDate.getMonth()]}/${chargeDate.getFullYear().toString().slice(2)}`;
        if (monthlyData[key]) {
          monthlyData[key].gross += amountBRL;
          monthlyData[key].fees += fee;
        }

        console.log(`Valid charge: R$ ${amountBRL.toFixed(2)} - ${charge.id}`);
      } else if (charge.status === "succeeded") {
        console.log(`Ignored charge (test/invalid): R$ ${(charge.amount / 100).toFixed(2)} - ${charge.id}`);
      }
    }

    // Process refunds - only for valid amounts
    for (const refund of refunds.data) {
      if (refund.status === "succeeded" && VALID_AMOUNTS.includes(refund.amount)) {
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
        const amount = price.unit_amount || 0;
        
        // R$ 12.90 = monthly (1290 cents), R$ 97.90 = annual (9790 cents)
        if (amount === MONTHLY_PLAN_AMOUNT) {
          monthlyPlanCount++;
        } else if (amount === ANNUAL_PLAN_AMOUNT) {
          annualPlanCount++;
        }
      }
    }

    // Calculate net profit
    const netProfit = grossRevenue - totalFees - totalRefunds;

    // Calculate additional metrics
    const ticketMedio = validChargesCount > 0 ? grossRevenue / validChargesCount : 0;
    
    // MRR calculation: monthly subs * 12.90 + annual subs * (97.90 / 12)
    const mrr = (monthlyPlanCount * 12.90) + (annualPlanCount * (97.90 / 12));

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
      totalCharges: validChargesCount,
      // New metrics
      availableBalance: Number(availableBalance.toFixed(2)),
      pendingBalance: Number(pendingBalance.toFixed(2)),
      ticketMedio: Number(ticketMedio.toFixed(2)),
      mrr: Number(mrr.toFixed(2)),
    };

    console.log("Stripe metrics calculated (filtered):", response);

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
