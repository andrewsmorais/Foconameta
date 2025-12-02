-- Fix the calculate_turno_metrics function with proper search_path
CREATE OR REPLACE FUNCTION public.calculate_turno_metrics()
RETURNS TRIGGER AS $$
DECLARE
  km_rodado numeric;
  despesa_combustivel numeric;
  total_horas numeric;
  hora_inicio_parts text[];
  hora_fim_parts text[];
  minutos_inicio numeric;
  minutos_fim numeric;
  outras_desp numeric;
BEGIN
  -- Calculate KM rodado
  km_rodado := NEW.km_final - NEW.km_inicial;
  
  -- Calculate fuel expense: (KM Rodado / Consumo em km/L) * Preço Combustível
  IF NEW.consumo_combustivel > 0 THEN
    despesa_combustivel := (km_rodado / NEW.consumo_combustivel) * NEW.preco_combustivel;
  ELSE
    despesa_combustivel := 0;
  END IF;
  
  -- Calculate total hours
  hora_inicio_parts := string_to_array(NEW.hora_inicio::text, ':');
  hora_fim_parts := string_to_array(NEW.hora_fim::text, ':');
  
  minutos_inicio := (hora_inicio_parts[1]::numeric * 60) + hora_inicio_parts[2]::numeric;
  minutos_fim := (hora_fim_parts[1]::numeric * 60) + hora_fim_parts[2]::numeric;
  
  -- Handle overnight shifts
  IF minutos_fim < minutos_inicio THEN
    minutos_fim := minutos_fim + (24 * 60);
  END IF;
  
  total_horas := (minutos_fim - minutos_inicio) / 60.0;
  
  -- Get outras_despesas value (default to 0 if null)
  outras_desp := COALESCE(NEW.outras_despesas, 0);
  
  -- Update calculated fields
  NEW.total_horas := total_horas;
  -- Lucro líquido now includes outras_despesas
  NEW.lucro_liquido := NEW.valor_ganho - despesa_combustivel - outras_desp;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;