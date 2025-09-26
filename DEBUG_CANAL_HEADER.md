# 🔍 Investigação: Nome e Descrição do Canal Não Aparecem

## 🎯 Problema Reportado

**Situação:** O usuário não consegue ver o nome nem a descrição do canal no header.

## 🔧 Debug Implementado

### **Logs Adicionados:**

**1. ChannelHeader (`channel-header.tsx`):**
```typescript
// ✅ DEBUG: Log dos dados recebidos
console.log('🔍 ChannelHeader: conversation data:', conversation);
console.log('🔍 ChannelHeader: conversation type:', typeof conversation);
console.log('🔍 ChannelHeader: conversation keys:', conversation ? Object.keys(conversation) : 'null');
```

**2. FunctionalChat (`functional-chat.tsx`):**
```typescript
// ✅ DEBUG: Log dos dados do canal
console.log('🔍 FunctionalChat: channel prop:', channel);
console.log('🔍 FunctionalChat: channelData:', channelData);
console.log('🔍 FunctionalChat: channelData.name:', channelData.name);
console.log('🔍 FunctionalChat: channelData.description:', channelData.description);
```

**3. ChannelPage (`channel-page.tsx`):**
```typescript
// ✅ DEBUG: Log dos dados do canal
console.log('🔍 ChannelPage: channelId:', channelId);
console.log('🔍 ChannelPage: channel data:', channel);
console.log('🔍 ChannelPage: isLoading:', isLoading);
console.log('🔍 ChannelPage: error:', error);
```

## 🔍 Como Investigar

### **1. Abrir o Console do Navegador:**
- Pressione `F12` ou `Ctrl+Shift+I`
- Vá para a aba "Console"
- Recarregue a página do canal

### **2. Verificar os Logs:**
Procure por logs que começam com `🔍`:

**Logs Esperados:**
```
🔍 ChannelPage: channelId: [ID_DO_CANAL]
🔍 ChannelPage: channel data: [DADOS_DO_CANAL]
🔍 ChannelPage: isLoading: false
🔍 ChannelPage: error: null

🔍 FunctionalChat: channel prop: [DADOS_DO_CANAL]
🔍 FunctionalChat: channelData: [DADOS_DO_CANAL]
🔍 FunctionalChat: channelData.name: [NOME_DO_CANAL]
🔍 FunctionalChat: channelData.description: [DESCRICAO_DO_CANAL]

🔍 ChannelHeader: conversation data: [DADOS_DO_CANAL]
🔍 ChannelHeader: conversation type: object
🔍 ChannelHeader: conversation keys: [array_de_chaves]
```

## 🚨 Possíveis Problemas

### **1. Canal Não Carregado:**
**Sintomas:**
```
🔍 ChannelPage: channel data: null
🔍 ChannelPage: isLoading: true
```

**Causa:** Hook `useChannel` não está conseguindo carregar os dados.

### **2. Dados Incorretos:**
**Sintomas:**
```
🔍 ChannelPage: channel data: { id: "...", name: undefined, description: undefined }
```

**Causa:** Dados do canal estão vazios ou incorretos.

### **3. Props Não Passadas:**
**Sintomas:**
```
🔍 FunctionalChat: channel prop: undefined
🔍 FunctionalChat: channelData: { name: "Canal teste", description: "Canal teste" }
```

**Causa:** `ChannelPage` não está passando os dados do canal para `FunctionalChat`.

### **4. Header Não Recebe Dados:**
**Sintomas:**
```
🔍 ChannelHeader: conversation data: null
```

**Causa:** `FunctionalChat` não está passando os dados para `ChannelHeader`.

## 🔧 Soluções por Problema

### **Problema 1: Canal Não Carregado**
```typescript
// Verificar se o hook useChannel está funcionando
// Verificar se o channelId está correto
// Verificar se há erro na query
```

### **Problema 2: Dados Incorretos**
```typescript
// Verificar se o canal existe no banco de dados
// Verificar se os campos name e description estão preenchidos
// Verificar se a query está retornando os campos corretos
```

### **Problema 3: Props Não Passadas**
```typescript
// Verificar se ChannelPage está passando channel para FunctionalChat
// Verificar se a interface está correta
```

### **Problema 4: Header Não Recebe Dados**
```typescript
// Verificar se FunctionalChat está passando channelData para ChannelHeader
// Verificar se a interface ChannelHeaderProps está correta
```

## 📋 Checklist de Verificação

### **1. Console Logs:**
- [ ] Logs do `ChannelPage` aparecem
- [ ] Logs do `FunctionalChat` aparecem  
- [ ] Logs do `ChannelHeader` aparecem
- [ ] Dados não são `null` ou `undefined`

### **2. Dados do Canal:**
- [ ] `channel.name` tem valor
- [ ] `channel.description` tem valor
- [ ] `channelData.name` tem valor
- [ ] `channelData.description` tem valor

### **3. Props:**
- [ ] `ChannelPage` passa `channel` para `FunctionalChat`
- [ ] `FunctionalChat` passa `channelData` para `ChannelHeader`
- [ ] Interfaces estão corretas

### **4. Renderização:**
- [ ] `ChannelHeader` renderiza o nome
- [ ] `ChannelHeader` renderiza a descrição
- [ ] Não há erros de JavaScript

## 🎯 Próximos Passos

**1. Execute o Debug:**
- Abra o console do navegador
- Navegue para um canal
- Verifique os logs

**2. Reporte os Resultados:**
- Copie os logs relevantes
- Identifique qual problema está ocorrendo
- Forneça informações sobre o comportamento

**3. Aplique a Solução:**
- Baseado nos logs, aplique a solução correspondente
- Teste se o problema foi resolvido

## ✅ Status: DEBUG IMPLEMENTADO

**Agora você pode investigar o problema usando os logs de debug!** 🔍

**Instruções:**
1. Abra o console do navegador (`F12`)
2. Navegue para um canal
3. Verifique os logs que começam com `🔍`
4. Reporte o que você vê nos logs
