-- Remover completamente o trigger problemático e recriar
-- Execute no Supabase Dashboard > SQL Editor

-- 1. Remover trigger de qualquer tabela
DROP TRIGGER IF EXISTS on_auth_user_created ON public.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Remover a função antiga
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Criar nova função com campos corretos
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

-- 4. Tentar criar trigger na tabela auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Se falhar, criar na tabela public.users (fallback)
DO $$
BEGIN
  -- Verificar se o trigger foi criado em auth.users
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created' 
    AND event_object_table = 'users'
    AND event_object_schema = 'auth'
  ) THEN
    -- Criar na tabela public.users como fallback
    CREATE TRIGGER on_auth_user_created_public
      AFTER INSERT ON public.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    
    RAISE NOTICE '⚠️ Trigger criado na tabela public.users (fallback)';
  ELSE
    RAISE NOTICE '✅ Trigger criado na tabela auth.users';
  END IF;
END $$;

-- 6. Verificar resultado final
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  event_object_schema,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%on_auth_user_created%'
ORDER BY event_object_schema, event_object_table;

-- 7. Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Processo de correção do trigger concluído!';
  RAISE NOTICE '✅ Verifique os resultados acima para confirmar a localização do trigger';
END $$;
