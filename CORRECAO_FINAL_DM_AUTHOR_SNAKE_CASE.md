# Correção Final: Problema de snake_case vs camelCase no Author

## 🔴 Problema Identificado

Os logs mostravam que o `author` estava sendo enviado como `{}` (objeto vazio) no `useDMMessages`, mesmo que `authorDisplayName` estivesse correto (`"João Braga"`).

**Causa raiz:** O `getDirectMessageMessages` estava retornando o `author` com campos em **snake_case** (`display_name`, `avatar_url`), enquanto o `MessageItem` esperava **camelCase** (`displayName`, `avatarUrl`).

## ✅ Correções Aplicadas

### 1. **message-service.ts** - `getDirectMessageMessages()`
Transformado o objeto `author` para usar camelCase:

```typescript
author: {
  id: authorData.id,
  displayName: authorData.display_name || authorData.username || authorData.handle || `Usuário ${msg.author_id.slice(0, 8)}`,
  handle: authorData.handle || authorData.username || 'usuario',
  avatarUrl: authorData.avatar_url || 'https://i.pravatar.cc/40?u=default',
  status: authorData.status || 'offline'
}
```

### 2. **message.tsx** - `MessageItem`
Adicionado fallback para buscar `author` do array `users` quando ele vier vazio:

```typescript
if ((!message.author || Object.keys(message.author).length === 0) && message.authorId) {
  const foundInUsers = users.find(u => u.id === message.authorId)
  if (foundInUsers) {
    message.author = foundInUsers
  }
}
```

### 3. **use-direct-messages.tsx**
Adicionados logs detalhados para rastrear o fluxo do `author` pelo cache do React Query.

## 🧪 Teste

1. Recarregue a página (CTRL + SHIFT + R)
2. Envie uma mensagem privada
3. Verifique se o nome do remetente aparece corretamente na tela

---

**Status:** ✅ Correção aplicada
