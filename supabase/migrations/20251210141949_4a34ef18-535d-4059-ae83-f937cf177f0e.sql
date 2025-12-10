-- =====================================================
-- SECURITY HARDENING: Row Level Security Improvements
-- =====================================================

-- 1. FORCE RLS on all sensitive tables (prevents bypassing RLS)
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.ganhos_despesas FORCE ROW LEVEL SECURITY;
ALTER TABLE public.turnos_km FORCE ROW LEVEL SECURITY;
ALTER TABLE public.metas FORCE ROW LEVEL SECURITY;
ALTER TABLE public.manutencoes FORCE ROW LEVEL SECURITY;
ALTER TABLE public.veiculos FORCE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.plans FORCE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_config FORCE ROW LEVEL SECURITY;
ALTER TABLE public.turno_fontes_ganho FORCE ROW LEVEL SECURITY;

-- 2. FIX: Restrict 'plans' table to authenticated users only
-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Everyone can view plans" ON public.plans;

-- Create new policy requiring authentication
CREATE POLICY "Authenticated users can view plans"
ON public.plans
FOR SELECT
TO authenticated
USING (true);

-- 3. VERIFY: Ensure is_super_admin function is secure (already has SECURITY DEFINER)
-- The function already exists with correct settings, just ensuring it's not bypassed
-- by recreating with explicit security settings
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT public.has_role(_user_id, 'super_admin'::app_role)
$$;

-- 4. Revoke direct table access from anon role on sensitive tables
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.ganhos_despesas FROM anon;
REVOKE ALL ON public.turnos_km FROM anon;
REVOKE ALL ON public.metas FROM anon;
REVOKE ALL ON public.manutencoes FROM anon;
REVOKE ALL ON public.subscriptions FROM anon;
REVOKE ALL ON public.user_roles FROM anon;
REVOKE ALL ON public.webhook_config FROM anon;
REVOKE ALL ON public.turno_fontes_ganho FROM anon;

-- Grant select on plans to anon (for pricing page before login) - REMOVED per security request
-- Plans now require authentication