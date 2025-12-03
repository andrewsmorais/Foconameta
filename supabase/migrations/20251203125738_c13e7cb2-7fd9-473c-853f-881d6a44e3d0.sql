-- Add new columns to ganhos_despesas table for enhanced functionality
ALTER TABLE public.ganhos_despesas 
ADD COLUMN IF NOT EXISTS nome text,
ADD COLUMN IF NOT EXISTS data_inicio date,
ADD COLUMN IF NOT EXISTS data_fim date,
ADD COLUMN IF NOT EXISTS incluir_dashboard boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.ganhos_despesas.nome IS 'Nome personalizado da transação';
COMMENT ON COLUMN public.ganhos_despesas.data_inicio IS 'Data de início para transações não recorrentes com prazo';
COMMENT ON COLUMN public.ganhos_despesas.data_fim IS 'Data final para transações não recorrentes com prazo';
COMMENT ON COLUMN public.ganhos_despesas.incluir_dashboard IS 'Se deve incluir nos cálculos do Dashboard';