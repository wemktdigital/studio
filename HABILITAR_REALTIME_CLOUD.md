# 🚨 HABILITAR REALTIME NO SUPABASE CLOUD

## ✅ Arquivo .env já está configurado!

O arquivo `.env` já está configurado com as credenciais do Supabase Cloud.

---

## 🎯 EXECUTAR SQL NO SUPABASE CLOUD

### PASSO 1: Acessar Supabase Cloud
1. Abra: https://app.supabase.com
2. Faça login na sua conta
3. Selecione o projeto: **ghmawrvdsghvvzliibzv**

### PASSO 2: Abrir SQL Editor
1. No menu lateral esquerdo, clique em **"SQL Editor"**
2. Clique em **"New query"** (Nova consulta)

### PASSO 3: Cole Este SQL
```sql
-- Habilitar Realtime para tabela messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Verificar se funcionou
SELECT tablename FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' AND tablename = 'messages';
```

### PASSO 4: Execute
1. Clique no botão **"Run"** (ou pressione CTRL+ENTER)
2. Deve aparecer: **"Success. 2 rows returned"**
3. Na tabela de resultados, você deve ver a linha com `tablename = 'messages'`

---

## ✅ SE FUNCIONOU:
Você verá `messages` na lista de tabelas retornadas!

---

## 🧪 TESTE FINAL

Depois de executar o SQL:

1. **Limpar cache:** CTRL + SHIFT + DELETE
2. **Recarregar TODAS as abas:** CTRL + F5
3. **Abrir 2 abas com perfis diferentes**
4. **Enviar mensagem de uma aba**
5. **Ver mensagem aparecer INSTANTANEAMENTE na outra aba!**

---

## 📋 LOGS ESPERADOS

No console (F12), você verá:

```
✅ [REALTIME] Conectado ao canal: abc-123
📨 [REALTIME] Nova mensagem recebida: oi
✅ [HOOK] Adicionando mensagem ao cache: João
```

---

**EXECUTE O SQL E TESTE!**
