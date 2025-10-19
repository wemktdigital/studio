-- Teste direto do trigger handle_new_user
-- Execute no Supabase Dashboard > SQL Editor

-- 1. Verificar se o trigger está ativo
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  event_object_schema,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 2. Testar a função handle_new_user diretamente
-- Vamos simular um INSERT em auth.users para ver se o trigger funciona
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
  test_email TEXT := 'teste.trigger@exemplo.com';
  test_metadata JSONB := '{
    "display_name": "Teste Trigger",
    "user_level": "member"
  }'::jsonb;
BEGIN
  RAISE NOTICE '🧪 Iniciando teste do trigger...';
  RAISE NOTICE 'ID de teste: %', test_user_id;
  
  -- Tentar inserir um usuário de teste em auth.users
  -- Isso deve disparar o trigger automaticamente
  BEGIN
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
      test_metadata,
      'authenticated',
      'authenticated'
    );
    
    RAISE NOTICE '✅ Usuário inserido em auth.users com sucesso!';
    
    -- Aguardar um pouco para o trigger processar
    PERFORM pg_sleep(2);
    
    -- Verificar se o usuário foi criado em public.users via trigger
    IF EXISTS (SELECT 1 FROM public.users WHERE id = test_user_id) THEN
      RAISE NOTICE '✅ TRIGGER FUNCIONOU! Usuário encontrado em public.users';
      
      -- Mostrar os dados criados
      SELECT 
        id,
        username,
        display_name,
        user_level,
        created_at
      FROM public.users 
      WHERE id = test_user_id;
      
    ELSE
      RAISE NOTICE '❌ TRIGGER FALHOU! Usuário NÃO encontrado em public.users';
    END IF;
    
    -- Limpar dados de teste
    DELETE FROM auth.users WHERE id = test_user_id;
    DELETE FROM public.users WHERE id = test_user_id;
    
    RAISE NOTICE '🧹 Dados de teste removidos';
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '❌ Erro durante o teste: %', SQLERRM;
      -- Tentar limpar mesmo em caso de erro
      DELETE FROM auth.users WHERE id = test_user_id;
      DELETE FROM public.users WHERE id = test_user_id;
  END;
END;
$$;

-- 3. Verificar se há algum problema na função
SELECT 
  proname as function_name,
  prosrc as function_body
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 4. Mensagem final
DO $$
BEGIN
  RAISE NOTICE '🎯 Teste do trigger concluído!';
  RAISE NOTICE '📊 Verifique os logs acima para ver se o trigger funcionou corretamente.';
END $$;
