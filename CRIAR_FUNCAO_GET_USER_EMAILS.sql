-- ============================================
-- Script para criar/recriar função get_user_emails
-- Execute este script no Supabase Dashboard → SQL Editor
-- ============================================

-- Remover função existente (se houver)
DROP FUNCTION IF EXISTS public.get_user_emails();

-- Criar função para obter emails dos usuários (apenas administradores)
CREATE OR REPLACE FUNCTION public.get_user_emails()
RETURNS TABLE (id UUID, email TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
STABLE
AS $$
BEGIN
  -- Verificar se o usuário atual é administrador
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'administrador'
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem ver emails dos usuários'
      USING HINT = 'Você precisa ter role de administrador para acessar esta função';
  END IF;

  -- Retornar emails dos usuários
  RETURN QUERY
  SELECT au.id, au.email
  FROM auth.users au;
END;
$$;

-- Dar permissão de execução para usuários autenticados
GRANT EXECUTE ON FUNCTION public.get_user_emails() TO authenticated;

-- Testar a função (deve funcionar se você for administrador)
SELECT * FROM public.get_user_emails();

