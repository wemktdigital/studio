# 🗄️ **Migração para Dados Reais - Interface de Auditoria**

## 📋 **Resumo**

Para migrar da interface de auditoria com dados simulados para dados reais do Supabase, execute as migrações SQL abaixo.

## 🚀 **Passo a Passo**

### **1. Acessar Supabase Dashboard**
- Acesse: https://supabase.com/dashboard
- Selecione seu projeto
- Vá em **"SQL Editor"** no menu lateral

### **2. Executar Migração Principal**
Cole e execute o conteúdo do arquivo:
```
supabase/migrations/20250125000000_create_archived_messages_table.sql
```

**O que esta migração faz:**
- ✅ Cria tabela `archived_messages`
- ✅ Adiciona índices para performance
- ✅ Habilita RLS (Row Level Security)
- ✅ Cria políticas de segurança
- ✅ Adiciona comentários de documentação

### **3. Executar Migração de Dados de Exemplo (Opcional)**
Cole e execute o conteúdo do arquivo:
```
supabase/migrations/20250125000002_insert_sample_archived_messages_safe.sql
```

**O que esta migração faz:**
- ✅ Verifica se existem canais, usuários e workspaces
- ✅ Cria dados de exemplo se não existirem
- ✅ Insere 3 mensagens arquivadas de exemplo
- ✅ Usa dados reais ou cria dados de exemplo
- ✅ Cria mensagens com datas realistas
- ✅ Verifica os dados inseridos
- ✅ Tratamento de erros robusto

## 🔧 **Estrutura da Tabela**

```sql
CREATE TABLE archived_messages (
  id UUID PRIMARY KEY,
  original_message_id UUID NOT NULL,
  content TEXT NOT NULL,
  channel_id UUID NOT NULL,
  user_id UUID NOT NULL,
  workspace_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE
);
```

## 🛡️ **Segurança (RLS)**

### **Políticas Implementadas:**
- **SELECT**: Usuários podem ver mensagens arquivadas dos seus workspaces
- **INSERT**: Apenas admins podem arquivar mensagens
- **DELETE**: Apenas admins podem deletar mensagens arquivadas

### **Índices para Performance:**
- `workspace_id` - Filtros por workspace
- `channel_id` - Filtros por canal
- `user_id` - Filtros por usuário
- `archived_at` - Ordenação por data de arquivamento
- `created_at` - Ordenação por data original

## 📊 **Dados de Exemplo**

Após executar as migrações, você terá:

### **3 Mensagens Arquivadas:**
1. **Mensagem 1**: "Esta é uma mensagem arquivada de exemplo..."
   - Canal: `general`
   - Data original: 7 dias atrás
   - Arquivada: 1 dia atrás

2. **Mensagem 2**: "Outra mensagem arquivada para mostrar..."
   - Canal: `random`
   - Data original: 14 dias atrás
   - Arquivada: 2 dias atrás

3. **Mensagem 3**: "Mensagem de teste para verificar..."
   - Canal: `general`
   - Data original: 30 dias atrás
   - Arquivada: 3 dias atrás

## 🎯 **Resultado**

### **Antes da Migração:**
- ❌ Dados simulados
- ❌ Não persiste no banco
- ❌ Não integra com sistema real

### **Depois da Migração:**
- ✅ Dados reais do Supabase
- ✅ Persistência no banco
- ✅ Integração completa
- ✅ Filtros funcionando
- ✅ Exportação CSV real
- ✅ Restauração funcional

## 🔄 **Como Testar**

### **1. Verificar Tabela Criada**
```sql
SELECT * FROM archived_messages LIMIT 5;
```

### **2. Testar Interface**
- Acesse: `/w/[workspaceId]/audit`
- Verifique se as mensagens aparecem
- Teste os filtros
- Teste a exportação CSV

### **3. Verificar Logs**
- Console deve mostrar: "Tabela archived_messages encontrada"
- Sem erros de "tabela não existe"

## 🚨 **Troubleshooting**

### **Erro: "Tabela não encontrada"**
- ✅ Execute a migração principal primeiro
- ✅ Verifique se está no projeto correto do Supabase

### **Erro: "null value in column channel_id violates not-null constraint"**
- ✅ Use a migração segura: `20250125000002_insert_sample_archived_messages_safe.sql`
- ✅ Esta migração cria dados de exemplo se não existirem
- ✅ Verifica se há canais, usuários e workspaces antes de inserir

### **Erro: "Nenhum canal encontrado"**
- ✅ A migração segura cria canais de exemplo automaticamente
- ✅ Ou crie canais primeiro no workspace
- ✅ Verifique se os canais pertencem ao workspace correto

### **Erro: "Nenhum usuário encontrado"**
- ✅ A migração segura cria usuários de exemplo automaticamente
- ✅ Ou verifique se há usuários cadastrados
- ✅ Confirme se os usuários pertencem ao workspace

## 📝 **Próximos Passos**

### **1. Arquivar Mensagens Reais**
- Use o botão "Arquivar Agora" nas configurações
- Configure retenção de mensagens
- Teste o processo de arquivamento

### **2. Personalizar Políticas**
- Ajuste as políticas RLS conforme necessário
- Adicione mais restrições se necessário
- Configure auditoria de acesso

### **3. Monitoramento**
- Monitore o crescimento da tabela
- Configure limpeza automática se necessário
- Implemente alertas de espaço

## 🎉 **Status Final**

Após executar as migrações:
- ✅ **Interface funcionando com dados reais**
- ✅ **Filtros operacionais**
- ✅ **Exportação CSV real**
- ✅ **Restauração funcional**
- ✅ **Segurança implementada**
- ✅ **Performance otimizada**

**Resultado**: Interface de auditoria **100% funcional** com dados reais do Supabase!
