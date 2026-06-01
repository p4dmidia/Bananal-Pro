-- Script de Correção das Políticas de RLS para Edição (UPDATE) na tabela de Transações (transactions)

-- 1. Garante que a política antiga de UPDATE seja removida para evitar conflitos
DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;

-- 2. Cria a nova política de UPDATE associando o user_id do lançamento ao id correspondente no user_profiles
CREATE POLICY "Users can update their own transactions" ON public.transactions
    FOR UPDATE TO authenticated
    USING (
        user_id = (SELECT id FROM public.user_profiles WHERE mocha_user_id = auth.uid()::text)
    )
    WITH CHECK (
        user_id = (SELECT id FROM public.user_profiles WHERE mocha_user_id = auth.uid()::text)
    );

-- 3. Notifica o PostgREST para recarregar o schema
NOTIFY pgrst, 'reload schema';
