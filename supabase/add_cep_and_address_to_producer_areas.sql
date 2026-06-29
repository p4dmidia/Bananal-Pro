-- ============================================================================
-- BANANAL PRO - ADICIONAR CEP E ENDEREÇO NAS ÁREAS DO PRODUTOR
-- ============================================================================
-- Execute este script no SQL Editor do seu painel do Supabase.
-- ----------------------------------------------------------------------------

-- 1. Adicionar coluna cep (texto) na tabela producer_areas se não existir
ALTER TABLE public.producer_areas ADD COLUMN IF NOT EXISTS cep TEXT;

-- 2. Adicionar coluna address (texto) na tabela producer_areas se não existir
ALTER TABLE public.producer_areas ADD COLUMN IF NOT EXISTS address TEXT;
