# **Correção do Erro no MessageRetentionService**

## **Problema Identificado:**
```
Error: Erro ao buscar mensagens antigas: "{
  \"code\": \"42703\",
  \"details\": null,
  \"hint\": null,
  \"message\": \"column messages.author_idasuser_id does not exist\"
}"
```

## **Causa do Erro:**
O erro ocorreu devido a um problema de sintaxe SQL na query do `MessageRetentionService`. O alias `author_id as user_id` estava sendo interpretado incorretamente pelo Supabase, resultando em `author_idasuser_id` (sem espaços).

## **Soluções Implementadas:**

### **1. ✅ Correção da Query SQL**
**Antes (com erro):**
```typescript
.select(`
  id,
  content,
  channel_id,
  author_id as user_id,  // ❌ PROBLEMA: Alias causava erro
  created_at,
  channels(workspace_id)
`)
```

**Depois (corrigido):**
```typescript
.select(`
  id,
  content,
  channel_id,
  author_id,  // ✅ CORRIGIDO: Removido o alias problemático
  created_at,
  channels(workspace_id)
`)
```

### **2. ✅ Correção do Mapeamento de Dados**
**Antes:**
```typescript
const archivedMessages: ArchivedMessage[] = oldMessages.map(msg => ({
  id: msg.id,
  content: msg.content,
  channelId: msg.channel_id,
  userId: msg.user_id,  // ❌ PROBLEMA: Campo não existia
  createdAt: msg.created_at,
  archivedAt: new Date().toISOString()
}))
```

**Depois:**
```typescript
const archivedMessages: ArchivedMessage[] = oldMessages.map(msg => ({
  id: msg.id,
  content: msg.content,
  channelId: msg.channel_id,
  userId: msg.author_id,  // ✅ CORRIGIDO: Usar author_id
  createdAt: msg.created_at,
  archivedAt: new Date().toISOString()
}))
```

### **3. ✅ Correção do Método de Restauração**
**Antes:**
```typescript
const messagesToRestore = archivedMessages.map(msg => ({
  id: msg.original_message_id,
  content: msg.content,
  channel_id: msg.channel_id,
  user_id: msg.user_id,  // ❌ PROBLEMA: Campo incorreto para tabela messages
  created_at: msg.created_at
}))
```

**Depois:**
```typescript
const messagesToRestore = archivedMessages.map(msg => ({
  id: msg.original_message_id,
  content: msg.content,
  channel_id: msg.channel_id,
  author_id: msg.user_id,  // ✅ CORRIGIDO: Usar author_id para tabela messages
  created_at: msg.created_at
}))
```

## **Como Testar:**

1. **Vá para as Configurações do Workspace**
2. **Edite o nome do workspace**
3. **Clique em "Salvar"**
4. **Verifique se não há mais erros no console**

## **Logs Esperados:**
```
🗄️ Processando retenção de mensagens para workspace [workspace-id]
📅 Arquivando mensagens anteriores a: [data]
📦 Encontradas X mensagens para arquivar
✅ X mensagens arquivadas com sucesso
```

## **Status:**
✅ **Correção implementada** - Erro de sintaxe SQL corrigido

## **Arquivos Modificados:**
- `src/lib/services/message-retention-service.ts`
