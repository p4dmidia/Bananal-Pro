-- ============================================================================
-- BANANAL PRO - RESTAURAR ACESSO IMEDIATO AOS PERFIS (CORREÇÃO DE LOGIN)
-- ============================================================================

-- 1. Conceder permissão de SELECT em todas as colunas para usuários autenticados e anônimos
GRANT SELECT ON public.user_profiles TO authenticated, anon;

-- 2. Recriar a política padrão de leitura para permitir que o app valide o status ativo
DROP POLICY IF EXISTS "Users can select profiles" ON public.user_profiles;
CREATE POLICY "Users can select profiles"
    ON public.user_profiles
    FOR SELECT
    TO authenticated
    USING (true);

-- 3. Notificar o PostgREST para recarregar o cache
NOTIFY pgrst, 'reload schema';
