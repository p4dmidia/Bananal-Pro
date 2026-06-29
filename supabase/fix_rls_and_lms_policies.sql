-- ============================================================================
-- BANANAL PRO - CORREÇÃO DE SEGURANÇA E POLÍTICAS DE RLS (FASE 1)
-- ============================================================================

-- 1. HABILITAR ROW LEVEL SECURITY (RLS) NAS TABELAS CRÍTICAS EXISTENTES
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.producer_areas ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. POLÍTICAS PARA A TABELA DE PEDIDOS (orders)
-- ============================================================================
DROP POLICY IF EXISTS "Users can select their own orders" ON public.orders;
CREATE POLICY "Users can select their own orders" 
    ON public.orders FOR SELECT TO authenticated 
    USING (user_id = (SELECT id FROM public.user_profiles WHERE mocha_user_id = auth.uid()::text));

DROP POLICY IF EXISTS "Admins can select all orders" ON public.orders;
CREATE POLICY "Admins can select all orders" 
    ON public.orders FOR SELECT TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE mocha_user_id = auth.uid()::text AND role = 'admin'));

DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
CREATE POLICY "Users can insert their own orders" 
    ON public.orders FOR INSERT TO authenticated 
    WITH CHECK (user_id = (SELECT id FROM public.user_profiles WHERE mocha_user_id = auth.uid()::text));

DROP POLICY IF EXISTS "Admins can insert any order" ON public.orders;
CREATE POLICY "Admins can insert any order" 
    ON public.orders FOR INSERT TO authenticated 
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE mocha_user_id = auth.uid()::text AND role = 'admin'));

DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;
CREATE POLICY "Users can update their own orders" 
    ON public.orders FOR UPDATE TO authenticated 
    USING (user_id = (SELECT id FROM public.user_profiles WHERE mocha_user_id = auth.uid()::text));

DROP POLICY IF EXISTS "Admins can update any order" ON public.orders;
CREATE POLICY "Admins can update any order" 
    ON public.orders FOR UPDATE TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE mocha_user_id = auth.uid()::text AND role = 'admin'));

-- ============================================================================
-- 3. POLÍTICAS PARA A TABELA DE TALHÕES / ÁREAS (producer_areas)
-- ============================================================================
DROP POLICY IF EXISTS "Users can select their own areas" ON public.producer_areas;
CREATE POLICY "Users can select their own areas" 
    ON public.producer_areas FOR SELECT TO authenticated 
    USING (user_id = (SELECT id FROM public.user_profiles WHERE mocha_user_id = auth.uid()::text));

DROP POLICY IF EXISTS "Admins can select any areas" ON public.producer_areas;
CREATE POLICY "Admins can select any areas" 
    ON public.producer_areas FOR SELECT TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE mocha_user_id = auth.uid()::text AND role = 'admin'));

DROP POLICY IF EXISTS "Users can insert their own areas" ON public.producer_areas;
CREATE POLICY "Users can insert their own areas" 
    ON public.producer_areas FOR INSERT TO authenticated 
    WITH CHECK (user_id = (SELECT id FROM public.user_profiles WHERE mocha_user_id = auth.uid()::text));

DROP POLICY IF EXISTS "Admins can insert any areas" ON public.producer_areas;
CREATE POLICY "Admins can insert any areas" 
    ON public.producer_areas FOR INSERT TO authenticated 
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE mocha_user_id = auth.uid()::text AND role = 'admin'));

DROP POLICY IF EXISTS "Users can update their own areas" ON public.producer_areas;
CREATE POLICY "Users can update their own areas" 
    ON public.producer_areas FOR UPDATE TO authenticated 
    USING (user_id = (SELECT id FROM public.user_profiles WHERE mocha_user_id = auth.uid()::text));

DROP POLICY IF EXISTS "Admins can update any areas" ON public.producer_areas;
CREATE POLICY "Admins can update any areas" 
    ON public.producer_areas FOR UPDATE TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE mocha_user_id = auth.uid()::text AND role = 'admin'));

DROP POLICY IF EXISTS "Users can delete their own areas" ON public.producer_areas;
CREATE POLICY "Users can delete their own areas" 
    ON public.producer_areas FOR DELETE TO authenticated 
    USING (user_id = (SELECT id FROM public.user_profiles WHERE mocha_user_id = auth.uid()::text));

DROP POLICY IF EXISTS "Admins can delete any areas" ON public.producer_areas;
CREATE POLICY "Admins can delete any areas" 
    ON public.producer_areas FOR DELETE TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE mocha_user_id = auth.uid()::text AND role = 'admin'));

-- ============================================================================
-- 4. RESTRINGIR ACESSO AOS CONTEÚDOS DE CURSOS (LMS) APENAS A MEMBROS ATIVOS
-- ============================================================================
DROP POLICY IF EXISTS "Leitura pública livre" ON public.courses;
CREATE POLICY "Leitura restrita a membros ativos" 
    ON public.courses FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE mocha_user_id = auth.uid()::text AND (is_active = true OR role = 'admin')));

DROP POLICY IF EXISTS "Leitura pública livre" ON public.course_modules;
CREATE POLICY "Leitura restrita a membros ativos" 
    ON public.course_modules FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE mocha_user_id = auth.uid()::text AND (is_active = true OR role = 'admin')));

DROP POLICY IF EXISTS "Leitura pública livre" ON public.lessons;
CREATE POLICY "Leitura restrita a membros ativos" 
    ON public.lessons FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE mocha_user_id = auth.uid()::text AND (is_active = true OR role = 'admin')));

DROP POLICY IF EXISTS "Leitura pública livre" ON public.lesson_materials;
CREATE POLICY "Leitura restrita a membros ativos" 
    ON public.lesson_materials FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE mocha_user_id = auth.uid()::text AND (is_active = true OR role = 'admin')));

-- ============================================================================
-- 5. SEGURANÇA E INTEGRIDADE DE COMENTÁRIOS DE AULA (LMS)
-- ============================================================================
DROP POLICY IF EXISTS "Remoção pelo autor ou admin" ON public.lesson_comments;
CREATE POLICY "Remoção pelo autor ou admin" 
    ON public.lesson_comments FOR DELETE TO authenticated 
    USING (
        user_id = (SELECT id FROM public.user_profiles WHERE mocha_user_id = auth.uid()::text) 
        OR EXISTS (SELECT 1 FROM public.user_profiles WHERE mocha_user_id = auth.uid()::text AND role = 'admin')
    );

-- Recarregar cache do PostgREST
NOTIFY pgrst, 'reload schema';
