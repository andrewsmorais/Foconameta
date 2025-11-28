import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { eventType, data } = await req.json();

    console.log('Webhook trigger:', { eventType, data });

    // Get active webhooks for this event type
    const { data: webhooks, error: webhooksError } = await supabaseClient
      .from('webhook_config')
      .select('*')
      .eq('event_type', eventType)
      .eq('is_active', true);

    if (webhooksError) {
      throw webhooksError;
    }

    if (!webhooks || webhooks.length === 0) {
      console.log('No active webhooks found for event:', eventType);
      return new Response(
        JSON.stringify({ message: 'No active webhooks found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send webhook to all configured URLs
    const results = await Promise.allSettled(
      webhooks.map(async (webhook) => {
        try {
          const response = await fetch(webhook.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              event: eventType,
              timestamp: new Date().toISOString(),
              data: data,
            }),
          });

          return {
            webhook: webhook.name,
            url: webhook.url,
            status: response.status,
            success: response.ok,
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`Error sending webhook to ${webhook.url}:`, error);
          return {
            webhook: webhook.name,
            url: webhook.url,
            error: errorMessage,
            success: false,
          };
        }
      })
    );

    const successCount = results.filter(
      (r) => r.status === 'fulfilled' && r.value.success
    ).length;

    console.log(`Sent ${successCount}/${webhooks.length} webhooks successfully`);

    return new Response(
      JSON.stringify({
        message: 'Webhooks sent',
        total: webhooks.length,
        success: successCount,
        results: results.map((r) => r.status === 'fulfilled' ? r.value : { error: r.reason }),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in send-webhook function:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
