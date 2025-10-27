# ✅ SOLUÇÃO: Habilitar Realtime para Messages

## 🎯 Problema

As mensagens não chegam em tempo real porque a tabela `messages` **não tem Realtime habilitado** no Supabase.

---

## ✅ Solução

Criei um arquivo de migration que habilita o Realtime:

**Arquivo:** `supabase/migrations/20250127000000_enable_realtime_messages.sql`

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

---

## 🚀 Como Aplicar

### **Opção 1: Via Supabase Studio** (Recomendado)

1. Acesse: http://localhost:54323 (Supabase Studio local)
2. Vá em "SQL Editor"
3. Cole o SQL abaixo:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```
4. Execute

---

### **Opção 2: Via Terminal**

```bash
# Navegar até a pasta do projeto
cd C:\WE1\OneDrive\Documentos\GitHub\studio

# Aplicar migration
npx supabase db push
```

---

### **Opção 3: Supabase Cloud**

Se estiver usando Supabase Cloud:

1. Acesse: https://app.supabase.com
2. Vá em "SQL Editor"
3. Cole e execute:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

---

## ✅ Depois de Aplicar

1. **Limpar cache** (CTRL + SHIFT + DELETE)
2. **Recarregar** (CTRL + F5)
3. **Abrir 2 abas** com perfis diferentes
4. **Enviar mensagem** de uma aba
5. **Ver mensagem chegar instantaneamente** na outra aba!

---

## 🔍 Verificar se Funcionou

No console, você verá:
```
✅ [REALTIME] CONECTADO COM SUCESSO!
📨 [REALTIME] Nova mensagem recebida!
✅ [REALTIME] MENSAGEM ENVIADA COM SUCESSO!
```

---

**Status:** ✅ MIGRATION CRIADA  
**Ação:** Aplicar migration no banco de dados

