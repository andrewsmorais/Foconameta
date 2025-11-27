-- Fix security warnings by recreating functions with proper search_path
-- Using CREATE OR REPLACE instead of DROP to avoid dependency issues

CREATE OR REPLACE FUNCTION public.calculate_turno_metrics()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Calculate total hours (difference between hora_fim and hora_inicio)
  NEW.total_horas := EXTRACT(EPOCH FROM (NEW.hora_fim - NEW.hora_inicio)) / 3600;
  
  -- Calculate lucro_liquido (ganho - despesa com combustível)
  NEW.lucro_liquido := NEW.valor_ganho - (NEW.consumo_combustivel * NEW.preco_combustivel);
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;