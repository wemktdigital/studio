# 🚨 INSTRUÇÕES DEFINITIVAS: Habilitar Realtime

## ⚠️ ATENÇÃO: PASSO OBRIGATÓRIO

**SEM este SQL, o Realtime NÃO vai funcionar.**

---

## 🎯 PASSO 1: Executar SQL

### **Opção A: Supabase Studio Local**

1. Abra: http://localhost:54323
2. Clique em "SQL Editor" no menu lateral
3. Cole este SQL:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

4. Clique em "Run" ou pressione CTRL+ENTER
5. Deve aparecer: "Success. No rows returned"

---

### **Opção B: Supabase Cloud**

1. Abra: https://app.supabase.com
2. Selecione seu projeto
3. Vá em "SQL Editor" no menu lateral
4. Cole o mesmo SQL acima
5. Execute

---

## 🎯 PASSO 2: Verificar se Funcionou

Execute este SQL:

```sql
SELECT tablename FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' AND tablename = 'messages';
```

**Se retornar "messages"**: ✅ Tudo certo!  
**Se não retornar nada**: ⚠️ O SQL não foi executado corretamente

---

## 🎯 PASSO 3: Limpar Cache e Testar

1. Limpar cache (CTRL + SHIFT + DELETE)
2. Recarregar todas as abas (CTRL + F5)
3. Abrir 2 abas com perfis diferentes
4. Enviar mensagem
5. Mensagem deve aparecer **INSTANTANEAMENTE** na outra aba!

---

## ✅ PRONTO!

Depois de executar o SQL, o Realtime vai funcionar automaticamente.

**Não precisa fazer mais nada no código!**

---

## 🔍 LOGS ESPERADOS

No console (F12), você verá:

```
✅ [REALTIME] Conectado ao canal: abc-123
📨 [REALTIME] Nova mensagem: oi
✅ [HOOK] Adicionando mensagem ao cache: João
```

---

**Execute o SQL e teste!**

