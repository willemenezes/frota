-- ============================================
-- Script para corrigir políticas RLS de user_roles
-- Execute este script no Supabase Dashboard → SQL Editor
-- ============================================

-- 1. Remover todas as políticas existentes de user_roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Administradores podem gerenciar roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;

-- 2. Criar política para usuários verem seus próprios roles (CRÍTICO!)
-- Esta política é necessária para o hook useUserRole funcionar
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. Criar política para administradores gerenciarem todos os roles
CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (
    -- Permite se for o próprio role do usuário
    auth.uid() = user_id OR
    -- OU se o usuário atual é administrador
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'administrador'
    )
  )
  WITH CHECK (
    -- Permite se for o próprio role do usuário
    auth.uid() = user_id OR
    -- OU se o usuário atual é administrador
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'administrador'
    )
  );

-- 4. Verificar se a política está funcionando
-- Execute esta query enquanto estiver logado no sistema para testar:
SELECT 
  'Política RLS testada' as status,
  auth.uid() as meu_user_id,
  ur.role as meu_role
FROM public.user_roles ur
WHERE ur.user_id = auth.uid();

-- 5. Verificar se você consegue ver seu próprio role
SELECT 
  ur.role,
  '✅ Você consegue ver seu role!' as status
FROM public.user_roles ur
WHERE ur.user_id = auth.uid();

