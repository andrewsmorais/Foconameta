-- Create table to track abandoned checkouts
CREATE TABLE public.abandoned_checkouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'mensal',
  preapproval_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, converted, email_sent
  coupon_code TEXT,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  converted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX idx_abandoned_email ON public.abandoned_checkouts(email);
CREATE INDEX idx_abandoned_status ON public.abandoned_checkouts(status);
CREATE INDEX idx_abandoned_created_at ON public.abandoned_checkouts(created_at);

-- Enable RLS
ALTER TABLE public.abandoned_checkouts ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table (used by edge functions)
CREATE POLICY "Service role can manage abandoned checkouts"
ON public.abandoned_checkouts
FOR ALL
USING (true)
WITH CHECK (true);

-- Create table for discount coupons
CREATE TABLE public.discount_coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  discount_percent INTEGER NOT NULL DEFAULT 10,
  plan_type TEXT NOT NULL,
  original_price DECIMAL(10,2) NOT NULL,
  discounted_price DECIMAL(10,2) NOT NULL,
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_coupon_code ON public.discount_coupons(code);
CREATE INDEX idx_coupon_email ON public.discount_coupons(email);
CREATE INDEX idx_coupon_valid_until ON public.discount_coupons(valid_until);

-- Enable RLS
ALTER TABLE public.discount_coupons ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table (used by edge functions)
CREATE POLICY "Service role can manage discount coupons"
ON public.discount_coupons
FOR ALL
USING (true)
WITH CHECK (true);