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
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;
        const customerEmail = session.customer_details?.email;
        const sessionId = session.id;

        console.log("Checkout completed for session:", sessionId, "email:", customerEmail);

        if (!customerEmail) {
          console.error("No email found in checkout session");
          throw new Error("No email found in checkout session");
        }

        // Get subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0].price.id;
        
        // Determine plan type based on price
        const isAnnual = priceId === "price_1SdmJnK6aMDv1DOlafIvA9GC";
        const planType = isAnnual ? "anual" : "mensal";

        // Create pending registration (don't create user yet)
        const { error: insertError } = await supabaseAdmin
          .from("pending_registrations")
          .insert({
            email: customerEmail,
            session_id: sessionId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            plan_type: planType,
            price_id: priceId,
            status: "pending",
          });

        if (insertError) {
          console.error("Error creating pending registration:", insertError);
          throw insertError;
        }

        console.log("Pending registration created for:", customerEmail, "session:", sessionId);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Get customer email to find user
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        if (customer.deleted) break;
        
        const customerEmail = (customer as Stripe.Customer).email;
        if (!customerEmail) break;

        // Find user by email
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const user = existingUsers?.users?.find(u => u.email === customerEmail);
        
        if (user) {
          const status = subscription.status === "active" ? "active" : "inactive";
          
          await supabaseAdmin
            .from("subscriptions")
            .update({
              status,
              expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq("user_id", user.id);

          console.log("Subscription updated for user:", user.id, "status:", status);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Get customer email to find user
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        if (customer.deleted) break;
        
        const customerEmail = (customer as Stripe.Customer).email;
        if (!customerEmail) break;

        // Find user by email
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const user = existingUsers?.users?.find(u => u.email === customerEmail);
        
        if (user) {
          await supabaseAdmin
            .from("subscriptions")
            .update({ status: "cancelled" })
            .eq("user_id", user.id);

          // Remove premium role
          await supabaseAdmin
            .from("user_roles")
            .delete()
            .eq("user_id", user.id)
            .eq("role", "premium");

          console.log("Subscription cancelled for user:", user.id);
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
