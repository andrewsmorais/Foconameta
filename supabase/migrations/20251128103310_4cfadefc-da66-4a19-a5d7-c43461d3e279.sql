-- Adicionar campo para nome personalizado de metas
ALTER TABLE public.metas 
ADD COLUMN IF NOT EXISTS nome_personalizado text;

-- Comentário para documentação
COMMENT ON COLUMN public.metas.nome_personalizado IS 'Nome personalizado da meta definido pelo usuário (opcional). Se NULL, usa o tipo como nome.';