-- ============================================
-- Script para definir usuário como ADMINISTRADOR
-- Execute este script no Supabase Dashboard → SQL Editor
-- ============================================

-- IMPORTANTE: auth.uid() não funciona no SQL Editor do Dashboard
-- Use o email do seu usuário abaixo

-- 1. Ver todos os usuários e seus roles atuais
SELECT 
  au.id,
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

-- 2. Para tornar seu usuário como ADMINISTRADOR:
-- Substitua 'wille.menezes@cgbengenharia.com.br' pelo SEU email
-- 
-- Primeiro, remover qualquer role existente
DELETE FROM public.user_roles 
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'wille.menezes@cgbengenharia.com.br'
);

-- Depois, inserir o role de administrador
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'administrador'
FROM auth.users
WHERE email = 'wille.menezes@cgbengenharia.com.br';

-- 3. Verificar se foi atualizado corretamente
SELECT 
  au.email,
  ur.role,
  p.nome_completo,
  '✅ AGORA VOCÊ É ADMINISTRADOR! Recarregue a página do sistema.' as status
FROM auth.users au
LEFT JOIN public.user_roles ur ON ur.user_id = au.id
LEFT JOIN public.profiles p ON p.id = au.id
WHERE au.email = 'wille.menezes@cgbengenharia.com.br';

-- 4. Ver todos os usuários novamente para confirmar
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

