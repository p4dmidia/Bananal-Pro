-- ========================================================
-- TABELA: production_cycles (Ciclos de Produção / Safras)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.production_cycles (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    plants_count INTEGER NOT NULL DEFAULT 0,
    banana_variety TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status TEXT NOT NULL DEFAULT 'Ativo', -- 'Ativo' or 'Encerrado'
    boxes_harvested INTEGER,
    price_per_box NUMERIC(10,2),
    expenses JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array de [{id: string, description: string, amount: number, date: string}]
    notes TEXT, -- Relato sobre plantio, irrigação, tombamentos e perdas
    ai_diagnosis TEXT, -- Relatório detalhado gerado pela IA
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.production_cycles ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DROP POLICY IF EXISTS "Users can select their own production_cycles" ON public.production_cycles;
CREATE POLICY "Users can select their own production_cycles" ON public.production_cycles
    FOR SELECT TO authenticated USING (user_id = (SELECT id FROM public.user_profiles WHERE mocha_user_id = auth.uid()::text));

DROP POLICY IF EXISTS "Users can insert their own production_cycles" ON public.production_cycles;
CREATE POLICY "Users can insert their own production_cycles" ON public.production_cycles
    FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT id FROM public.user_profiles WHERE mocha_user_id = auth.uid()::text));

DROP POLICY IF EXISTS "Users can update their own production_cycles" ON public.production_cycles;
CREATE POLICY "Users can update their own production_cycles" ON public.production_cycles
    FOR UPDATE TO authenticated USING (user_id = (SELECT id FROM public.user_profiles WHERE mocha_user_id = auth.uid()::text));

DROP POLICY IF EXISTS "Users can delete their own production_cycles" ON public.production_cycles;
CREATE POLICY "Users can delete their own production_cycles" ON public.production_cycles
    FOR DELETE TO authenticated USING (user_id = (SELECT id FROM public.user_profiles WHERE mocha_user_id = auth.uid()::text));

-- Atualizar cache do PostgREST
NOTIFY pgrst, 'reload schema';
