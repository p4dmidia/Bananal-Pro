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

-- 3. Cria a política para usuários atualizarem seus próprios perfis
CREATE POLICY "Users can update their own profiles" 
    ON public.user_profiles 
    FOR UPDATE 
    TO authenticated
    USING (mocha_user_id = auth.uid()::text)
    WITH CHECK (mocha_user_id = auth.uid()::text);

-- 4. Cria a política para administradores atualizarem qualquer perfil
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

-- 5. Cria a política para administradores excluírem qualquer perfil
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

-- 6. Recarrega as configurações de schema do PostgREST
NOTIFY pgrst, 'reload schema';
