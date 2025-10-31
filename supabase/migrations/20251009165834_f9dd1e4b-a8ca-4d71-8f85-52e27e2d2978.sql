-- Remover a constraint existente e recriar apontando para profiles
ALTER TABLE checklists 
DROP CONSTRAINT IF EXISTS checklists_motorista_id_fkey;

ALTER TABLE checklists 
ADD CONSTRAINT checklists_motorista_id_fkey 
FOREIGN KEY (motorista_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;

-- Também adicionar foreign keys para as outras tabelas se necessário
ALTER TABLE checklists 
DROP CONSTRAINT IF EXISTS checklists_template_id_fkey;

ALTER TABLE checklists 
ADD CONSTRAINT checklists_template_id_fkey 
FOREIGN KEY (template_id) 
REFERENCES checklist_templates(id) 
ON DELETE RESTRICT;

ALTER TABLE checklists 
DROP CONSTRAINT IF EXISTS checklists_vehicle_id_fkey;

ALTER TABLE checklists 
ADD CONSTRAINT checklists_vehicle_id_fkey 
FOREIGN KEY (vehicle_id) 
REFERENCES vehicles(id) 
ON DELETE CASCADE;