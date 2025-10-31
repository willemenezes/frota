-- ============================================
-- Script para verificar e corrigir role de administrador
-- Execute este script no Supabase Dashboard → SQL Editor
-- ============================================

-- 1. Verificar todos os usuários e seus roles
SELECT 
  au.id,
  au.email,
  ur.role,
  p.nome_completo
FROM auth.users au
LEFT JOIN public.user_roles ur ON ur.user_id = au.id
LEFT JOIN public.profiles p ON p.id = au.id
ORDER BY au.created_at DESC;

-- 2. Verificar se o usuário atual tem role de administrador
-- (Execute enquanto estiver logado no sistema)
SELECT 
  auth.uid() as current_user_id,
  ur.role,
  CASE 
    WHEN ur.role = 'administrador' THEN 'SIM'
    ELSE 'NÃO'
  END as is_admin
FROM public.user_roles ur
WHERE ur.user_id = auth.uid();

-- 3. Para definir um usuário como administrador manualmente:
-- Substitua '<USER_EMAIL>' pelo email do usuário que você quer tornar administrador
-- 
-- UPDATE public.user_roles
-- SET role = 'administrador'
-- WHERE user_id = (
--   SELECT id FROM auth.users WHERE email = '<USER_EMAIL>'
-- );
-- 
-- Se o usuário não tiver role, crie um:
-- 
-- INSERT INTO public.user_roles (user_id, role)
-- SELECT id, 'administrador'
-- FROM auth.users
-- WHERE email = '<USER_EMAIL>'
-- ON CONFLICT (user_id) DO UPDATE SET role = 'administrador';

-- 4. Garantir que políticas RLS permitam que usuários vejam seus próprios roles
-- (Já deve estar configurado, mas vamos garantir)
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. Permitir que administradores vejam todos os roles
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'administrador'
    )
  );

