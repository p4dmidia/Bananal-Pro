-- ========================================================
-- 1. TABELA: soil_analyses (Análises de Solo)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.soil_analyses (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    ph NUMERIC(3,1) NOT NULL,
    p NUMERIC(5,1) NOT NULL,
    k NUMERIC(5,2) NOT NULL,
    ca NUMERIC(4,1) NOT NULL,
    mg NUMERIC(4,1) NOT NULL,
    h_al NUMERIC(4,1) NOT NULL,
    v_percent NUMERIC(4,1) NOT NULL,
    liming_need NUMERIC(5,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.soil_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select their own soil_analyses" ON public.soil_analyses;
CREATE POLICY "Users can select their own soil_analyses" ON public.soil_analyses
    FOR SELECT TO authenticated USING (user_id = (SELECT id FROM public.user_profiles WHERE mocha_user_id = auth.uid()::text));

DROP POLICY IF EXISTS "Users can insert their own soil_analyses" ON public.soil_analyses;
CREATE POLICY "Users can insert their own soil_analyses" ON public.soil_analyses
    FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT id FROM public.user_profiles WHERE mocha_user_id = auth.uid()::text));

DROP POLICY IF EXISTS "Users can update their own soil_analyses" ON public.soil_analyses;
CREATE POLICY "Users can update their own soil_analyses" ON public.soil_analyses
    FOR UPDATE TO authenticated USING (user_id = (SELECT id FROM public.user_profiles WHERE mocha_user_id = auth.uid()::text));

DROP POLICY IF EXISTS "Users can delete their own soil_analyses" ON public.soil_analyses;
CREATE POLICY "Users can delete their own soil_analyses" ON public.soil_analyses
    FOR DELETE TO authenticated USING (user_id = (SELECT id FROM public.user_profiles WHERE mocha_user_id = auth.uid()::text));

-- ========================================================
-- 2. TABELA: farm_inventory (Estoque de Insumos)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.farm_inventory (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity NUMERIC(10,2) NOT NULL DEFAULT 0,
    unit TEXT NOT NULL,
    min_quantity NUMERIC(10,2) NOT NULL DEFAULT 0,
    expiry_date DATE,
    supplier TEXT NOT NULL DEFAULT 'Não informado',
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.farm_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select their own farm_inventory" ON public.farm_inventory;
CREATE POLICY "Users can select their own farm_inventory" ON public.farm_inventory
    FOR SELECT TO authenticated USING (user_id = (SELECT id FROM public.user_profiles WHERE mocha_user_id = auth.uid()::text));

DROP POLICY IF EXISTS "Users can insert their own farm_inventory" ON public.farm_inventory;
CREATE POLICY "Users can insert their own farm_inventory" ON public.farm_inventory
    FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT id FROM public.user_profiles WHERE mocha_user_id = auth.uid()::text));

DROP POLICY IF EXISTS "Users can update their own farm_inventory" ON public.farm_inventory;
CREATE POLICY "Users can update their own farm_inventory" ON public.farm_inventory
    FOR UPDATE TO authenticated USING (user_id = (SELECT id FROM public.user_profiles WHERE mocha_user_id = auth.uid()::text));

DROP POLICY IF EXISTS "Users can delete their own farm_inventory" ON public.farm_inventory;
CREATE POLICY "Users can delete their own farm_inventory" ON public.farm_inventory
    FOR DELETE TO authenticated USING (user_id = (SELECT id FROM public.user_profiles WHERE mocha_user_id = auth.uid()::text));

-- ========================================================
-- 3. TABELA: farm_tasks (Calendário Agrícola)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.farm_tasks (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pendente',
    description TEXT NOT NULL DEFAULT 'Sem observações.',
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.farm_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select their own farm_tasks" ON public.farm_tasks;
CREATE POLICY "Users can select their own farm_tasks" ON public.farm_tasks
    FOR SELECT TO authenticated USING (user_id = (SELECT id FROM public.user_profiles WHERE mocha_user_id = auth.uid()::text));

DROP POLICY IF EXISTS "Users can insert their own farm_tasks" ON public.farm_tasks;
CREATE POLICY "Users can insert their own farm_tasks" ON public.farm_tasks
    FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT id FROM public.user_profiles WHERE mocha_user_id = auth.uid()::text));

DROP POLICY IF EXISTS "Users can update their own farm_tasks" ON public.farm_tasks;
CREATE POLICY "Users can update their own farm_tasks" ON public.farm_tasks
    FOR UPDATE TO authenticated USING (user_id = (SELECT id FROM public.user_profiles WHERE mocha_user_id = auth.uid()::text));

DROP POLICY IF EXISTS "Users can delete their own farm_tasks" ON public.farm_tasks;
CREATE POLICY "Users can delete their own farm_tasks" ON public.farm_tasks
    FOR DELETE TO authenticated USING (user_id = (SELECT id FROM public.user_profiles WHERE mocha_user_id = auth.uid()::text));

-- ========================================================
-- 4. TABELA: visual_diagnostics (Diagnóstico Visual IA)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.visual_diagnostics (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    disease_name TEXT NOT NULL,
    scientific_name TEXT NOT NULL,
    severity TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.visual_diagnostics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select their own visual_diagnostics" ON public.visual_diagnostics;
CREATE POLICY "Users can select their own visual_diagnostics" ON public.visual_diagnostics
    FOR SELECT TO authenticated USING (user_id = (SELECT id FROM public.user_profiles WHERE mocha_user_id = auth.uid()::text));

DROP POLICY IF EXISTS "Users can insert their own visual_diagnostics" ON public.visual_diagnostics;
CREATE POLICY "Users can insert their own visual_diagnostics" ON public.visual_diagnostics
    FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT id FROM public.user_profiles WHERE mocha_user_id = auth.uid()::text));

DROP POLICY IF EXISTS "Users can update their own visual_diagnostics" ON public.visual_diagnostics;
CREATE POLICY "Users can update their own visual_diagnostics" ON public.visual_diagnostics
    FOR UPDATE TO authenticated USING (user_id = (SELECT id FROM public.user_profiles WHERE mocha_user_id = auth.uid()::text));

DROP POLICY IF EXISTS "Users can delete their own visual_diagnostics" ON public.visual_diagnostics;
CREATE POLICY "Users can delete their own visual_diagnostics" ON public.visual_diagnostics
    FOR DELETE TO authenticated USING (user_id = (SELECT id FROM public.user_profiles WHERE mocha_user_id = auth.uid()::text));

-- 5. Atualizar PostgREST cache
NOTIFY pgrst, 'reload schema';
