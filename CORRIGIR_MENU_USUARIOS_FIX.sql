-- ============================================
-- Script CORRIGIDO para corrigir o menu "Usuários" que sumiu
-- Execute este script no Supabase Dashboard → SQL Editor
-- ============================================

-- 1. Garantir que usuários possam ver seus próprios roles
-- (Isso é necessário para o hook useUserRole funcionar)
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. Verificar se o usuário atual tem role
-- Execute esta query para ver seu próprio role:
SELECT 
  auth.uid() as meu_user_id,
  ur.role as meu_role,
  CASE 
    WHEN ur.role = 'administrador' THEN '✅ Você é ADMINISTRADOR - Menu Usuários deve aparecer'
    WHEN ur.role = 'gestor' THEN '⚠️ Você é GESTOR (não administrador) - Menu Usuários NÃO aparece'
    WHEN ur.role = 'motorista' THEN '⚠️ Você é MOTORISTA (não administrador) - Menu Usuários NÃO aparece'
    ELSE '❌ Você NÃO TEM ROLE - Menu Usuários NÃO aparece'
  END as status
FROM public.user_roles ur
WHERE ur.user_id = auth.uid();

-- 3. Para tornar seu usuário atual como administrador:
-- Execute este bloco (DELETE + INSERT)
-- 
-- Primeiro, remover qualquer role existente do usuário
DELETE FROM public.user_roles WHERE user_id = auth.uid();

-- Depois, inserir o role de administrador
INSERT INTO public.user_roles (user_id, role)
VALUES (auth.uid(), 'administrador');

-- 4. Verificar novamente após a atualização:
SELECT 
  auth.uid() as meu_user_id,
  ur.role as meu_role,
  CASE 
    WHEN ur.role = 'administrador' THEN '✅ Agora você é ADMINISTRADOR!'
    ELSE '❌ Ainda não é administrador'
  END as status
FROM public.user_roles ur
WHERE ur.user_id = auth.uid();

-- 5. Ver todos os usuários e seus roles:
SELECT 
  au.email,
  ur.role,
  p.nome_completo,
  CASE 
    WHEN ur.role = 'administrador' THEN '✅ ADMIN'
    WHEN ur.role = 'gestor' THEN '🔷 GESTOR'
    WHEN ur.role = 'motorista' THEN '👤 MOTORISTA'
    ELSE '❌ SEM ROLE'
  END as status
FROM auth.users au
LEFT JOIN public.user_roles ur ON ur.user_id = au.id
LEFT JOIN public.profiles p ON p.id = au.id
ORDER BY au.created_at DESC;

