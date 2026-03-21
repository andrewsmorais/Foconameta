import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { session_id } = await req.json();

    if (!session_id) {
      console.error("Missing session_id in request");
      return new Response(
        JSON.stringify({ error: "session_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Fetching pending registration for session:", session_id);

    // Create Supabase client with service role to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Query pending registration
    const { data, error } = await supabaseAdmin
      .from("pending_registrations")
      .select("email, status, expires_at, plan_type")
      .eq("session_id", session_id)
      .eq("status", "pending")
      .single();

    if (error) {
      console.error("Error fetching pending registration:", error);
      return new Response(
        JSON.stringify({ error: "Registro não encontrado ou já utilizado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if expired
    if (new Date(data.expires_at) < new Date()) {
      console.log("Registration link expired for session:", session_id);
      return new Response(
        JSON.stringify({ error: "Este link de cadastro expirou. Entre em contato com o suporte." }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Successfully found pending registration for email:", data.email);

    // Return only non-sensitive data needed for the registration form
    return new Response(
      JSON.stringify({ 
        email: data.email,
        plan_type: data.plan_type,
        valid: true
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in get-pending-registration function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
