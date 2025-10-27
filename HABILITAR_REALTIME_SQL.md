# 🚨 URGENTE: Habilitar Realtime - Instruções Finais

## ⚠️ PROBLEMA

As mensagens NÃO chegam em tempo real porque a tabela `messages` **não está publicada no Realtime do Supabase**.

---

## ✅ SOLUÇÃO - EXECUTE ESTE SQL

### **Passo 1: Acesse Supabase Studio**

**Local:**
```
http://localhost:54323
```

**Cloud:**
```
https://app.supabase.com
```

---

### **Passo 2: Vá em "SQL Editor"**

Clique no ícone SQL no menu lateral esquerdo.

---

### **Passo 3: Cole Este SQL e Execute**

```sql
-- Habilitar Realtime para tabela messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

---

### **Passo 4: Verificar se Funcionou**

Execute:
```sql
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

Você deve ver a tabela `messages` na lista.

---

## ✅ APÓS APLICAR

1. **Limpar cache** do navegador (CTRL + SHIFT + DELETE)
2. **Recarregar** todas as abas (CTRL + F5)
3. **Testar:**
   - Abrir 2 abas com perfis diferentes
   - Enviar mensagem de uma aba
   - Ver mensagem chegar instantaneamente na outra aba!

---

## 🎯 LOGS ESPERADOS (Funcionando)

No console (F12), você verá:

```
🔔 [REALTIME] Criando canal: channel:abc-123
🔔 [REALTIME] Tentando conectar...
✅ [REALTIME] CONECTADO COM SUCESSO!
📨 [REALTIME] Nova mensagem recebida!
👤 [REALTIME] UserData obtido: { isNull: false, display_name: "João" }
✅ [REALTIME] MENSAGEM ENVIADA COM SUCESSO!
```

---

## ⚠️ SE NÃO FUNCIONAR

Se continuar sem funcionar, o fallback será ativado:

```
⚠️ [REALTIME] Erro - usando fallback
```

Neste caso, as mensagens serão buscadas a cada **3 segundos** (polling), não em tempo real, mas ainda funcionam.

---

**STATUS:** ⏳ AGUARDANDO APLICAÇÃO DA MIGRATION  
**AÇÃO NECESSÁRIA:** Executar o SQL acima no Supabase

