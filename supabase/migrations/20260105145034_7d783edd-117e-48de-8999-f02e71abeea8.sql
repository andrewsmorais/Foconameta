-- Enable RLS on abandoned_checkouts (if not already enabled)
ALTER TABLE public.abandoned_checkouts ENABLE ROW LEVEL SECURITY;

-- Enable RLS on discount_coupons (if not already enabled)
ALTER TABLE public.discount_coupons ENABLE ROW LEVEL SECURITY;

-- Policy for service role (Edge Functions) to manage abandoned_checkouts
CREATE POLICY "Service role can manage abandoned checkouts"
ON public.abandoned_checkouts
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Super admins can view abandoned checkouts for monitoring
CREATE POLICY "Super admins can view abandoned checkouts"
ON public.abandoned_checkouts
FOR SELECT
USING (is_super_admin(auth.uid()));

-- Policy for service role (Edge Functions) to manage discount_coupons
CREATE POLICY "Service role can manage discount coupons"
ON public.discount_coupons
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Super admins can view discount coupons for monitoring
CREATE POLICY "Super admins can view discount coupons"
ON public.discount_coupons
FOR SELECT
USING (is_super_admin(auth.uid()));