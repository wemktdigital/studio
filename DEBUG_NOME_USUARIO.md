# 🔍 DEBUG: Nome de Usuário nas Mensagens

## 🎯 PASSOS PARA RESOLVER

### 1. Limpar cache do navegador

```
CTRL + SHIFT + DELETE
Ou:
- Settings → Privacy → Clear browsing data
- Selecionar "Cached images and files"
- Time range: "All time"
- CLICK CLEAR DATA
```

### 2. Recarregar com Hard Refresh

```
CTRL + F5 (Windows)
ou
CTRL + SHIFT + R
```

### 3. Abrir DevTools Console (F12)

### 4. Enviar uma mensagem

### 5. Verificar os logs

Procure por estes logs no console:

```
🔍 MessageService sendMessage DEBUG: {
  messageId: "...",
  authorId: "3640ae7a-...",
  userDataReturned: {...},      // ← DEVE TER DADOS DO USUÁRIO
  userDataDisplayName: "...",   // ← DEVE TER O NOME
  ...
}

🔍 MessageService sendMessage - author final: {
  id: "...",
  displayName: "...",            // ← DEVE TER O NOME REAL
  handle: "...",
  ...
}
```

---

## 🔴 PROBLEMA POSSÍVEL #1: Usuário não existe na tabela users

Se `userDataReturned` for `null` ou `undefined`:

```sql
-- Verifique se você está logado como um usuário válido:
-- Abra o Supabase Dashboard → Table Editor → users
-- Verifique se há um registro com seu ID

-- Você pode verificar no console também:
-- No navegador: Application → Cookies → sb-...-auth-token
-- Extrair o user_id do token
```

**SOLUÇÃO:** Certifique-se de estar logado com um usuário válido que existe na tabela `users`.

---

## 🔴 PROBLEMA POSSÍVEL #2: RLS bloqueando acesso

Se `userError` tiver mensagem de erro:

```sql
-- Execute no Supabase SQL Editor:
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;

CREATE POLICY "Enable read access for authenticated users" ON users
  FOR SELECT
  USING (auth.role() = 'authenticated');
```

---

## 🔴 PROBLEMA POSSÍVEL #3: Coluna display_name está NULL

Verifique no banco:

```sql
-- No Supabase SQL Editor:
SELECT id, display_name, username, handle 
FROM users 
WHERE id = 'SEU_ID_AQUI';

-- Se display_name for NULL, atualize:
UPDATE users 
SET display_name = 'Seu Nome Aqui' 
WHERE id = 'SEU_ID_AQUI';
```

---

## ✅ Correções Aplicadas

1. ✅ Adicionado campo `author?: User` ao tipo Message
2. ✅ Criada função `normalizeAuthor()` 
3. ✅ Substituídos 6+ lugares que geravam "Usuário 3640ae7a"
4. ✅ Adicionado logging detalhado

---

## 🧪 Próximos Passos

1. Limpe o cache
2. Recarregue a página
3. Envie uma mensagem
4. Me envie um print dos logs do console

**Os logs vão mostrar EXATAMENTE onde está o problema!**

---

**Data:** Janeiro 2025  
**Aguardando:** Teste com logs do console

