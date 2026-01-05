-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage on cron schema
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Create the cron job to send abandoned cart emails every hour
SELECT cron.schedule(
  'send-abandoned-cart-emails-hourly',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT net.http_post(
    url := 'https://grfyoqsbypvvuzdudtgu.supabase.co/functions/v1/send-abandoned-cart-email',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZnlvcXNieXB2dnV6ZHVkdGd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNTUwMzksImV4cCI6MjA3OTgzMTAzOX0.AyCDPJkuliZnr0eaUKXUG5cJhsj6ev-4bjVmcSR3umU"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);