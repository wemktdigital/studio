-- Teste para verificar se o trigger handle_new_user está funcionando
-- Execute no Supabase Dashboard > SQL Editor

-- 1. Verificar se a função existe
SELECT 
  proname as function_name,
  prosrc as function_body
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 2. Verificar se o trigger existe
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 3. Verificar estrutura da tabela users
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Teste manual da função (simulação)
-- Isso vai mostrar se há algum problema na função
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
  test_display_name TEXT := 'Test User';
  test_handle TEXT := 'test_user';
  test_avatar_url TEXT := null;
  test_user_level TEXT := 'member';
BEGIN
  
  -- Tentar executar a lógica da função
  BEGIN
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
      test_user_id,
      test_display_name,
      test_handle,
      test_avatar_url,
      'online',
      test_user_level,
      NOW(),
      NOW()
    );
    
    RAISE NOTICE '✅ Função testada com sucesso!';
    
    -- Limpar o teste
    DELETE FROM public.users WHERE id = test_user_id;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Erro na função: %', SQLERRM;
  END;
END $$;

-- 5. Verificar políticas RLS
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
WHERE tablename = 'users';
