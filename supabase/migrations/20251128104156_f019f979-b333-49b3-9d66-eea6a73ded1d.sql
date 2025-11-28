-- Add column to differentiate between fixed and custom goals
ALTER TABLE public.metas ADD COLUMN IF NOT EXISTS fixa boolean DEFAULT false;

-- Create function to initialize default goals for a user
CREATE OR REPLACE FUNCTION public.initialize_default_goals()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create default goals for new user
  INSERT INTO public.metas (user_id, tipo, valor_meta, data_inicio, data_fim, ativa, fixa)
  VALUES
    -- Daily goal: today to today
    (NEW.id, 'diaria', 0, CURRENT_DATE, CURRENT_DATE, true, true),
    -- Weekly goal: start of week to end of week
    (NEW.id, 'semanal', 0, date_trunc('week', CURRENT_DATE)::date, (date_trunc('week', CURRENT_DATE) + interval '6 days')::date, true, true),
    -- Monthly goal: start of month to end of month
    (NEW.id, 'mensal', 0, date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + interval '1 month - 1 day')::date, true, true),
    -- Annual goal: start of year to end of year
    (NEW.id, 'anual', 0, date_trunc('year', CURRENT_DATE)::date, (date_trunc('year', CURRENT_DATE) + interval '1 year - 1 day')::date, true, true)
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger to initialize goals when profile is created
DROP TRIGGER IF EXISTS on_profile_created_initialize_goals ON public.profiles;
CREATE TRIGGER on_profile_created_initialize_goals
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_default_goals();

-- Create RLS policy to prevent deletion of fixed goals
DROP POLICY IF EXISTS "Users cannot delete fixed goals" ON public.metas;
CREATE POLICY "Users cannot delete fixed goals"
  ON public.metas
  FOR DELETE
  USING (auth.uid() = user_id AND fixa = false);