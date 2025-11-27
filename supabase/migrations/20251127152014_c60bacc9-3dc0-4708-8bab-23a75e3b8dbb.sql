-- Create veiculos table
CREATE TABLE public.veiculos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  modelo TEXT NOT NULL,
  placa TEXT NOT NULL,
  ano INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create turnos_km table
CREATE TABLE public.turnos_km (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  veiculo_id UUID NOT NULL REFERENCES public.veiculos(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  km_inicial DECIMAL(10,2) NOT NULL,
  km_final DECIMAL(10,2) NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  tipo_combustivel TEXT NOT NULL,
  preco_combustivel DECIMAL(10,2) NOT NULL,
  consumo_combustivel DECIMAL(10,2) NOT NULL,
  fonte_ganho TEXT NOT NULL,
  categoria_ganho TEXT NOT NULL,
  valor_ganho DECIMAL(10,2) NOT NULL,
  lucro_liquido DECIMAL(10,2),
  total_horas DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ganhos_despesas table
CREATE TABLE public.ganhos_despesas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('ganho', 'despesa')),
  categoria TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  data DATE NOT NULL,
  recorrente BOOLEAN NOT NULL DEFAULT false,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create manutencoes table
CREATE TABLE public.manutencoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  veiculo_id UUID NOT NULL REFERENCES public.veiculos(id) ON DELETE CASCADE,
  tipo_manutencao TEXT NOT NULL,
  data DATE NOT NULL,
  km_atual DECIMAL(10,2) NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  proximo_km DECIMAL(10,2),
  observacoes TEXT,
  comprovante_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create metas table
CREATE TABLE public.metas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('diaria', 'semanal', 'mensal')),
  valor_meta DECIMAL(10,2) NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  ativa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turnos_km ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ganhos_despesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manutencoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for veiculos
CREATE POLICY "Users can view their own vehicles"
ON public.veiculos FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own vehicles"
ON public.veiculos FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vehicles"
ON public.veiculos FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vehicles"
ON public.veiculos FOR DELETE
USING (auth.uid() = user_id);

-- Create RLS policies for turnos_km
CREATE POLICY "Users can view their own shifts"
ON public.turnos_km FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own shifts"
ON public.turnos_km FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shifts"
ON public.turnos_km FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shifts"
ON public.turnos_km FOR DELETE
USING (auth.uid() = user_id);

-- Create RLS policies for ganhos_despesas
CREATE POLICY "Users can view their own transactions"
ON public.ganhos_despesas FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions"
ON public.ganhos_despesas FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
ON public.ganhos_despesas FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
ON public.ganhos_despesas FOR DELETE
USING (auth.uid() = user_id);

-- Create RLS policies for manutencoes
CREATE POLICY "Users can view their own maintenances"
ON public.manutencoes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own maintenances"
ON public.manutencoes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own maintenances"
ON public.manutencoes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own maintenances"
ON public.manutencoes FOR DELETE
USING (auth.uid() = user_id);

-- Create RLS policies for metas
CREATE POLICY "Users can view their own goals"
ON public.metas FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own goals"
ON public.metas FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
ON public.metas FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals"
ON public.metas FOR DELETE
USING (auth.uid() = user_id);

-- Create function to calculate lucro_liquido and total_horas
CREATE OR REPLACE FUNCTION public.calculate_turno_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate total hours (difference between hora_fim and hora_inicio)
  NEW.total_horas := EXTRACT(EPOCH FROM (NEW.hora_fim - NEW.hora_inicio)) / 3600;
  
  -- Calculate lucro_liquido (ganho - despesa com combustível)
  NEW.lucro_liquido := NEW.valor_ganho - (NEW.consumo_combustivel * NEW.preco_combustivel);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic calculation
CREATE TRIGGER calculate_turno_metrics_trigger
BEFORE INSERT OR UPDATE ON public.turnos_km
FOR EACH ROW
EXECUTE FUNCTION public.calculate_turno_metrics();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;