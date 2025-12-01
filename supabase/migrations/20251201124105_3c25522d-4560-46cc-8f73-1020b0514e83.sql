-- Update the initialize_default_goals function to create 4 fixed goals (daily, weekly, monthly, annual)
CREATE OR REPLACE FUNCTION public.initialize_default_goals()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create default goals for new user (daily, weekly, monthly, annual)
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