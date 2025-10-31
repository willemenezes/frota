-- Modificar checklist_responses para suportar múltiplas fotos por item
ALTER TABLE checklist_responses 
DROP COLUMN IF EXISTS foto_url;

ALTER TABLE checklist_responses 
ADD COLUMN fotos_urls text[] DEFAULT ARRAY[]::text[];

COMMENT ON COLUMN checklist_responses.fotos_urls IS 'Array de URLs das fotos anexadas ao item do checklist';