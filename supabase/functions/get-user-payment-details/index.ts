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

    const { emails } = await req.json();

    if (!emails || !Array.isArray(emails)) {
      return new Response(JSON.stringify({ error: "emails array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paymentDetails: { [email: string]: {
      lastPaymentDate: string | null;
      paymentMethod: string | null;
      netAmount: number | null;
    }} = {};

    for (const email of emails) {
      try {
        // Search for customer by email
        const customers = await stripe.customers.list({
          email: email,
          limit: 1,
        });

        if (customers.data.length === 0) {
          paymentDetails[email] = {
            lastPaymentDate: null,
            paymentMethod: null,
            netAmount: null,
          };
          continue;
        }

        const customer = customers.data[0];

        // Get latest charge for this customer
        const charges = await stripe.charges.list({
          customer: customer.id,
          limit: 1,
        });

        if (charges.data.length === 0) {
          paymentDetails[email] = {
            lastPaymentDate: null,
            paymentMethod: null,
            netAmount: null,
          };
          continue;
        }

        const lastCharge = charges.data[0];
        const chargeDate = new Date(lastCharge.created * 1000);
        
        // Determine payment method
        let paymentMethod = "Cartão";
        if (lastCharge.payment_method_details) {
          const pmType = lastCharge.payment_method_details.type;
          if (pmType === "pix" || pmType === "boleto") {
            paymentMethod = pmType.toUpperCase();
          } else if (pmType === "card") {
            paymentMethod = "Cartão";
          }
        }

        // Calculate net amount (after Stripe fees)
        const grossAmount = lastCharge.amount / 100;
        const stripeFee = (grossAmount * 0.0399) + 0.39; // 3.99% + R$ 0.39
        const netAmount = grossAmount - stripeFee;

        paymentDetails[email] = {
          lastPaymentDate: chargeDate.toISOString(),
          paymentMethod,
          netAmount: Number(netAmount.toFixed(2)),
        };
      } catch (err) {
        console.error(`Error fetching payment for ${email}:`, err);
        paymentDetails[email] = {
          lastPaymentDate: null,
          paymentMethod: null,
          netAmount: null,
        };
      }
    }

    console.log("Payment details fetched for", Object.keys(paymentDetails).length, "users");

    return new Response(JSON.stringify(paymentDetails), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error fetching user payment details:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
