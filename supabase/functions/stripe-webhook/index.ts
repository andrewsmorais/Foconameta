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

// Temporary fixed password (until email integration)
const TEMPORARY_PASSWORD = 'MudeAgora123';

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
        const customerEmail = session.customer_details?.email || session.metadata?.email;
        const nomeCompleto = session.metadata?.nome_completo || "";
        const telefone = session.metadata?.telefone || "";
        const cpf = session.metadata?.cpf || "";

        console.log("Checkout completed for email:", customerEmail);

        if (!customerEmail) {
          console.error("No email found in checkout session");
          throw new Error("No email found in checkout session");
        }

        // Check if user already exists
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === customerEmail);

        let userId: string;
        let generatedPassword: string | null = null;

        if (existingUser) {
          // User already exists, just update their subscription
          userId = existingUser.id;
          console.log("User already exists:", userId);
        } else {
          // Use temporary fixed password
          generatedPassword = TEMPORARY_PASSWORD;
          
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: customerEmail,
            password: generatedPassword,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
              nome_completo: nomeCompleto,
              telefone: telefone,
              cpf: cpf,
            },
          });

          if (createError) {
            console.error("Error creating user:", createError);
            throw createError;
          }

          userId = newUser.user.id;
          console.log("New user created:", userId, "with email:", customerEmail);

          // Create profile for the new user
          const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .upsert({
              id: userId,
              nome_completo: nomeCompleto,
              telefone: telefone,
              cpf: cpf,
            });

          if (profileError) {
            console.error("Error creating profile:", profileError);
          }
        }

        // Get subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0].price.id;
        
        // Determine plan type based on price
        const isAnnual = priceId === "price_1SdmJnK6aMDv1DOlafIvA9GC";
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

        // Add premium user role
        await supabaseAdmin
          .from("user_roles")
          .upsert({
            user_id: userId,
            role: "premium",
          }, {
            onConflict: "user_id,role",
          });

        console.log("User subscription activated:", userId);
        
        // Log the generated password (in production, this would be sent via email)
        if (generatedPassword) {
          console.log("===========================================");
          console.log("NEW USER CREATED - LOGIN CREDENTIALS:");
          console.log("Email:", customerEmail);
          console.log("Password:", generatedPassword);
          console.log("===========================================");
        }
        
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
