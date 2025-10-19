-- FIX_RLS_WORKSPACE_INVITES.sql
-- Corrigir políticas RLS da tabela workspace_invites para permitir convites externos

-- 1. Remover política de INSERT existente
DROP POLICY IF EXISTS "Users can create invites for their workspaces" ON workspace_invites;

-- 2. Criar nova política de INSERT que permite:
--    - Usuários membros do workspace (owner/admin) podem criar convites
--    - Usuários externos (não membros) podem criar convites
CREATE POLICY "Allow workspace invites from members and external users" ON workspace_invites
  FOR INSERT WITH CHECK (
    -- Permitir se o usuário é membro do workspace com role adequado
    (
      EXISTS (
        SELECT 1 FROM workspace_members 
        WHERE workspace_members.workspace_id = workspace_invites.workspace_id 
        AND workspace_members.user_id = auth.uid()
        AND workspace_members.role IN ('owner', 'admin')
      )
    )
    OR
    -- Permitir se o usuário NÃO é membro (usuário externo)
    (
      NOT EXISTS (
        SELECT 1 FROM workspace_members 
        WHERE workspace_members.workspace_id = workspace_invites.workspace_id 
        AND workspace_members.user_id = auth.uid()
      )
    )
    AND inviter_id = auth.uid()
  );

-- 3. Verificar se a política foi criada corretamente
SELECT 
  policyname,
  cmd,
  with_check
FROM pg_policies 
WHERE tablename = 'workspace_invites' 
AND schemaname = 'public'
AND cmd = 'INSERT';

-- 4. Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Política RLS corrigida para workspace_invites!';
  RAISE NOTICE '✅ Agora usuários externos podem criar convites para workspaces.';
  RAISE NOTICE '✅ Usuários membros (owner/admin) também podem criar convites.';
END $$;
