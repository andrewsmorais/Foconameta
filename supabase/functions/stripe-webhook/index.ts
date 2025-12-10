import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature!, webhookSecret!);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", errorMessage);
    return new Response(JSON.stringify({ error: `Webhook Error: ${errorMessage}` }), { status: 400 });
  }

  console.log("Received Stripe event:", event.type);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const subscriptionId = session.subscription as string;

        console.log("Checkout completed for user:", userId, "subscription:", subscriptionId);

        if (userId && subscriptionId) {
          // Get subscription details from Stripe
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = subscription.items.data[0].price.id;
          
          // Determine plan type based on price
          const isAnnual = priceId === "price_1ScdelK6aMDv1DOlzvkwwZd9";
          const planName = isAnnual ? "anual" : "mensal";

          // Find or create the plan in database
          let { data: plan } = await supabaseAdmin
            .from("plans")
            .select("id")
            .eq("name", planName)
            .single();

          if (!plan) {
            const { data: newPlan, error: planError } = await supabaseAdmin
              .from("plans")
              .insert({
                name: planName,
                price: isAnnual ? 97.90 : 12.90,
                features: { stripe_price_id: priceId },
              })
              .select("id")
              .single();

            if (planError) {
              console.error("Error creating plan:", planError);
              throw planError;
            }
            plan = newPlan;
          }

          // Create subscription in our database
          const { error: subError } = await supabaseAdmin
            .from("subscriptions")
            .upsert({
              user_id: userId,
              plan_id: plan.id,
              status: "active",
              started_at: new Date().toISOString(),
              expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
            }, {
              onConflict: "user_id",
            });

          if (subError) {
            console.error("Error creating subscription:", subError);
            throw subError;
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

          // Add user role
          await supabaseAdmin
            .from("user_roles")
            .upsert({
              user_id: userId,
              role: "premium",
            }, {
              onConflict: "user_id,role",
            });

          console.log("User subscription activated:", userId);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;

        if (userId) {
          const status = subscription.status === "active" ? "active" : "inactive";
          
          await supabaseAdmin
            .from("subscriptions")
            .update({
              status,
              expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq("user_id", userId);

          console.log("Subscription updated for user:", userId, "status:", status);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;

        if (userId) {
          await supabaseAdmin
            .from("subscriptions")
            .update({ status: "cancelled" })
            .eq("user_id", userId);

          // Remove premium role
          await supabaseAdmin
            .from("user_roles")
            .delete()
            .eq("user_id", userId)
            .eq("role", "premium");

          console.log("Subscription cancelled for user:", userId);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error processing webhook:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
});
