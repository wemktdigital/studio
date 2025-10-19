-- Corrigir o trigger handle_new_user
-- Execute no Supabase Dashboard > SQL Editor

-- 1. Verificar se o trigger existe
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 2. Recriar o trigger corretamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Recriar a função handle_new_user com campos corretos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    username,
    display_name,
    avatar_url,
    status,
    user_level,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', null),
    'online',
    COALESCE(NEW.raw_user_meta_data->>'user_level', 'member'),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recriar o trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Verificar se foi criado
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 6. Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Trigger handle_new_user corrigido!';
  RAISE NOTICE '✅ Agora novos usuários serão criados automaticamente na tabela users';
END $$;
