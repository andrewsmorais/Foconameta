-- =============================================
-- CORREÇÕES DE SEGURANÇA RLS
-- =============================================

-- 1. ABANDONED_CHECKOUTS: Remover política vulnerável (qual: true)
-- Service role já bypassa RLS automaticamente
DROP POLICY IF EXISTS "Service role can manage abandoned checkouts" ON public.abandoned_checkouts;

-- 2. DISCOUNT_COUPONS: Remover política vulnerável (qual: true)
DROP POLICY IF EXISTS "Service role can manage discount coupons" ON public.discount_coupons;

-- 3. USER_ROLES: Adicionar política para usuários verem seu próprio role
CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4. PROFILES: Recriar políticas com role autenticado explícito
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);