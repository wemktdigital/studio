-- Solução Final para Criação de Usuários
-- Execute no Supabase Dashboard > SQL Editor

-- 1. Primeiro, vamos verificar o estado atual do trigger
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  event_object_schema,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 2. Verificar se a função existe e está correta
SELECT 
  proname as function_name,
  prosrc as function_body
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 3. Remover trigger existente e recriar corretamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON public.users;

-- 4. Recriar a função handle_new_user com logs para debug
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Log para debug
  RAISE LOG 'handle_new_user triggered for user ID: %', NEW.id;
  
  -- Inserir na tabela public.users
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
  
  RAISE LOG 'User successfully inserted into public.users: %', NEW.id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    -- Não falhar o trigger, apenas logar o erro
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Recriar o trigger na tabela auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Verificar se o trigger foi criado corretamente
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  event_object_schema,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 7. Testar o trigger com um usuário fictício
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
  test_email TEXT := 'teste.final@exemplo.com';
BEGIN
  RAISE NOTICE '🧪 Testando trigger com ID: %', test_user_id;
  
  -- Simular inserção em auth.users (isso deve disparar o trigger)
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data,
    aud,
    role
  ) VALUES (
    test_user_id,
    test_email,
    crypt('senha123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"display_name": "Teste Final", "user_level": "member"}'::jsonb,
    'authenticated',
    'authenticated'
  );
  
  -- Verificar se o usuário foi criado em public.users
  IF EXISTS (SELECT 1 FROM public.users WHERE id = test_user_id) THEN
    RAISE NOTICE '✅ TRIGGER FUNCIONOU! Usuário criado em public.users';
  ELSE
    RAISE NOTICE '❌ TRIGGER FALHOU! Usuário NÃO criado em public.users';
  END IF;
  
  -- Limpar dados de teste
  DELETE FROM public.users WHERE id = test_user_id;
  DELETE FROM auth.users WHERE id = test_user_id;
  
  RAISE NOTICE '🧹 Dados de teste removidos';
END;
$$;

-- 8. Verificar políticas RLS que podem estar bloqueando
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public'
ORDER BY cmd;

-- 9. Mensagem final
DO $$
BEGIN
  RAISE NOTICE '🎯 Configuração do trigger concluída!';
  RAISE NOTICE '📊 Verifique os logs acima para confirmar se o trigger está funcionando.';
  RAISE NOTICE '🚀 Agora tente criar um usuário pelo painel admin.';
END $$;
