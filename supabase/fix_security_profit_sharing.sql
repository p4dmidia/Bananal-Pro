-- ============================================================================
-- BANANAL PRO - CORREÇÃO DE SEGURANÇA NA DIVISÃO DE LUCROS E RATEIO
-- ============================================================================

-- 1. Limpeza da política vulnerável anterior
DROP POLICY IF EXISTS "Authenticated users can select profit_sharing_config" ON public.profit_sharing_config;

-- 2. Recriação com restrição de acesso:
-- Apenas administradores, sócios e o próprio usuário cujo rateio está sendo configurado podem ver.
CREATE POLICY "Authenticated users can select profit_sharing_config" ON public.profit_sharing_config
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE mocha_user_id = auth.uid()::text AND role IN ('admin', 'partner')
        )
        OR user_id = (
            SELECT id FROM public.user_profiles 
            WHERE mocha_user_id = auth.uid()::text
        )
    );

-- Recarregar cache do PostgREST
NOTIFY pgrst, 'reload schema';
