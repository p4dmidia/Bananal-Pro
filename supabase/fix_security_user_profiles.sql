-- ============================================================================
-- BANANAL PRO - CORREÇÃO DE SEGURANÇA E PRIVACIDADE DE USER_PROFILES
-- ============================================================================

-- 1. Atualizar a função do Trigger handle_new_user() para incluir o telefone (phone)
-- Isso evita a necessidade de uma chamada de API insegura no front-end durante o cadastro.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (mocha_user_id, email, full_name, role, phone, avatar_url)
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Usuário Novo'),
    'user',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (mocha_user_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone = COALESCE(EXCLUDED.phone, user_profiles.phone),
    avatar_url = COALESCE(EXCLUDED.avatar_url, user_profiles.avatar_url);
  RETURN NEW;
END;
$$;

-- 2. Correção de Privacidade: Revogar permissão SELECT de colunas sensíveis para o público
-- Para evitar vazamento de CPF, WhatsApp, Chaves PIX e Endereço de todos os usuários a qualquer pessoa autenticada:
-- Mantemos o SELECT USING (true) para compatibilidade com posts e comentários, mas limitamos as colunas visíveis.

-- Revoga a leitura completa de todos os usuários autenticados
REVOKE SELECT ON public.user_profiles FROM authenticated, anon;

-- Permite apenas colunas públicas e não-sensíveis para usuários autenticados
GRANT SELECT (id, mocha_user_id, full_name, avatar_url, role, city, state, created_at) 
ON public.user_profiles TO authenticated;

-- Permite acesso completo para a role postgres (administração) e service_role (backend do Supabase)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO postgres, service_role;

-- 3. Para permitir que o próprio usuário visualize seus dados sensíveis na página de perfil
-- Criamos uma VIEW de perfil pessoal segura
CREATE OR REPLACE VIEW public.my_profile AS
SELECT * 
FROM public.user_profiles
WHERE mocha_user_id = auth.uid()::text;

-- Concede permissões na VIEW para o próprio usuário autenticado
ALTER VIEW public.my_profile OWNER TO postgres;
GRANT SELECT, UPDATE ON public.my_profile TO authenticated;

-- Recarregar cache do PostgREST
NOTIFY pgrst, 'reload schema';
