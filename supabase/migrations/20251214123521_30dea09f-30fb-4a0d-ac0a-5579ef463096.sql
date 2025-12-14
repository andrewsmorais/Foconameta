-- Create pending_registrations table for storing payment info before account creation
CREATE TABLE public.pending_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  session_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_type TEXT NOT NULL,
  price_id TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours')
);

-- Enable RLS
ALTER TABLE public.pending_registrations ENABLE ROW LEVEL SECURITY;

-- Policy for public read (needed to verify session on success page)
CREATE POLICY "Allow public read of pending registrations"
ON public.pending_registrations FOR SELECT
USING (status = 'pending');

-- Policy for service role operations (via edge functions)
CREATE POLICY "Service role can manage all registrations"
ON public.pending_registrations FOR ALL
TO service_role
USING (true)
WITH CHECK (true);