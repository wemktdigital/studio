# 📚 Documentação Completa do Sistema de Mensagens

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Componentes Principais](#componentes-principais)
4. [Fluxo de Dados](#fluxo-de-dados)
5. [Funções Críticas](#funções-críticas)
6. [Realtime (Tempo Real)](#realtime-tempo-real)
7. [Tratamento de Erros](#tratamento-de-erros)
8. [Banco de Dados](#banco-de-dados)
9. [Guias de Uso](#guias-de-uso)

---

## 🎯 Visão Geral

### O que é este sistema?

Sistema de chat em tempo real usando:
- **Next.js 14** (Framework React)
- **Supabase** (Backend como serviço)
- **Supabase Realtime** (WebSockets para mensagens em tempo real)
- **React Query** (Estado e cache de dados)
- **TypeScript** (Tipagem estática)

### Funcionalidades Principais

✅ Enviar mensagens em canais  
✅ Conversas diretas (DM)  
✅ Mensagens em tempo real  
✅ Threads (respostas)  
✅ Reações  
✅ Avatars e status de usuário  
✅ Nome e avatar corretos sempre  

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    CAMADA DE APRESENTAÇÃO                    │
│  (Components React: message.tsx, message-list.tsx, etc)     │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────────┐
│                     CAMADA DE LÓGICA                         │
│           (Hooks: use-messages.tsx, use-auth.tsx)           │
│              - React Query para cache                       │
│              - Estado local                                 │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────────┐
│                    CAMADA DE SERVIÇO                         │
│       (Services: message-service.ts, auth-service.ts)        │
│              - Lógica de negócio                           │
│              - Comunicação com Supabase                    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────────┐
│                      CAMADA DE DADOS                         │
│             (Supabase: PostgreSQL + Realtime)              │
│              - Banco de dados                              │
│              - WebSockets para tempo real                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Componentes Principais

### 1. MessageService (`src/lib/services/message-service.ts`)

**Responsabilidade:** Gerenciar todas as operações de mensagens

**Métodos principais:**

#### `normalizeAuthor(userData, authorId)`
**Linha 78-118**

**O que faz:**
- Normaliza dados do autor para formato consistente
- Garante que sempre haja um nome válido (displayName)
- Prioridade: display_name > username > name > email > "Usuário"
- Retorna objeto com: id, displayName, handle, avatarUrl, status

**Por que é crítico:**
- Usado em TODAS as operações de mensagens
- Garante que UI sempre receba dados formatados
- Evita nomes aleatórios ou IDs do usuário

**Exemplo de uso:**
```typescript
const author = this.normalizeAuthor(userData, payload.new.author_id)
// Retorna: { id, displayName: "João Braga", handle: "joao", ... }
```

---

#### `getChannelMessages(channelId)`
**Linha ~560-683**

**O que faz:**
- Busca mensagens do banco de dados para um canal específico
- Inclui dados completos do autor (nome, avatar)
- Retorna array de MessageWithAuthor

**Fluxo:**
1. Busca mensagens simples do banco
2. Extrai IDs dos autores (author_id)
3. Busca dados dos usuários em lote
4. Cria mapa de usuários para lookup rápido
5. Combina mensagem + dados do autor
6. Retorna array completo

**Por que separa a busca de usuários?**
- JOIN no Supabase às vezes falha
- Busca em lote é mais eficiente
- Permite melhor tratamento de erros

---

#### `sendMessage(message)`
**Linha ~704-900**

**O que faz:**
- Insere mensagem no banco de dados
- Busca dados completos do autor
- Retorna mensagem completa com dados do autor

**Fluxo:**
1. Valida parâmetros
2. Insere mensagem no banco (INSERT)
3. Busca dados do autor (SELECT users)
4. Normaliza dados do autor (normalizeAuthor)
5. Retorna MessageWithAuthor

**Por que busca dados do autor após inserir?**
- INSERT não retorna dados relacionados (JOIN)
- Frontend precisa de nome/avatar imediatamente
- Evita segunda consulta no frontend

---

#### `subscribeToChannelMessages(channelId, callback)`
**Linha ~876-1062**

**O que faz:**
- Assina eventos do Supabase Realtime para um canal
- Recebe mensagens novas em tempo real
- Hidrata mensagens com dados do autor ANTES de passar pro frontend

**Fluxo:**
1. Cria canal Realtime (`channel:${channelId}`)
2. Escuta eventos INSERT na tabela messages
3. Quando nova mensagem chega (payload.new):
   - Busca dados do usuário no banco
   - Verifica se tem nome válido
   - Se NÃO tiver nome: CANCEL消息 (não envia pro frontend)
   - Se tiver nome: normaliza e envia pro frontend
4. Frontend recebe mensagem completa

**Por que hidrata no serviço?**
- Payload do Realtime vem "cruo" (sem JOIN)
- Frontend não precisa fazer queries adicionais
- Garante que mensagem sempre tenha nome válido

**Crítico - linhas 967-973:**
```typescript
// Verifica se tem nome válido ANTES de enviar pro frontend
const hasName = userData.display_name || userData.username || userData.handle
if (!hasName) {
  console.error('🚨 CANCELANDO MENSAGEM - sem nome válido')
  return // NÃO ENVIA MENSAGEM SEM NOME
}
```

---

### 2. useChannelMessages (`src/hooks/use-messages.tsx`)

**Responsabilidade:** Hook React para gerenciar mensagens de um canal

**O que faz:**
- Usa React Query para buscar mensagens
- Gerencia cache local
- Assina Realtime para atualizações
- Fornece função `sendMessage`

**Fluxo de mensagens:**

```
┌─────────────────────────────────────────────────┐
│ 1. Carregar histórico (useQuery)              │
│    - Busca mensagens do banco                   │
│    - Retorna com dados do autor                 │
└────────────┬────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│ 2. Assinar Realtime (useEffect)               │
│    - Escuta novas mensagens                    │
│    - Hidrata com dados do autor               │
│    - Atualiza cache local                      │
└────────────┬────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│ 3. Enviar mensagem (mutation)                  │
│    - Insere no banco                           │
│    - Atualiza cache imediatamente               │
│    - Não precisa refetch (otimização)          │
└─────────────────────────────────────────────────┘
```

---

### 3. MessageItem (`src/components/slack/message.tsx`)

**Responsabilidade:** Renderizar uma mensagem individual

**O que faz:**
- Exibe avatar, nome, horário, conteúdo
- Gerencia reações
- Permite resposta (threads)
- Abre perfil do usuário ao clicar no avatar

**Crítico - linhas 89-109:**
```typescript
// Tenta encontrar autor da mensagem
const author = useMemo(() => {
  // PRIORIDADE 1: Se mensagem já tem author, usa direto
  if (message.author) return message.author
  
  // PRIORIDADE 2: Busca no array de usuários
  return users.find(u => u.id === message.authorId)
}, [message.author, users, message.authorId])
```

**Por que isso é importante:**
- Garante que sempre haja um author válido
- Fallback para array de usuários se necessário
- Evita "Usuário Desconhecido"

---

## 🔄 Fluxo de Dados

### Ao ENVIAR mensagem:

```
1. Usuário digita e clica "Enviar"
         ↓
2. useChannelMessages.sendMessage()
         ↓
3. messageService.sendMessage()
         ↓
4. INSERT no banco (Supabase)
         ↓
5. SELECT dados do autor
         ↓
6. normalizeAuthor() → formata dados
         ↓
7. Atualiza cache local (React Query)
         ↓
8. Mensagem aparece imediatamente na UI
```

### Ao RECEBER mensagem (Realtime):

```
1. Usuário B envia mensagem
         ↓
2. Supabase detecta INSERT
         ↓
3. Realtime envia evento para frontend
         ↓
4. subscribeToChannelMessages recebe payload
         ↓
5. Busca dados do autor no banco
         ↓
6. Verifica se tem nome válido
         ↓
7. Se NÃO → CANCELAR mensagem
   Se SIM → normalizeAuthor()
         ↓
8. Atualiza cache local
         ↓
9. Mensagem aparece em tempo real na UI
```

---

## ⚡ Realtime (Tempo Real)

### Como funciona?

Supabase Realtime usa **WebSockets** para enviar atualizações do banco diretamente para o frontend.

**Configuração (linhas 911-1043):**
```typescript
const channel = this.supabase.channel(`channel:${channelId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `channel_id=eq.${channelId}` // Filtro por canal
  }, async (payload) => {
    // Quando nova mensagem é inserida, este callback é executado
    // Payload contém dados da linha inserida
  })
```

**Por que precisa hidratar no Realtime?**
- Payload vem com dados da tabela `messages` APENAS
- Não inclui JOIN com `users`
- Precisa buscar dados do autor separadamente

**Otimização:**
- Busca em lote para múltiplos usuários
- Cache local para evitar queries repetidas
- Cancela mensagens sem nome válido (economiza processamento)

---

## 🛡️ Tratamento de Erros

### Níveis de Proteção

1. **Validação de dados** (linha 969-973)
   - Verifica se userData existe
   - Verifica se tem nome válido
   - Cancela mensagem se não atender

2. **Fallback mode** (linhas 62-63, 138-142)
   - Após MAX_ERRORS erros consecutivos
   - Força modo fallback (dados mock)
   - Loga avisos detalhados

3. **Try-catch** (linha 1001-1020)
   - Captura erros inesperados
   - Tenta enviar mensagem básica
   - Loga erro completo

4. **Try-catch** (linha 1001-1020)
   - Captura erros inesperados
   - Tenta enviar mensagem básica
   - Loga erro completo

---

## 💾 Banco de Dados

### Estrutura da Tabela `messages`

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  content TEXT NOT NULL,        -- Conteúdo da mensagem
  type VARCHAR NOT NULL,          -- 'text', 'image', 'code', 'link'
  author_id UUID NOT NULL,      -- FK para users(id)
  channel_id UUID,              -- FK para channels(id)
  dm_id UUID,                    -- FK para direct_messages(id)
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  -- ... outros campos
);
```

### Relacionamentos

```
messages.author_id → users.id
messages.channel_id → channels.id
messages.dm_id → direct_messages.id
```

### Queries Principais

**Buscar mensagens com autor:**
```sql
-- Query 1: Busca mensagens
SELECT * FROM messages 
WHERE channel_id = 'xxx' 
ORDER BY created_at DESC;

-- Query 2: Busca usuários em lote
SELECT id, display_name, username, handle, avatar_url, status
FROM users 
WHERE id IN (list_of_author_ids);
```

**Inserir mensagem:**
```sql
INSERT INTO messages (content, type, author_id, channel_id)
VALUES ('texto', 'text', 'user-id', 'channel-id')
RETURNING *;
```

---

## 📝 Guias de Uso

### Como adicionar nova funcionalidade?

1. **Adicionar ao MessageService**
   - Criar método na classe
   - Seguir padrão de buscar dados do autor
   - Usar normalizeAuthor()
   - Adicionar logs de debug

2. **Adicionar ao Hook**
   - Criar hook específico (ou usar existente)
   - Usar React Query para cache
   - Implementar Realtime se necessário

3. **Adicionar ao Componente**
   - Renderizar dados do author
   - Usar dados do author.author.displayName
   - Adicionar tratamento de loading/erro

### Como debugar?

1. **Ver logs no console:**
   ```typescript
   console.log('🔍 MessageItem: Checking author data:', {...})
   ```

2. **Verificar banco de dados:**
   ```sql
   SELECT * FROM users WHERE id = 'user-id';
   SELECT * FROM messages WHERE channel_id = 'channel-id';
   ```

3. **Verificar Realtime:**
   - Abrir DevTools > Network
   - Procurar por "ws://" (WebSocket)
   - Verificar status da conexão

---

## 🎯 Resumo dos Pontos Críticos

### 1. **SEMPRE buscar dados do autor**
- Inserção não retorna dados relacionados
- Realtime envia payload cru
- Buscar dados separadamente é necessário

### 2. **NUNCA enviar mensagem sem nome válido**
- Linha 969-973: Verifica hasName
- Cancela mensagem se não tiver nome
- Evita "Usuário" no chat

### 3. **USAR normalizeAuthor() sempre**
- Garante formato consistente
- Trata dados faltantes
- Fornece fallbacks inteligentes

### 4. **HIDRATAR no serviço, não no frontend**
- Frontend recebe dados prontos
- Menos queries = melhor performance
- Cache funciona corretamente

---

## 🔗 Arquivos Relacionados

- `src/lib/services/message-service.ts` - Serviço principal
- `src/hooks/use-messages.tsx` - Hook React
- `src/components/slack/message.tsx` - Componente de mensagem
- `src/lib/types.ts` - Tipos TypeScript
- `src/lib/supabase/types.ts` - Tipos do Supabase

---

**Data:** 27/01/2025  
**Versão:** 1.0.0  
**Autor:** Sistema de Chat

