-- Script para verificar e corrigir o trigger handle_new_user
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se o trigger existe e está ativo
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 2. Verificar se a função existe
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user' 
AND routine_schema = 'public';

-- 3. Testar a função manualmente (substitua o UUID por um real)
-- SELECT public.handle_new_user();

-- 4. Recriar o trigger com configurações mais robustas
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 5. Verificar se há conflitos de políticas RLS
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

-- 6. Recriar o trigger com configurações explícitas
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- 7. Verificar se o trigger foi criado
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 8. Teste manual da função (descomente e substitua o UUID)
-- INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
-- VALUES (
--   gen_random_uuid(),
--   'teste-trigger@exemplo.com',
--   crypt('123456', gen_salt('bf')),
--   NOW(),
--   NOW(),
--   NOW(),
--   '{"display_name": "Teste Trigger", "user_level": "member"}'::jsonb
-- );

-- 9. Verificar se o usuário foi criado na tabela users
-- SELECT * FROM public.users WHERE display_name = 'Teste Trigger';

-- 10. Limpar teste (descomente se necessário)
-- DELETE FROM auth.users WHERE email = 'teste-trigger@exemplo.com';

SELECT '✅ Script de verificação executado! Verifique os resultados acima.' as status;
