-- Criar bucket para fotos de checklist
INSERT INTO storage.buckets (id, name, public)
VALUES ('checklist-photos', 'checklist-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Adicionar políticas de storage para fotos de checklist
CREATE POLICY "Usuários autenticados podem fazer upload de fotos de checklist"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'checklist-photos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Fotos de checklist são públicas para visualização"
ON storage.objects
FOR SELECT
USING (bucket_id = 'checklist-photos');

CREATE POLICY "Usuários podem atualizar suas próprias fotos de checklist"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'checklist-photos' AND auth.role() = 'authenticated');

-- Adicionar campos de informações do motorista e fotos à tabela checklists
ALTER TABLE checklists
ADD COLUMN IF NOT EXISTS motorista_nome TEXT,
ADD COLUMN IF NOT EXISTS motorista_funcao TEXT,
ADD COLUMN IF NOT EXISTS motorista_matricula TEXT,
ADD COLUMN IF NOT EXISTS motorista_contrato TEXT,
ADD COLUMN IF NOT EXISTS fotos_veiculo TEXT[] DEFAULT ARRAY[]::TEXT[];