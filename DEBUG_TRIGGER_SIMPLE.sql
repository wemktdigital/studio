-- Debug simples do trigger handle_new_user
-- Execute no Supabase Dashboard > SQL Editor

-- 1. Verificar se o trigger existe
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  event_object_schema,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 2. Verificar se a função existe
SELECT 
  proname as function_name,
  prosrc as function_body
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 3. Verificar logs recentes (se houver)
-- Isso pode não funcionar dependendo da configuração do Supabase
-- SELECT * FROM pg_stat_statements WHERE query LIKE '%handle_new_user%' LIMIT 5;

-- 4. Teste manual SIMPLES do trigger
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
  test_email TEXT := 'debug.trigger@test.com';
BEGIN
  RAISE NOTICE '🧪 Testando trigger com usuário: %', test_email;
  
  -- Inserir diretamente em auth.users (deve disparar o trigger)
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
    '$2a$10$dummy.encrypted.password.hash.for.testing.purposes.only',
    NOW(),
    NOW(),
    NOW(),
    '{"display_name": "Debug User", "user_level": "member"}'::jsonb,
    'authenticated',
    'authenticated'
  );
  
  RAISE NOTICE '✅ Usuário inserido em auth.users';
  
  -- Aguardar um momento
  PERFORM pg_sleep(1);
  
  -- Verificar se foi criado em public.users
  IF EXISTS (SELECT 1 FROM public.users WHERE id = test_user_id) THEN
    RAISE NOTICE '✅ SUCESSO! Trigger funcionou - usuário encontrado em public.users';
    
    -- Mostrar dados criados
    PERFORM (
      SELECT RAISE(NOTICE, 'Dados: ID=%, username=%, display_name=%, user_level=%', 
        id, username, display_name, user_level)
      FROM public.users 
      WHERE id = test_user_id
    );
  ELSE
    RAISE NOTICE '❌ FALHA! Trigger não funcionou - usuário NÃO encontrado em public.users';
  END IF;
  
  -- Limpar dados de teste
  DELETE FROM public.users WHERE id = test_user_id;
  DELETE FROM auth.users WHERE id = test_user_id;
  
  RAISE NOTICE '🧹 Dados de teste removidos';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Erro durante teste: %', SQLERRM;
    -- Tentar limpar mesmo com erro
    DELETE FROM public.users WHERE id = test_user_id;
    DELETE FROM auth.users WHERE id = test_user_id;
END;
$$;

-- 5. Verificar estrutura da tabela auth.users (pode não funcionar por permissões)
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'users' AND table_schema = 'auth' LIMIT 10;

-- 6. Mensagem final
DO $$
BEGIN
  RAISE NOTICE '🎯 Debug do trigger concluído!';
  RAISE NOTICE '📊 Se o trigger funcionou, você verá "SUCESSO!" acima.';
  RAISE NOTICE '📊 Se não funcionou, você verá "FALHA!" e precisa recriar o trigger.';
END $$;
