-- ============================================================================
-- BANANAL PRO - POLÍTICAS RLS PARA ADMINISTRAÇÃO DA COMUNIDADE
-- ============================================================================

-- 1. Remover políticas administrativas antigas para evitar duplicações
DROP POLICY IF EXISTS "Gerenciamento total para admins" ON public.community_posts;
DROP POLICY IF EXISTS "Gerenciamento total para admins" ON public.community_post_comments;

-- 2. Criar política de Gerenciamento total (ALL) para administradores autenticados

-- Tabela: community_posts
CREATE POLICY "Gerenciamento total para admins"
    ON public.community_posts
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE mocha_user_id = auth.uid()::text
              AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE mocha_user_id = auth.uid()::text
              AND role = 'admin'
        )
    );

-- Tabela: community_post_comments
CREATE POLICY "Gerenciamento total para admins"
    ON public.community_post_comments
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE mocha_user_id = auth.uid()::text
              AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE mocha_user_id = auth.uid()::text
              AND role = 'admin'
        )
    );

-- 3. Notificar o PostgREST para recarregar o schema
NOTIFY pgrst, 'reload schema';
