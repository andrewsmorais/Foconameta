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

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
const APP_URL = "https://bateuameta.lovable.app";

async function sendWelcomeEmail(email: string, password: string, nome: string) {
  if (!BREVO_API_KEY) {
    console.error("BREVO_API_KEY not configured");
    return;
  }

  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">
          Olá, ${nome}! 🎉
        </h1>
        <p style="font-size: 18px; color: #333; line-height: 1.6;">
          Sua assinatura foi aprovada com sucesso.<br/>
          Veja como começar:
        </p>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 25px; border-radius: 10px; margin-bottom: 25px; border-left: 4px solid #15a249;">
        <h2 style="color: #333; margin-bottom: 15px; font-size: 18px;">1. SEU LOGIN:</h2>
        <p style="font-size: 16px; margin: 10px 0; color: #333;">
          <strong>Usuário:</strong> ${email}
        </p>
        <p style="font-size: 16px; margin: 10px 0; color: #333;">
          <strong>Senha:</strong> ${password}
        </p>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 25px; border-radius: 10px; margin-bottom: 25px; border-left: 4px solid #3c83f6;">
        <h2 style="color: #333; margin-bottom: 15px; font-size: 18px;">2. O QUE FAZER AGORA:</h2>
        <ul style="font-size: 16px; color: #333; line-height: 2; padding-left: 20px; margin: 0;">
          <li>Clique no botão abaixo para logar.</li>
          <li>Cadastre seu veículo e seu primeiro turno.</li>
          <li>Acompanhe seu lucro real no Dashboard.</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 35px 0;">
        <a href="${APP_URL}/auth" style="display: inline-block; background-color: #3c83f6; color: white; padding: 18px 50px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold;">
          🚀 ENTRAR NO APLICATIVO
        </a>
      </div>
      
      <div style="border-top: 2px solid #eee; padding-top: 25px; text-align: center;">
        <p style="color: #333; font-size: 16px; margin-bottom: 15px; font-weight: bold;">Dúvidas?</p>
        <p style="color: #666; font-size: 15px; margin: 8px 0;">
          📱 WhatsApp: <a href="https://wa.me/5512981796135" style="color: #25D366; text-decoration: none;">(12) 98179-6135</a>
        </p>
        <p style="color: #666; font-size: 15px; margin: 8px 0;">
          📸 Instagram: <a href="https://www.instagram.com/bateu_meta/" style="color: #E1306C; text-decoration: none;">@bateu_meta</a>
        </p>
      </div>
    </div>
  `;

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: {
          name: "Bateu A Meta",
          email: "suporte@bateuameta.com",
        },
        to: [{ email }],
        subject: "🚗 Acesso Liberado! Sua assinatura foi aprovada - Bateu A Meta",
        htmlContent: emailContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Brevo API error:", errorData);
    } else {
      console.log("Welcome email sent successfully to:", email);
    }
  } catch (error) {
    console.error("Error sending welcome email:", error);
  }
}

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature!, webhookSecret!);
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

        console.log("Checkout completed for email:", customerEmail);

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

        // Check if user already exists
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        let user = existingUsers?.users?.find(u => u.email === customerEmail);
        
        const defaultPassword = "1234";

        if (!user) {
          // Create new user with default password
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: customerEmail,
            password: defaultPassword,
            email_confirm: true,
            user_metadata: {
              full_name: customerEmail.split("@")[0],
            },
          });

          if (createError) {
            console.error("Error creating user:", createError);
            throw createError;
          }

          user = newUser.user;
          console.log("New user created:", user.id);

          // Send welcome email with credentials
          const customerName = session.customer_details?.name || customerEmail.split("@")[0];
          await sendWelcomeEmail(customerEmail, defaultPassword, customerName);
        } else {
          console.log("User already exists:", user.id);
        }

        // Create or update profile
        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .upsert({
            id: user.id,
            nome_completo: customerEmail.split("@")[0],
            status: "active",
            updated_at: new Date().toISOString(),
          }, { onConflict: "id" });

        if (profileError) {
          console.error("Error creating/updating profile:", profileError);
        }

        // Find or create the plan
        let planId: string;
        const { data: existingPlan } = await supabaseAdmin
          .from("plans")
          .select("id")
          .eq("name", planType)
          .maybeSingle();

        if (existingPlan) {
          planId = existingPlan.id;
        } else {
          const { data: newPlan, error: planError } = await supabaseAdmin
            .from("plans")
            .insert({
              name: planType,
              price: isAnnual ? 97.90 : 19.90,
              features: { premium: true },
            })
            .select("id")
            .single();

          if (planError) {
            console.error("Error creating plan:", planError);
            throw planError;
          }
          planId = newPlan.id;
        }

        // Get subscription expiration from Stripe
        const expiresAt = new Date(subscription.current_period_end * 1000).toISOString();

        // Create or update subscription
        const { data: newSubscription, error: subError } = await supabaseAdmin
          .from("subscriptions")
          .upsert({
            user_id: user.id,
            plan_id: planId,
            status: "active",
            started_at: new Date().toISOString(),
            expires_at: expiresAt,
          }, { onConflict: "user_id" })
          .select("id")
          .single();

        if (subError) {
          console.error("Error creating subscription:", subError);
        } else {
          // Update profile with subscription_id
          await supabaseAdmin
            .from("profiles")
            .update({ subscription_id: newSubscription.id })
            .eq("id", user.id);
        }

        // Add premium role to user_roles table
        const { error: roleError } = await supabaseAdmin
          .from("user_roles")
          .upsert({
            user_id: user.id,
            role: "premium",
          }, { onConflict: "user_id,role" });

        if (roleError) {
          console.error("Error adding premium role:", roleError);
        }

        console.log("User setup completed for:", customerEmail, "Plan:", planType);
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
