-- Create table for multiple income sources per shift
CREATE TABLE public.turno_fontes_ganho (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  turno_id UUID NOT NULL REFERENCES public.turnos_km(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  fonte_ganho TEXT NOT NULL,
  quantidade_corridas INTEGER NOT NULL DEFAULT 0,
  valor_ganho NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.turno_fontes_ganho ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own shift income sources"
ON public.turno_fontes_ganho
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own shift income sources"
ON public.turno_fontes_ganho
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shift income sources"
ON public.turno_fontes_ganho
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shift income sources"
ON public.turno_fontes_ganho
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX idx_turno_fontes_ganho_turno_id ON public.turno_fontes_ganho(turno_id);
CREATE INDEX idx_turno_fontes_ganho_user_id ON public.turno_fontes_ganho(user_id);