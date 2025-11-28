-- Adicionar campos faltantes na tabela manutencoes
ALTER TABLE public.manutencoes 
ADD COLUMN IF NOT EXISTS km_final numeric,
ADD COLUMN IF NOT EXISTS nome_oficina_produto text;

-- Atualizar comentários das colunas para documentação
COMMENT ON COLUMN public.manutencoes.km_atual IS 'KM inicial do veículo na manutenção';
COMMENT ON COLUMN public.manutencoes.km_final IS 'KM final do veículo após a manutenção';
COMMENT ON COLUMN public.manutencoes.nome_oficina_produto IS 'Nome da oficina ou produto utilizado na manutenção';