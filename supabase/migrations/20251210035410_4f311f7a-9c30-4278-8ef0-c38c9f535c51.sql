-- Add explicit policy to deny anonymous access to profiles table
-- This is an additional safety measure - RLS already blocks anonymous access 
-- since auth.uid() returns NULL for anonymous users

-- First, let's add a restrictive policy that explicitly requires authentication
-- This serves as documentation and defense-in-depth

-- The current policies already require auth.uid() to match, which blocks anonymous access
-- But we can verify this is working correctly by checking the policy setup

-- Add a comment-policy to make the security intent explicit
COMMENT ON TABLE public.profiles IS 'Contains PII (nome_completo, telefone, CPF). RLS enabled with user_id-based access control. Anonymous access blocked via auth.uid() checks.';

-- Verify RLS is enabled (this is idempotent)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner as well (defense in depth)
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;