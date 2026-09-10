-- Migration: Adiciona suporte ao período de testes gratuitos (7 dias) na tabela de perfis de usuários
-- Execute este script no SQL Editor do Supabase (projeto dgaovzdkszfqjutldddq)

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

COMMENT ON COLUMN public.user_profiles.trial_ends_at IS 'Data e hora limite do período de teste gratuito de 7 dias antes da primeira cobrança recorrente';
