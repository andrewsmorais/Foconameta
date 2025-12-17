-- Allow super admins to delete profiles
CREATE POLICY "Super admins can delete profiles" 
ON public.profiles
FOR DELETE
USING (is_super_admin(auth.uid()));