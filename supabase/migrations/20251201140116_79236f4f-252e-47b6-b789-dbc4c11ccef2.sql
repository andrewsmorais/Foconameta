-- Remover constraint antiga que não inclui 'anual'
ALTER TABLE metas DROP CONSTRAINT IF EXISTS metas_tipo_check;

-- Criar nova constraint incluindo 'anual'
ALTER TABLE metas ADD CONSTRAINT metas_tipo_check 
CHECK (tipo = ANY (ARRAY['diaria'::text, 'semanal'::text, 'mensal'::text, 'anual'::text]));

-- Inserir Meta Anual para usuários existentes que não a possuem
INSERT INTO metas (user_id, tipo, valor_meta, data_inicio, data_fim, ativa, fixa)
SELECT 
  DISTINCT m.user_id,
  'anual' as tipo,
  0 as valor_meta,
  date_trunc('year', CURRENT_DATE)::date as data_inicio,
  (date_trunc('year', CURRENT_DATE) + interval '1 year - 1 day')::date as data_fim,
  true as ativa,
  true as fixa
FROM metas m
WHERE m.fixa = true
  AND NOT EXISTS (
    SELECT 1 
    FROM metas m2 
    WHERE m2.user_id = m.user_id 
      AND m2.tipo = 'anual' 
      AND m2.fixa = true
  );