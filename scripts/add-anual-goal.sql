-- Script para adicionar Meta Anual a usuários existentes que não a possuem
-- Execute este script no SQL Editor do Supabase

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
  )
ON CONFLICT DO NOTHING;

-- Verificar as metas criadas
SELECT user_id, tipo, valor_meta, data_inicio, data_fim, fixa 
FROM metas 
WHERE tipo = 'anual' 
ORDER BY created_at DESC;
