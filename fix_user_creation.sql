-- ============================================
-- Script para corrigir criação de usuários
-- Execute este script no Supabase Dashboard → SQL Editor
-- ============================================

-- 1. Criar função para obter emails dos usuários (apenas administradores)
CREATE OR REPLACE FUNCTION public.get_user_emails()
RETURNS TABLE (id UUID, email TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  -- Verificar se o usuário atual é administrador
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'administrador'
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem ver emails dos usuários';
  END IF;

  -- Retornar emails dos usuários
  RETURN QUERY
  SELECT au.id, au.email
  FROM auth.users au;
END;
$$;

-- 3. Função para atualizar role após criação do usuário
CREATE OR REPLACE FUNCTION public.set_user_role(
  p_user_id UUID,
  p_role TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_role TEXT;
BEGIN
  -- Verificar se o usuário atual é administrador
  SELECT role INTO v_current_user_role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_current_user_role != 'administrador' THEN
    RETURN json_build_object(
      'error', true,
      'message', 'Apenas administradores podem definir roles'
    );
  END IF;

  -- Remover role anterior se existir
  DELETE FROM public.user_roles WHERE user_id = p_user_id;

  -- Inserir novo role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, p_role::app_role)
  ON CONFLICT (user_id) DO UPDATE SET role = p_role::app_role;

  RETURN json_build_object(
    'error', false,
    'message', 'Role definido com sucesso'
  );
END;
$$;

-- 4. Atualizar função handle_new_user para não criar role automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Criar perfil apenas, sem role
  -- O role será definido pela Edge Function ou por administrador
  INSERT INTO public.profiles (id, nome_completo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', SPLIT_PART(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- NÃO criar role automaticamente aqui
  -- Será criado pela Edge Function ou depois por administrador
  
  RETURN NEW;
END;
$$;

-- 5. Política para permitir administradores criarem/atualizarem user_roles
DROP POLICY IF EXISTS "Administradores podem gerenciar roles" ON public.user_roles;
CREATE POLICY "Administradores podem gerenciar roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'administrador'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'administrador'
    )
  );

-- 6. Política para permitir administradores verem todos os profiles
DROP POLICY IF EXISTS "Administradores podem ver todos os perfis" ON public.profiles;
CREATE POLICY "Administradores podem ver todos os perfis"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'administrador'
    )
    OR id = auth.uid()
  );

-- 7. Política para permitir administradores criarem perfis
DROP POLICY IF EXISTS "Administradores podem criar perfis" ON public.profiles;
CREATE POLICY "Administradores podem criar perfis"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'administrador'
    )
  );

-- ============================================
-- Fim do script
-- ============================================
