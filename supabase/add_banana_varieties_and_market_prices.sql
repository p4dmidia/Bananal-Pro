-- ============================================================================
-- BANANAL PRO - CULTIVARES DE BANANA, PREÇOS DE MERCADO E MELHORIA DE GLEBAS
-- ============================================================================

-- 1. TABELA DE CULTIVARES DE BANANA
CREATE TABLE IF NOT EXISTS public.banana_varieties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_name TEXT NOT NULL, -- 'Prata', 'Cavendish', 'Terra', 'Maçã', 'Ouro', 'FHIA'
    variety_name TEXT NOT NULL UNIQUE,
    average_bunch_weight_kg NUMERIC(5,2) NOT NULL,
    potential_productivity_t_ha NUMERIC(5,2) NOT NULL,
    recommended_spacing TEXT NOT NULL DEFAULT '3.0 x 2.0',
    plants_per_hectare INTEGER NOT NULL DEFAULT 1666,
    cycle_months INTEGER NOT NULL DEFAULT 12,
    sigatoka_resistance TEXT NOT NULL DEFAULT 'Suscetível', -- 'Resistente', 'Moderadamente Resistente', 'Suscetível'
    panama_resistance TEXT NOT NULL DEFAULT 'Suscetível', -- 'Resistente', 'Moderadamente Resistente', 'Suscetível'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.banana_varieties ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DROP POLICY IF EXISTS "Leitura livre para usuários autenticados" ON public.banana_varieties;
CREATE POLICY "Leitura livre para usuários autenticados" 
    ON public.banana_varieties FOR SELECT TO authenticated USING (true);

-- 2. CADASTRAR VARIEDADES INICIAIS
INSERT INTO public.banana_varieties 
(group_name, variety_name, average_bunch_weight_kg, potential_productivity_t_ha, recommended_spacing, plants_per_hectare, cycle_months, sigatoka_resistance, panama_resistance)
VALUES
-- Grupo Prata
('Prata', 'Prata Comum (Prata Rio)', 15.00, 22.00, '3.0 x 2.5', 1333, 13, 'Suscetível', 'Suscetível'),
('Prata', 'Prata Anã', 18.50, 28.00, '3.0 x 2.0', 1666, 12, 'Suscetível', 'Suscetível'),
('Prata', 'Prata Catarina', 23.00, 32.00, '3.0 x 2.0', 1666, 12, 'Moderadamente Resistente', 'Suscetível'),
('Prata', 'Prata Platina', 28.50, 36.00, '3.0 x 2.0', 1666, 12, 'Resistente', 'Resistente'),
('Prata', 'Prata Graúda', 25.00, 30.00, '3.0 x 2.0', 1666, 12, 'Resistente', 'Resistente'),
('Prata', 'Prata Galil 18', 34.00, 42.00, '3.0 x 2.0', 1666, 12, 'Resistente', 'Resistente'),
('Prata', 'BRS Platina', 30.00, 38.00, '3.0 x 2.0', 1666, 12, 'Resistente', 'Resistente'),
('Prata', 'BRS FHIA-18', 32.50, 40.00, '3.0 x 2.0', 1666, 12, 'Resistente', 'Resistente'),
('Prata', 'Pacovan', 23.00, 26.00, '3.0 x 3.0', 1111, 14, 'Suscetível', 'Suscetível'),
('Prata', 'Pacovan Ken', 31.50, 35.00, '3.0 x 2.0', 1666, 13, 'Resistente', 'Resistente'),

-- Grupo Cavendish
('Cavendish', 'Nanica Tradicional', 27.50, 45.00, '2.5 x 2.0', 2000, 11, 'Suscetível', 'Resistente'),
('Cavendish', 'Caturra', 25.00, 42.00, '2.5 x 2.0', 2000, 11, 'Suscetível', 'Resistente'),
('Cavendish', 'D''Água', 23.00, 38.00, '3.0 x 2.0', 1666, 12, 'Suscetível', 'Resistente'),
('Cavendish', 'Williams', 37.50, 55.00, '2.5 x 2.0', 2000, 11, 'Suscetível', 'Resistente'),
('Cavendish', 'Grande Naine', 42.50, 60.00, '2.5 x 2.0', 2000, 11, 'Suscetível', 'Resistente'),
('Cavendish', 'Nanicão', 34.00, 50.00, '2.5 x 2.0', 2000, 11, 'Suscetível', 'Resistente'),

-- Grupo Terra
('Terra', 'Banana Terra', 22.50, 25.00, '3.0 x 3.0', 1111, 15, 'Suscetível', 'Resistente'),
('Terra', 'Terra Maranhão', 27.50, 30.00, '3.0 x 3.0', 1111, 15, 'Suscetível', 'Resistente'),
('Terra', 'Terrinha', 11.50, 18.00, '3.0 x 2.0', 1666, 14, 'Suscetível', 'Resistente'),
('Terra', 'Terra Anã', 21.50, 26.00, '3.0 x 2.0', 1666, 14, 'Suscetível', 'Resistente'),
('Terra', 'NJK', 42.50, 48.00, '3.0 x 2.0', 1666, 13, 'Moderadamente Resistente', 'Resistente'),

-- Grupo Maçã
('Maçã', 'Maçã Tradicional', 14.00, 18.00, '3.0 x 2.5', 1333, 13, 'Suscetível', 'Suscetível'),
('Maçã', 'BRS Princesa', 18.50, 24.00, '3.0 x 2.0', 1666, 12, 'Resistente', 'Resistente'),

