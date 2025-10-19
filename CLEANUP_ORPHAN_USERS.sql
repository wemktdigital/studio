-- Script para limpar usuários órfãos
-- Execute no Supabase Dashboard > SQL Editor

-- 1. Verificar usuários órfãos (existem em auth.users mas não em public.users)
SELECT 
    au.id,
    au.email,
    au.created_at as auth_created_at,
    au.email_confirmed_at,
    au.last_sign_in_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ORDER BY au.created_at DESC;

-- 2. Verificar quantos usuários órfãos existem
SELECT COUNT(*) as orphan_users_count
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- 3. Opcional: Deletar usuários órfãos (DESCOMENTE APENAS SE QUISER EXECUTAR)
-- ATENÇÃO: Esta operação é irreversível!
-- 
-- DELETE FROM auth.users 
-- WHERE id IN (
--     SELECT au.id
--     FROM auth.users au
--     LEFT JOIN public.users pu ON au.id = pu.id
--     WHERE pu.id IS NULL
-- );

-- 4. Verificar usuários que existem em public.users mas não em auth.users
SELECT 
    pu.id,
    pu.display_name,
    pu.email,
    pu.created_at as public_created_at
FROM public.users pu
LEFT JOIN auth.users au ON pu.id = au.id
WHERE au.id IS NULL
ORDER BY pu.created_at DESC;

-- 5. Mensagem de instrução
DO $$
BEGIN
  RAISE NOTICE '✅ Verificação de usuários órfãos concluída!';
  RAISE NOTICE '📊 Verifique os resultados acima para entender a situação dos usuários.';
  RAISE NOTICE '⚠️ Para deletar usuários órfãos, descomente e execute a query da seção 3.';
END $$;
