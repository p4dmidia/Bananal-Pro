-- ============================================================================
-- BANANAL PRO - CORREÇÃO DE SEGURANÇA E POLÍTICAS DE RLS PARA USER_PROFILES
-- ============================================================================

-- 1. Habilita o Row Level Security (RLS) caso não esteja ativo
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Remove as políticas antigas para evitar duplicidades
DROP POLICY IF EXISTS "Users can update their own profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can delete any profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Permitir update para o próprio usuário" ON public.user_profiles;
DROP POLICY IF EXISTS "Permitir delete para admins" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can select profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profiles" ON public.user_profiles;

-- 3. Cria a política para visualização (SELECT) de perfis por usuários autenticados
CREATE POLICY "Users can select profiles"
    ON public.user_profiles
    FOR SELECT
    TO authenticated
    USING (true);

-- 4. Cria a política para inserção (INSERT) de novos perfis por usuários autenticados
-- Restringe para que o mocha_user_id seja o do usuário atual, o papel inicial seja 'user' e is_active seja false por padrão
CREATE POLICY "Users can insert their own profiles"
    ON public.user_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (
        mocha_user_id = auth.uid()::text 
        AND role = 'user' 
        AND is_active = false
    );

-- 5. Cria a política para usuários atualizarem seus próprios perfis
CREATE POLICY "Users can update their own profiles" 
    ON public.user_profiles 
    FOR UPDATE 
    TO authenticated
    USING (mocha_user_id = auth.uid()::text)
    WITH CHECK (mocha_user_id = auth.uid()::text);

-- 6. Cria a política para administradores atualizarem qualquer perfil
CREATE POLICY "Admins can update any profile" 
    ON public.user_profiles 
    FOR UPDATE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE mocha_user_id = auth.uid()::text AND role = 'admin'
        )
    );

-- 7. Cria a política para administradores excluírem qualquer perfil
CREATE POLICY "Admins can delete any profile" 
    ON public.user_profiles 
    FOR DELETE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE mocha_user_id = auth.uid()::text AND role = 'admin'
        )
    );

-- 8. Recarrega as configurações de schema do PostgREST
NOTIFY pgrst, 'reload schema';

-- 9. Criação da função de segurança para proteger campos sensíveis do perfil
CREATE OR REPLACE FUNCTION public.protect_user_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_id text;
  caller_role text;
BEGIN
  -- Obtém o ID do usuário autenticado no Supabase
  caller_id := auth.uid()::text;
  
  -- Se a chamada foi iniciada por um usuário logado no front-end (não por chave de serviço)
  IF caller_id IS NOT NULL THEN
    -- Busca o papel do usuário atual
    SELECT role INTO caller_role FROM public.user_profiles WHERE mocha_user_id = caller_id;
    
    -- Se não for administrador, restaura os valores originais das colunas sensíveis
    IF caller_role IS DISTINCT FROM 'admin' THEN
      NEW.role := OLD.role;
      NEW.is_active := OLD.is_active;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 10. Criação do trigger BEFORE UPDATE na tabela user_profiles
DROP TRIGGER IF EXISTS before_user_profile_update ON public.user_profiles;
CREATE TRIGGER before_user_profile_update
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE PROCEDURE public.protect_user_profile_fields();

