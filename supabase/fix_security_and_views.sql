-- ============================================================================
-- BANANAL PRO - AJUSTES DE SEGURANÇA, PRIVACIDADE E VIEWS DE PERFIS
-- ============================================================================

-- 1. Permite acesso de SELECT para colunas básicas e de controle/validação aos usuários autenticados
-- Isso é fundamental para que o frontend consiga validar o e-mail logado e o status da assinatura (is_active)
GRANT SELECT (id, mocha_user_id, email, full_name, avatar_url, role, city, state, is_active, created_at) 
ON public.user_profiles TO authenticated;

-- 2. Criação da View de Perfil Pessoal Seguro (my_profile)
-- A View roda com os privilégios do criador (owner = postgres), permitindo ler colunas privadas (phone, cpf, pix_key) do próprio usuário logado
CREATE OR REPLACE VIEW public.my_profile AS
SELECT * 
FROM public.user_profiles
WHERE mocha_user_id = auth.uid()::text;

ALTER VIEW public.my_profile OWNER TO postgres;
GRANT SELECT, UPDATE ON public.my_profile TO authenticated;

-- 3. Criação da View de Perfis para Administração (admin_user_profiles)
-- A View roda com privilégios de administrador para permitir que roles de gestão (admin, partner, pj) leiam dados de todos os usuários
CREATE OR REPLACE VIEW public.admin_user_profiles AS
SELECT * 
FROM public.user_profiles
WHERE EXISTS (
  SELECT 1 FROM public.user_profiles
  WHERE mocha_user_id = auth.uid()::text AND role IN ('admin', 'partner', 'pj')
);

ALTER VIEW public.admin_user_profiles OWNER TO postgres;
GRANT SELECT ON public.admin_user_profiles TO authenticated;

-- 4. Notificar o PostgREST para recarregar o schema do banco de dados
NOTIFY pgrst, 'reload schema';
