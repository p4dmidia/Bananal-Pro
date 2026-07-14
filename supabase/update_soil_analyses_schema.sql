-- =========================================================================
-- MIGRATION: Atualização da Tabela de Análises de Solo e Políticas RLS
-- Executar no Editor SQL do Painel do Supabase (https://supabase.com/dashboard)
-- =========================================================================

-- 1. Adicionar a coluna document_url para armazenar laudos PDF/Imagem
ALTER TABLE public.soil_analyses 
ADD COLUMN IF NOT EXISTS document_url TEXT;

-- 2. Limpar políticas RLS antigas
DROP POLICY IF EXISTS "Users can select their own soil_analyses" ON public.soil_analyses;
DROP POLICY IF EXISTS "Users can insert their own soil_analyses" ON public.soil_analyses;
DROP POLICY IF EXISTS "Users can update their own soil_analyses" ON public.soil_analyses;
DROP POLICY IF EXISTS "Users can delete their own soil_analyses" ON public.soil_analyses;

DROP POLICY IF EXISTS "Users and admin/partner/pj can select soil_analyses" ON public.soil_analyses;
DROP POLICY IF EXISTS "Users and admin/partner/pj can insert soil_analyses" ON public.soil_analyses;
DROP POLICY IF EXISTS "Users and admin/partner/pj can update soil_analyses" ON public.soil_analyses;
DROP POLICY IF EXISTS "Users and admin/partner/pj can delete soil_analyses" ON public.soil_analyses;

-- 3. Criar novas políticas que permitem que donos e perfis (admin, partner, pj) acessem/editem
CREATE POLICY "Users and admin/partner/pj can select soil_analyses" ON public.soil_analyses
    FOR SELECT TO authenticated USING (
        user_id = (SELECT id FROM public.user_profiles WHERE mocha_user_id = auth.uid()::text)
        OR EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE mocha_user_id = auth.uid()::text 
            AND role IN ('admin', 'partner', 'pj')
        )
    );

CREATE POLICY "Users and admin/partner/pj can insert soil_analyses" ON public.soil_analyses
    FOR INSERT TO authenticated WITH CHECK (
        user_id = (SELECT id FROM public.user_profiles WHERE mocha_user_id = auth.uid()::text)
        OR EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE mocha_user_id = auth.uid()::text 
            AND role IN ('admin', 'partner', 'pj')
        )
    );

CREATE POLICY "Users and admin/partner/pj can update soil_analyses" ON public.soil_analyses
    FOR UPDATE TO authenticated USING (
        user_id = (SELECT id FROM public.user_profiles WHERE mocha_user_id = auth.uid()::text)
        OR EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE mocha_user_id = auth.uid()::text 
            AND role IN ('admin', 'partner', 'pj')
        )
    );

CREATE POLICY "Users and admin/partner/pj can delete soil_analyses" ON public.soil_analyses
    FOR DELETE TO authenticated USING (
        user_id = (SELECT id FROM public.user_profiles WHERE mocha_user_id = auth.uid()::text)
        OR EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE mocha_user_id = auth.uid()::text 
            AND role IN ('admin', 'partner', 'pj')
        )
    );

-- 4. Notificar PostgREST para recarregar o cache do esquema
NOTIFY pgrst, 'reload schema';
