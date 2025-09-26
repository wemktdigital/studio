# 🗄️ Configuração Manual do Supabase

## **📋 Resumo**

Para que o sistema funcione completamente, você precisa executar algumas configurações manuais no Supabase. Aqui está o que precisa ser feito:

---

## **🔧 1. Executar Migrações SQL**

### **Migrações Obrigatórias:**
Execute estas migrações na ordem correta no Supabase SQL Editor:

1. **Schema Principal:**
   ```sql
   -- Execute o arquivo: supabase-schema.sql
   ```

2. **Migrações Adicionais:**
   ```sql
   -- Execute: supabase/migrations/20250123000000_add_mentions_system.sql
   -- Execute: supabase/migrations/20250124000000_add_is_active_to_workspaces.sql
   -- Execute: supabase/migrations/20250830020347_fix-user-signup-issues.sql
   ```

3. **Sistema de Retenção (Opcional):**
   ```sql
   -- Execute: supabase/migrations/20250125000000_create_archived_messages_table.sql
   -- Execute: supabase/migrations/20250125000003_insert_sample_archived_messages_simple.sql
   ```

---

## **➕ 2. Adicionar Coluna `user_level`**

A tabela `users` precisa da coluna `user_level` para o sistema de níveis funcionar:

```sql
-- Adicionar coluna user_level à tabela users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS user_level TEXT DEFAULT 'member' 
CHECK (user_level IN ('super_admin', 'admin', 'manager', 'member', 'guest', 'banned'));

-- Atualizar usuários existentes
UPDATE users 
SET user_level = 'member' 
WHERE user_level IS NULL;
```

---

## **👤 3. Configurar Usuário Admin**

Para que você tenha acesso administrativo, execute:

```sql
-- Substitua 'SEU_EMAIL_AQUI' pelo seu email de login
UPDATE users 
SET user_level = 'super_admin' 
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'SEU_EMAIL_AQUI'
);
```

---

## **🌱 4. Dados de Seed (Opcional)**

Para ter dados de teste, execute:

```sql
-- Execute o arquivo: supabase-seed-data.sql
```

**⚠️ Nota:** Os dados de seed são opcionais e apenas para teste. Em produção, você pode pular esta etapa.

---

## **🔐 5. Verificar Políticas RLS**

Certifique-se de que estas políticas estão ativas:

```sql
-- Verificar se RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;

-- Se alguma tabela não tiver RLS habilitado, execute:
-- ALTER TABLE nome_da_tabela ENABLE ROW LEVEL SECURITY;
```

---

## **📊 6. Verificar Estrutura das Tabelas**

Execute esta query para verificar se todas as tabelas foram criadas:

```sql
-- Verificar tabelas criadas
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Tabelas esperadas:**
- `workspaces`
- `users`
- `workspace_members`
- `channels`
- `channel_members`
- `messages`
- `message_reactions`
- `direct_messages`
- `threads`
- `thread_messages`
- `message_read_status`
- `message_mentions`
- `archived_messages` (se executou a migração de retenção)

---

## **🔍 7. Testar Conexão**

Para testar se tudo está funcionando:

```sql
-- Teste básico de conexão
SELECT 
  'workspaces' as tabela, 
  COUNT(*) as registros 
FROM workspaces
UNION ALL
SELECT 
  'users' as tabela, 
  COUNT(*) as registros 
FROM users
UNION ALL
SELECT 
  'workspace_members' as tabela, 
  COUNT(*) as registros 
FROM workspace_members;
```

---

## **⚠️ Problemas Comuns**

### **Erro: "column user_level does not exist"**
```sql
-- Solução: Execute a query da seção 2
ALTER TABLE users ADD COLUMN user_level TEXT DEFAULT 'member';
```

### **Erro: "permission denied for table users"**
```sql
-- Solução: Verificar políticas RLS
SELECT * FROM pg_policies WHERE tablename = 'users';
```

### **Erro: "function update_updated_at_column() does not exist"**
```sql
-- Solução: Criar a função
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## **✅ Checklist Final**

- [ ] Schema principal executado (`supabase-schema.sql`)
- [ ] Migrações executadas (mentions, is_active, user-signup)
- [ ] Coluna `user_level` adicionada
- [ ] Usuário admin configurado
- [ ] Dados de seed executados (opcional)
- [ ] Políticas RLS verificadas
- [ ] Estrutura das tabelas confirmada
- [ ] Teste de conexão realizado

---

## **🎯 Resultado Esperado**

Após executar todas as configurações:

1. **Sistema funcionando** sem erros de banco
2. **Usuários reais** aparecendo no "Gerenciar Níveis"
3. **Workspaces** sendo criados corretamente
4. **Canais padrão** (#general, #random) sendo criados
5. **Mensagens** sendo enviadas e exibidas
6. **Sistema de níveis** funcionando completamente

**Tudo pronto para uso em produção!** 🚀
