-- ============================================================================
-- BANANAL PRO - CORREÇÃO DE POLÍTICAS RLS PARA GESTÃO DE COMENTÁRIOS (AULAS)
-- ============================================================================

-- 1. Garantir RLS habilitado na tabela de comentários
ALTER TABLE public.lesson_comments ENABLE ROW LEVEL SECURITY;

-- 2. Remover política administrativa antiga para evitar duplicações
DROP POLICY IF EXISTS "Gerenciamento total para admins" ON public.lesson_comments;

-- 3. Criar política de GERENCIAMENTO (ALL) para administradores autenticados
CREATE POLICY "Gerenciamento total para admins"
    ON public.lesson_comments
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

-- 4. Notificar o PostgREST para recarregar o schema
NOTIFY pgrst, 'reload schema';
