-- ============================================================================
-- BANANAL PRO - ATUALIZAÇÃO DE SEGURANÇA E POLÍTICAS DE SELECT PARA ORDERS
-- ============================================================================

-- 1. Remove a política antiga que permitia apenas administradores verem todos os pedidos
DROP POLICY IF EXISTS "Admins can select all orders" ON public.orders;

-- 2. Cria a nova política que permite que Administradores, Sócios e PJs vejam todos os pedidos
-- Isso permite o funcionamento correto do painel financeiro para essas funções
CREATE POLICY "Admins, Partners and PJs can select all orders" 
    ON public.orders FOR SELECT TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE mocha_user_id = auth.uid()::text 
            AND role IN ('admin', 'partner', 'pj')
        )
    );

-- 3. Recarrega as configurações de schema do PostgREST
NOTIFY pgrst, 'reload schema';
