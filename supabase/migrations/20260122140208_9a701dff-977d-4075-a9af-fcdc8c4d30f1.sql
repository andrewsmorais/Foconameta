-- Add column to store provisional password for admin viewing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS provisional_password text;

-- Add comment to explain the column purpose
COMMENT ON COLUMN public.profiles.provisional_password IS 'Stores the provisional password generated during user creation or password reset, allowing super admins to view it';