-- ============================================================================
-- BANANAL PRO - FUNÇÃO DE SEGURANÇA PARA ATUALIZAÇÃO DE SENHA POR ADMINISTRADOR
-- ============================================================================

-- Habilita a extensão pgcrypto se não estiver habilitada (necessária para crypt/gen_salt)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Cria ou substitui a função admin_update_user_password
CREATE OR REPLACE FUNCTION public.admin_update_user_password(
  target_user_id TEXT,
  new_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com os privilégios do criador (postgres), ignorando RLS para auth.users
AS $$
BEGIN
  -- 1. Verificar se o usuário que está chamando a função é administrador
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE mocha_user_id = auth.uid()::text AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Acesso negado: Apenas administradores do sistema podem redefinir senhas.';
  END IF;

  -- 2. Atualizar a senha criptografada na tabela auth.users do Supabase
  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf'))
  WHERE id = target_user_id::uuid;

  RETURN TRUE;
END;
$$;
