-- ============================================
-- Script para corrigir consulta de role do usuário
-- Execute este script no Supabase Dashboard → SQL Editor
-- ============================================

-- 1. Criar função para obter role do usuário atual (usando SECURITY DEFINER para bypass RLS)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_role app_role;
BEGIN
  SELECT role INTO v_role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  RETURN v_role;
END;
$$;

-- 2. Garantir que a política RLS permite usuários verem seus próprios roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. Testar a função (enquanto estiver logado)
SELECT 
  auth.uid() as meu_user_id,
  public.get_current_user_role() as meu_role,
  CASE 
    WHEN public.get_current_user_role() = 'administrador' THEN '✅ ADMIN'
    WHEN public.get_current_user_role() = 'gestor' THEN '🔷 GESTOR'
    WHEN public.get_current_user_role() = 'motorista' THEN '👤 MOTORISTA'
    ELSE '❌ SEM ROLE'
  END as status;

-- 4. Verificar diretamente na tabela (para debug)
SELECT 
  ur.user_id,
  ur.role,
  au.email,
  CASE 
    WHEN ur.user_id = auth.uid() THEN '✅ Este é você!'
    ELSE 'Outro usuário'
  END as status
FROM public.user_roles ur
LEFT JOIN auth.users au ON au.id = ur.user_id
ORDER BY ur.created_at DESC;

-- 5. Garantir que RLS está habilitada na tabela
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

