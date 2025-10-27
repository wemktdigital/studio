# ✅ INSTRUÇÕES FINAIS - Teste Completo

## 🎯 Objetivo

Verificar por que mensagens aparecem como "Usuário" em vez do nome real em **tempo real**, sem precisar dar F5.

---

## 🧪 Passos para Teste

### 1. Limpar TUDO

```powershell
# 1. Limpar cache do navegador
CTRL + SHIFT + DELETE -> Limpar tudo

# 2. Recarregar página
CTRL + F5 (recarregamento forçado)

# 3. Abrir DevTools
F12
```

### 2. Abrir Console (F12 > Console)

**Procurar por:**
- `🔍 MessageService Realtime DEBUG`
- `🔍🔍🔍 USERDATA COMPLETO 🔍🔍🔍`
- `🚨🚨🚨 useChannelMessages: MENSAGEM EM TEMPO REAL RECEBIDA! 🚨🚨🚨`
- `🔍🔍🔍 MENSAGEM COMPLETA DO REALTIME 🔍🔍🔍`

### 3. Enviar Mensagem

**Como você (João Braga):**
- Enviar mensagem: "teste 1"
- **Verificar logs no console**
- **Print os logs**

**Pedir para OUTRA PESSOA enviar:**
- Mensagem: "teste 2"
- **Verificar se aparece com NOME ou "Usuário"**
- **Verificar logs no console**
- **Print os logs**

---

## 🔍 O que verificar nos logs

### Se aparecer "Usuário":

**Log esperado:**
```
🚨 MessageService: Usuário sem nome identificável - CANCELANDO MENSAGEM
🚨 userData completo: { ... dados do usuário ... }
```

**Isso significa:**
- Mensagem está sendo **CANCELADA** porque não tem nome válido
- Verifique os dados de `userData` no log
- Provavelmente `display_name`, `username`, `handle` todos estão vazios

### Se mensagem aparecer mas com "Usuário":

**Log esperado:**
```
🚨🚨🚨 MENSAGEM EM TEMPO REAL RECEBIDA
authorDisplayName: undefined (ou null)
```

**Isso significa:**
- Mensagem está chegando sem dados do autor
- Realtime não está hidratando corretamente
- Ou bloqueio não está funcionando

---

## 📸 O que enviar

1. **Print completo dos logs** do console (F12)
2. **Qual é o nome** que aparece (João Braga ou Usuário)?
3. **Aparece em tempo real** ou só depois de F5?

---

## ✅ Solução Esperada

**Após correções:**

1. Mensagens chegam em **tempo real** (não precisa F5)
2. Mensagens mostram **nome real** (João Braga, Karine, etc)
3. NUNCA aparece "Usuário"

**Logs esperados:**
```
🔔 MessageService Realtime: Mensagem hidratada com sucesso
  messageId: xxx
  authorDisplayName: "João Braga"
  authorHandle: "joao"
```

---

## 🚨 Se ainda aparecer "Usuário"

### Causa 1: Dados do banco
- Verificar se usuário tem `display_name`, `username`, ou `handle` preenchidos
- Query SQL:
```sql
SELECT id, display_name, username, handle FROM users WHERE id = 'ID_DO_USUARIO';
```

### Causa 2: Bloqueio não funcionando
- Mensagens sem nome válido estão passando
- Verificar logs para ver por quê

### Causa 3: Cache antigo
- Limpar cache do navegador (CTRL + SHIFT + DELETE)
- Limpar localStorage
- Recarregar página (CTRL + F5)

---

**Data:** 27/01/2025  
**Status:** Aguardando teste e logs

