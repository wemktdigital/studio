# ✅ API de Mensagens - Documentação Completa

## 🎯 Resumo

API criada para buscar e enviar mensagens com todos os parâmetros solicitados.

**URL Base:** `http://localhost:9002/api/messages`

---

## 📋 Endpoints

### 1. GET - Buscar Mensagens

**Endpoint:** `GET /api/messages?channelId={id}`

**Parâmetros:**
- `channelId` (obrigatório) - ID do canal

**Exemplo:**
```bash
curl "http://localhost:9002/api/messages?channelId=be9f6b21-ccbb-4673-b5de-495e7b52e51a"
```

**Resposta JSON:**
```json
{
  "success": true,
  "total": 50,
  "messages": [
    {
      "Nome": "João Braga",
      "Horario": "27/10/2025, 09:16:36",
      "Mensagem": "oi",
      "IdConta": "3640ae7a-fab8-461f-8e7f-0dbe7ae43287",
      "Canal": "geralzao"
    }
  ]
}
```

---

### 2. POST - Enviar Mensagem

**Endpoint:** `POST /api/messages`

**Body (JSON):**
```json
{
  "channelId": "be9f6b21-ccbb-4673-b5de-495e7b52e51a",
  "content": "Olá, pessoal!",
  "authorId": "3640ae7a-fab8-461f-8e7f-0dbe7ae43287"
}
```

**Parâmetros:**
- `channelId` (obrigatório) - ID do canal
- `content` (obrigatório) - Conteúdo da mensagem
- `authorId` (obrigatório) - ID do autor

**Exemplo:**
```bash
curl -X POST "http://localhost:9002/api/messages" \
  -H "Content-Type: application/json" \
  -d '{
    "channelId": "be9f6b21-ccbb-4673-b5de-495e7b52e51a",
    "content": "Olá, pessoal!",
    "authorId": "3640ae7a-fab8-461f-8e7f-0dbe7ae43287"
  }'
```

**Resposta JSON:**
```json
{
  "success": true,
  "message": {
    "Nome": "João Braga",
    "Horario": "27/10/2025, 10:30:45",
    "Mensagem": "Olá, pessoal!",
    "IdConta": "3640ae7a-fab8-461f-8e7f-0dbe7ae43287",
    "Canal": "geralzao"
  }
}
```

---

## 📊 Parâmetros Retornados

Todos os endpoints retornam os seguintes parâmetros no JSON:

### ✅ Nome
**Tipo:** String  
**Descrição:** Nome completo ou username do autor da mensagem  
**Fallback:** "Usuário" (se não encontrar nome)

### ✅ Horario
**Tipo:** String  
**Formato:** "DD/MM/YYYY, HH:MM:SS"  
**Descrição:** Data e hora de criação da mensagem em formato brasileiro  
**Exemplo:** "27/10/2025, 09:16:36"

### ✅ Mensagem
**Tipo:** String  
**Descrição:** Conteúdo da mensagem

### ✅ IdConta
**Tipo:** String (UUID)  
**Descrição:** ID do autor da mensagem  
**Exemplo:** "3640ae7a-fab8-461f-8e7f-0dbe7ae43287"

### ✅ Canal
**Tipo:** String  
**Descrição:** Nome do canal onde a mensagem foi enviada  
**Fallback:** "geralzao" (se não encontrar nome)

---

## 🧪 Testar a API

### 1. PowerShell (Windows)

```powershell
# Buscar mensagens
Invoke-RestMethod -Uri "http://localhost:9002/api/messages?channelId=be9f6b21-ccbb-4673-b5de-495e7b52e51a" -Method Get

# Enviar mensagem
$body = @{
    channelId = "be9f6b21-ccbb-4673-b5de-495e7b52e51a"
    content = "Olá, pessoal!"
    authorId = "3640ae7a-fab8-461f-8e7f-0dbe7ae43287"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:9002/api/messages" -Method Post -Body $body -ContentType "application/json"
```

### 2. Script Automático

```bash
# Windows PowerShell
.\test-api-messages.ps1

# Linux/Mac
bash test-api-messages.sh
```

---

## 📝 Exemplo de Resposta Completa

```json
{
  "success": true,
  "total": 50,
  "messages": [
    {
      "Nome": "João Braga",
      "Horario": "27/10/2025, 09:16:36",
      "Mensagem": "oi",
      "IdConta": "3640ae7a-fab8-461f-8e7f-0dbe7ae43287",
      "Canal": "geralzao"
    },
    {
      "Nome": "Karine",
      "Horario": "27/10/2025, 09:12:02",
      "Mensagem": "a",
      "IdConta": "d8cff06e-d6f0-4b57-a364-21d4d9193827",
      "Canal": "geralzao"
    }
  ]
}
```

---

## 🔧 Arquivos Criados

1. **`src/app/api/messages/route.ts`** - Rota da API (GET e POST)
2. **`test-api-messages.ps1`** - Script de teste PowerShell
3. **`test-api-messages.sh`** - Script de teste Bash

---

## ✅ Status

**Status:** ✅ **FUNCIONANDO**  
**Último Teste:** 27/01/2025  
**Resultado:** API retornando todos os parâmetros corretamente

---

## 📌 Observações

1. **Limite de Mensagens:** O GET retorna no máximo 50 mensagens (mais recentes primeiro)
2. **Formato de Horário:** Brasileiro (DD/MM/YYYY, HH:MM:SS)
3. **Autenticação:** Não requer autenticação para testes, mas pode adicionar depois
4. **Ordenação:** Mensagens mais recentes primeiro

---

**Desenvolvido para:** Studio Chat  
**Data:** 27/01/2025

