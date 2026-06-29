-- ============================================================================
-- BANANAL PRO - ADICIONAR STATUS DE ACESSO TRANCADO/EM BREVE AOS MÓDULOS E AULAS
-- ============================================================================

-- 1. Adicionar coluna is_locked na tabela de módulos (course_modules)
ALTER TABLE public.course_modules ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false;

-- 2. Adicionar coluna is_locked na tabela de aulas (lessons)
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false;
