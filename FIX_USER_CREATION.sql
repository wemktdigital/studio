-- Script para corrigir o trigger de criação de usuário
-- Execute este script no SQL Editor do Supabase

-- 1. Corrigir a função handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_handle TEXT;
  handle_counter INTEGER := 1;
BEGIN
  -- Gerar handle único baseado no display_name ou email
  user_handle := COALESCE(
    NEW.raw_user_meta_data->>'handle',
    LOWER(REGEXP_REPLACE(
      COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1)),
      '[^a-zA-Z0-9_]', '_', 'g'
    ))
  );
  
  -- Garantir que o handle não esteja vazio
  IF user_handle = '' OR user_handle IS NULL THEN
    user_handle := 'user_' || substr(NEW.id::text, 1, 8);
  END IF;
  
  -- Verificar unicidade do handle e modificar se necessário
  WHILE EXISTS (SELECT 1 FROM public.users WHERE handle = user_handle) LOOP
    user_handle := user_handle || '_' || handle_counter;
    handle_counter := handle_counter + 1;
  END LOOP;
  
  -- Inserir usuário com tratamento de erro adequado
  INSERT INTO public.users (
    id,
    display_name,
    handle,
    avatar_url,
    status,
    user_level,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1)),
    user_handle,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', null),
    'online',
    COALESCE(NEW.raw_user_meta_data->>'user_level', 'member'),
    NOW(),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro mas não falhar na criação do usuário de auth
    RAISE WARNING 'Falha ao criar perfil do usuário para %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Garantir que as políticas RLS estejam corretas
DROP POLICY IF EXISTS "users_insert_policy" ON users;
CREATE POLICY "users_insert_policy" ON users
  FOR INSERT WITH CHECK (true);

-- 3. Verificar se o trigger está ativo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Mensagem de sucesso
SELECT '✅ Função handle_new_user corrigida com sucesso!' as status;
