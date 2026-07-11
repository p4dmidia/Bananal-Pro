-- Adiciona a coluna thumbnail_url na tabela lives, caso ela ainda não exista
ALTER TABLE public.lives ADD COLUMN IF NOT EXISTS thumbnail_url text;
