-- ============================================
-- Script de Setup do Banco de Dados
-- Execute este script no Supabase Dashboard → SQL Editor
-- ============================================

-- 1. Criar tipos ENUM se não existirem
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('motorista', 'gestor', 'administrador');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.defect_severity AS ENUM ('leve', 'moderado', 'critico');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.defect_status AS ENUM ('aberto', 'em_analise', 'resolvido');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.checklist_status AS ENUM ('ok', 'com_defeito', 'pendente', 'concluido');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Criar tabela vehicles
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placa TEXT UNIQUE NOT NULL,
  modelo TEXT NOT NULL,
  ano INTEGER NOT NULL,
  chassi TEXT,
  quilometragem_atual INTEGER NOT NULL DEFAULT 0,
  foto_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Criar tabela profiles (se não existir)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo TEXT NOT NULL,
  telefone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Criar tabela user_roles (se não existir)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'motorista',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- 5. Criar tabela checklist_templates (se não existir)
CREATE TABLE IF NOT EXISTS public.checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Criar tabela checklists com campos adicionais
CREATE TABLE IF NOT EXISTS public.checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  motorista_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
  odometro_inicial INTEGER NOT NULL,
  odometro_final INTEGER,
  motorista_nome TEXT,
  motorista_funcao TEXT,
  motorista_matricula TEXT,
  motorista_contrato TEXT,
  fotos_veiculo TEXT[], -- Array de URLs das fotos
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  comentarios TEXT,
  status checklist_status NOT NULL DEFAULT 'pendente',
  assinado BOOLEAN DEFAULT FALSE,
  assinado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar colunas que podem não existir
DO $$ 
BEGIN
  -- Adicionar campos de motorista se não existirem
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='checklists' AND column_name='motorista_nome') THEN
    ALTER TABLE public.checklists ADD COLUMN motorista_nome TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='checklists' AND column_name='motorista_funcao') THEN
    ALTER TABLE public.checklists ADD COLUMN motorista_funcao TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='checklists' AND column_name='motorista_matricula') THEN
    ALTER TABLE public.checklists ADD COLUMN motorista_matricula TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='checklists' AND column_name='motorista_contrato') THEN
    ALTER TABLE public.checklists ADD COLUMN motorista_contrato TEXT;
  END IF;
  
  -- Adicionar campo fotos_veiculo como array se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='checklists' AND column_name='fotos_veiculo') THEN
    ALTER TABLE public.checklists ADD COLUMN fotos_veiculo TEXT[];
  END IF;
END $$;

-- 7. Criar tabela checklist_template_items (se não existir)
CREATE TABLE IF NOT EXISTS public.checklist_template_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  ordem INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Criar tabela checklist_responses (se não existir)
CREATE TABLE IF NOT EXISTS public.checklist_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES public.checklists(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.checklist_template_items(id) ON DELETE CASCADE,
  conforme BOOLEAN NOT NULL,
  observacao TEXT,
  foto_url TEXT,
  fotos_urls TEXT[], -- Array de URLs para múltiplas fotos
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar fotos_urls se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='checklist_responses' AND column_name='fotos_urls') THEN
    ALTER TABLE public.checklist_responses ADD COLUMN fotos_urls TEXT[];
  END IF;
END $$;

-- 9. Criar tabela defects (se não existir)
CREATE TABLE IF NOT EXISTS public.defects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  checklist_id UUID REFERENCES public.checklists(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  severidade defect_severity NOT NULL DEFAULT 'leve',
  status defect_status NOT NULL DEFAULT 'aberto',
  foto_url TEXT,
  resolvido_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolvido_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Habilitar Row Level Security (RLS)
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.defects ENABLE ROW LEVEL SECURITY;

-- 11. Criar políticas RLS para vehicles
DROP POLICY IF EXISTS "Usuários autenticados podem ver veículos" ON public.vehicles;
CREATE POLICY "Usuários autenticados podem ver veículos"
  ON public.vehicles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Usuários autenticados podem criar veículos" ON public.vehicles;
CREATE POLICY "Usuários autenticados podem criar veículos"
  ON public.vehicles FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Usuários autenticados podem atualizar veículos" ON public.vehicles;
CREATE POLICY "Usuários autenticados podem atualizar veículos"
  ON public.vehicles FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Usuários autenticados podem excluir veículos" ON public.vehicles;
CREATE POLICY "Usuários autenticados podem excluir veículos"
  ON public.vehicles FOR DELETE
  TO authenticated
  USING (true);

-- 12. Criar políticas RLS para checklists
DROP POLICY IF EXISTS "Usuários autenticados podem ver checklists" ON public.checklists;
CREATE POLICY "Usuários autenticados podem ver checklists"
  ON public.checklists FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Usuários autenticados podem criar checklists" ON public.checklists;
CREATE POLICY "Usuários autenticados podem criar checklists"
  ON public.checklists FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Usuários autenticados podem atualizar checklists" ON public.checklists;
CREATE POLICY "Usuários autenticados podem atualizar checklists"
  ON public.checklists FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 13. Criar políticas RLS para profiles
DROP POLICY IF EXISTS "Usuários podem ver próprios perfis" ON public.profiles;
CREATE POLICY "Usuários podem ver próprios perfis"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuários podem atualizar próprios perfis" ON public.profiles;
CREATE POLICY "Usuários podem atualizar próprios perfis"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 14. Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 15. Triggers para updated_at
DROP TRIGGER IF EXISTS update_vehicles_updated_at ON public.vehicles;
CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_checklists_updated_at ON public.checklists;
CREATE TRIGGER update_checklists_updated_at
  BEFORE UPDATE ON public.checklists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 16. Inserir template padrão se não existir
INSERT INTO public.checklist_templates (nome, descricao)
SELECT 'Inspeção Geral de Veículo', 'Template padrão para inspeção diária de veículos'
WHERE NOT EXISTS (
  SELECT 1 FROM public.checklist_templates WHERE nome = 'Inspeção Geral de Veículo'
);

-- 17. Inserir itens do template se não existirem
DO $$
DECLARE
  v_template_id UUID;
BEGIN
  SELECT id INTO v_template_id FROM public.checklist_templates WHERE nome = 'Inspeção Geral de Veículo' LIMIT 1;
  
  IF v_template_id IS NOT NULL THEN
    INSERT INTO public.checklist_template_items (template_id, nome, descricao, ordem)
    SELECT v_template_id, v.nome, v.descricao, v.ordem
    FROM (VALUES
      ('Pneus', 'Verificar calibragem e condição dos pneus', 1),
      ('Freios', 'Testar eficiência dos freios', 2),
      ('Luzes', 'Verificar funcionamento de faróis, lanternas e setas', 3),
      ('Lataria', 'Inspecionar condição da lataria e pintura', 4),
      ('Motor', 'Verificar níveis de óleo e líquido de arrefecimento', 5),
      ('Documentação', 'Conferir presença de documentos obrigatórios', 6),
      ('Extintor', 'Verificar validade e condição do extintor', 7),
      ('Triângulo', 'Confirmar presença do triângulo de segurança', 8),
      ('Limpeza Interna', 'Avaliar limpeza e organização do interior', 9),
      ('Combustível', 'Verificar nível de combustível', 10)
    ) AS v(nome, descricao, ordem)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.checklist_template_items 
      WHERE checklist_template_items.template_id = v_template_id 
        AND checklist_template_items.nome = v.nome
    );
  END IF;
END $$;

-- ============================================
-- Fim do script
-- ============================================

