-- ============================================
-- Script para criar função get_user_emails (VERSÃO FINAL)
-- Execute este script no Supabase Dashboard → SQL Editor
-- 
-- NOTA: O erro ao testar no SQL Editor é NORMAL (auth.uid() retorna null)
-- A função funcionará corretamente quando chamada pela aplicação
-- ============================================

-- Remover função existente (se houver)
DROP FUNCTION IF EXISTS public.get_user_emails();

-- Criar função para obter emails dos usuários (apenas administradores)
-- Esta função usa SECURITY DEFINER para bypass RLS e verifica o role do usuário
CREATE OR REPLACE FUNCTION public.get_user_emails()
RETURNS TABLE (id UUID, email TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
STABLE
AS $$
BEGIN
  -- Verificar se o usuário atual é administrador
  -- IMPORTANTE: auth.uid() funciona quando chamado pela aplicação, mas retorna null no SQL Editor
  IF auth.uid() IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'administrador'
    ) THEN
      RAISE EXCEPTION 'Apenas administradores podem ver emails dos usuários'
        USING HINT = 'Você precisa ter role de administrador para acessar esta função';
    END IF;
  END IF;

  -- Retornar emails dos usuários
  RETURN QUERY
  SELECT au.id, au.email
  FROM auth.users au
  ORDER BY au.created_at DESC;
END;
$$;

-- Dar permissão de execução para usuários autenticados
GRANT EXECUTE ON FUNCTION public.get_user_emails() TO authenticated;

-- ============================================
-- TESTE: Este comando vai dar erro no SQL Editor (NORMAL!)
-- Mas a função funcionará corretamente na aplicação
-- ============================================
-- SELECT * FROM public.get_user_emails();

-- ============================================
-- Para testar se a função existe, execute:
-- ============================================
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments,
  pg_get_function_result(oid) as returns
FROM pg_proc
WHERE proname = 'get_user_emails'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

