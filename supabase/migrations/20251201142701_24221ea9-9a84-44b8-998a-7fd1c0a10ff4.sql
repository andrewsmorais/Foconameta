-- Adicionar coluna para métrica de rastreamento na tabela metas
ALTER TABLE public.metas 
ADD COLUMN metrica_rastreamento TEXT NOT NULL DEFAULT 'lucro_liquido';

-- Adicionar constraint para validar valores permitidos
ALTER TABLE public.metas
ADD CONSTRAINT metas_metrica_rastreamento_check 
CHECK (metrica_rastreamento IN ('lucro_liquido', 'ganhos_brutos'));

-- Comentário explicativo
COMMENT ON COLUMN public.metas.metrica_rastreamento IS 'Métrica usada para calcular progresso da meta: lucro_liquido ou ganhos_brutos';