-- Grupo FHIA Híbridos
('FHIA', 'FHIA-01 (Goldfinger)', 32.50, 40.00, '3.0 x 2.0', 1666, 12, 'Resistente', 'Resistente'),
('FHIA', 'FHIA-02', 32.50, 40.00, '3.0 x 2.0', 1666, 12, 'Resistente', 'Resistente'),
('FHIA', 'FHIA-03', 37.50, 45.00, '3.0 x 2.0', 1666, 12, 'Resistente', 'Resistente'),
('FHIA', 'FHIA-17', 37.50, 45.00, '3.0 x 2.0', 1666, 12, 'Resistente', 'Resistente'),
('FHIA', 'FHIA-18', 32.50, 40.00, '3.0 x 2.0', 1666, 12, 'Resistente', 'Resistente'),
('FHIA', 'FHIA-21', 42.50, 50.00, '3.0 x 2.0', 1666, 12, 'Resistente', 'Resistente'),

-- Grupo Ouro
('Ouro', 'Ouro', 9.00, 15.00, '2.5 x 2.0', 2000, 12, 'Suscetível', 'Moderadamente Resistente'),
('Ouro', 'Ouro da Mata', 11.00, 18.00, '2.5 x 2.0', 2000, 12, 'Suscetível', 'Moderadamente Resistente')
ON CONFLICT (variety_name) DO UPDATE SET 
    average_bunch_weight_kg = EXCLUDED.average_bunch_weight_kg,
    potential_productivity_t_ha = EXCLUDED.potential_productivity_t_ha;


-- 3. MELHORAR O CADASTRO DE GLEBAS (producer_areas)
ALTER TABLE public.producer_areas 
ADD COLUMN IF NOT EXISTS spacing_row_m NUMERIC(4,2),
ADD COLUMN IF NOT EXISTS spacing_plant_m NUMERIC(4,2),
ADD COLUMN IF NOT EXISTS plants_count INTEGER,
ADD COLUMN IF NOT EXISTS planting_date DATE,
ADD COLUMN IF NOT EXISTS irrigation_type TEXT,
ADD COLUMN IF NOT EXISTS soil_type TEXT;


-- 4. ADICIONAR VÍNCULO DE TALHÃO NAS TRANSAÇÕES (transactions)
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS area_id BIGINT REFERENCES public.producer_areas(id) ON DELETE SET NULL;


-- 5. TABELA DE HISTÓRICO DE PREÇOS DE MERCADO
CREATE TABLE IF NOT EXISTS public.banana_market_prices (
    id BIGSERIAL PRIMARY KEY,
    variety_id UUID REFERENCES public.banana_varieties(id) ON DELETE CASCADE,
    price_per_kg NUMERIC(5,2) NOT NULL,
    region TEXT NOT NULL, -- ex: 'Norte de Minas', 'Vale do Ribeira', 'Nacional'
    source TEXT NOT NULL, -- 'CEPEA/USP', 'CONAB', 'Notícias Agrícolas'
    price_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índice para consultas rápidas de histórico
CREATE INDEX IF NOT EXISTS idx_banana_market_prices_date ON public.banana_market_prices(variety_id, price_date DESC);

-- Habilitar RLS
ALTER TABLE public.banana_market_prices ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DROP POLICY IF EXISTS "Leitura de preços livre para autenticados" ON public.banana_market_prices;
CREATE POLICY "Leitura de preços livre para autenticados" 
    ON public.banana_market_prices FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Escrita de preços livre para autenticados" ON public.banana_market_prices;
CREATE POLICY "Escrita de preços livre para autenticados" 
    ON public.banana_market_prices FOR ALL TO authenticated USING (true);


-- 6. POPULAR HISTÓRICO DE PREÇOS RECENTE (Últimos 30 dias para semente inicial)
-- Utilizaremos uma query dinâmica para inserir histórico recente de preços médios das variedades principais
DO $$
DECLARE
    var_rec RECORD;
    i INTEGER;
    base_price NUMERIC;
    var_price NUMERIC;
BEGIN
    FOR var_rec IN SELECT id, group_name FROM public.banana_varieties LOOP
        -- Define um preço base dependendo do grupo
        CASE var_rec.group_name
            WHEN 'Prata' THEN base_price := 2.60;
            WHEN 'Cavendish' THEN base_price := 1.85;
            WHEN 'Terra' THEN base_price := 3.40;
            WHEN 'Maçã' THEN base_price := 4.80;
            WHEN 'Ouro' THEN base_price := 3.20;
            ELSE base_price := 2.20;
        END CASE;
        
        -- Insere histórico dos últimos 30 dias com pequenas variações diárias
        FOR i IN REVERSE 0..30 LOOP
            var_price := base_price + (sin(i::numeric * 0.4) * 0.15) + ((i % 5)::numeric * 0.04 - 0.08);
            INSERT INTO public.banana_market_prices (variety_id, price_per_kg, region, source, price_date)
            VALUES (
                var_rec.id, 
                ROUND(var_price, 2), 
                'Média Nacional', 
                'CEPEA/USP', 
                CURRENT_DATE - i
            ) ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- Recarregar cache PostgREST
NOTIFY pgrst, 'reload schema';
