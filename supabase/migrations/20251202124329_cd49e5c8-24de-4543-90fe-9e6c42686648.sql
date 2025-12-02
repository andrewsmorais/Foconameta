-- Add peca_trocada column to manutencoes table
ALTER TABLE public.manutencoes 
ADD COLUMN peca_trocada text;