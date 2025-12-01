-- Add column to control which goals appear on dashboard
ALTER TABLE public.metas 
ADD COLUMN IF NOT EXISTS mostrar_no_dashboard boolean DEFAULT false;