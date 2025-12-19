-- Remove a política pública insegura que expõe dados sensíveis
DROP POLICY IF EXISTS "Allow public read of pending registrations" ON public.pending_registrations;