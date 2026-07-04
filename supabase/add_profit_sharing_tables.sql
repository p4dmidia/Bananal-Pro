-- ============================================================================
-- BANANAL PRO - SISTEMA DE DIVISÃO DE LUCROS E RATEIO (SÓCIOS E PJS)
-- ============================================================================

-- 1. Tabela de configuração das regras de rateio
CREATE TABLE IF NOT EXISTS public.profit_sharing_config (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES public.user_profiles(id) ON DELETE CASCADE UNIQUE,
    role_type TEXT CHECK (role_type IN ('partner', 'pj')),
    share_percentage NUMERIC(5, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de lançamentos de comissão/lucro líquido por venda
CREATE TABLE IF NOT EXISTS public.partner_earnings (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Habilita o Row Level Security (RLS)
ALTER TABLE public.profit_sharing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_earnings ENABLE ROW LEVEL SECURITY;

-- 4. Limpeza de políticas antigas se existirem
DROP POLICY IF EXISTS "Admins can manage profit_sharing_config" ON public.profit_sharing_config;
DROP POLICY IF EXISTS "Authenticated users can select profit_sharing_config" ON public.profit_sharing_config;
DROP POLICY IF EXISTS "Admins and partners can read partner_earnings" ON public.partner_earnings;
DROP POLICY IF EXISTS "PJs can read their own partner_earnings" ON public.partner_earnings;

-- 5. Criação de novas políticas de acesso para a configuração de rateio
CREATE POLICY "Admins can manage profit_sharing_config" ON public.profit_sharing_config
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE mocha_user_id = auth.uid()::text AND role = 'admin'
        )
    );

CREATE POLICY "Authenticated users can select profit_sharing_config" ON public.profit_sharing_config
    FOR SELECT TO authenticated USING (true);

-- 6. Criação de novas políticas de acesso para os lançamentos de comissões
CREATE POLICY "Admins and partners can read partner_earnings" ON public.partner_earnings
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE mocha_user_id = auth.uid()::text AND role IN ('admin', 'partner')
        )
    );

CREATE POLICY "PJs can read their own partner_earnings" ON public.partner_earnings
    FOR SELECT TO authenticated USING (
        user_id = (
            SELECT id FROM public.user_profiles 
            WHERE mocha_user_id = auth.uid()::text
        )
    );

-- 7. Recarrega as configurações de schema do PostgREST
NOTIFY pgrst, 'reload schema';
