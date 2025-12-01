-- Atualizar constraint para permitir tipo "personalizada"
ALTER TABLE metas DROP CONSTRAINT IF EXISTS metas_tipo_check;

ALTER TABLE metas ADD CONSTRAINT metas_tipo_check 
  CHECK (tipo = ANY (ARRAY['diaria'::text, 'semanal'::text, 'mensal'::text, 'anual'::text, 'personalizada'::text]));