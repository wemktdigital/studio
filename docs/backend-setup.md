# Backend Setup com Supabase

## 🚀 Configuração

1. **Criar projeto no Supabase**
2. **Configurar variáveis de ambiente**:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://ghmawevdsghvvzliibzv.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobWF3cnZkc2dodnZ6bGlpYnp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMDc3NzEsImV4cCI6MjA3MDg4Mzc3MX0.fmar501flcc0cHnU6UOsWRsn7-daQ_cwDmQ1cqOmM6A
   SUPABASE_SERVICE_ROLE_KEY=sua_chave_servico
   ```
3. **Executar schema SQL** do arquivo `supabase-schema.sql`
4. **Executar dados de teste** do arquivo `supabase-seed-data.sql` (opcional)

## 🗄️ Estrutura

- **workspaces**: Workspaces da aplicação
- **users**: Perfis dos usuários
- **channels**: Canais dos workspaces
- **messages**: Sistema de mensagens
- **RLS habilitado** para segurança

## 🔐 Segurança

- Row Level Security (RLS) ativo
- Políticas baseadas em associação ao workspace
- Usuários só veem dados dos workspaces que participam

## 📱 Funcionalidades

- Autenticação completa
- Mensagens em tempo real
- Upload de arquivos
- Sistema de reações e threads

## 🏗️ Arquitetura Implementada

### **FASE 1: Configuração e Autenticação** ✅
- ✅ Configuração do Supabase
- ✅ Sistema de autenticação
- ✅ Schema do banco de dados
- ✅ Middleware de proteção de rotas

### **FASE 2: Estrutura Base** ✅
- ✅ **WorkspaceService**: Gerenciamento completo de workspaces
- ✅ **UserService**: Gerenciamento de usuários e perfis
- ✅ **ChannelService**: Gerenciamento de canais
- ✅ **Hooks customizados**: React Query para estado e cache
- ✅ **Sistema de notificações**: Toast para feedback do usuário

### **Serviços Disponíveis**

#### **WorkspaceService**
```typescript
// Criar workspace
await workspaceService.createWorkspace({ name: 'Novo Projeto' })

// Listar workspaces do usuário
const workspaces = await workspaceService.getUserWorkspaces()

// Adicionar membros
await workspaceService.addMember(workspaceId, userId, 'admin')
```

#### **UserService**
```typescript
// Obter perfil atual
const profile = await userService.getCurrentUser()

// Atualizar status
await userService.updateStatus('online')

// Buscar usuários
const users = await userService.searchUsers('alice')
```

#### **ChannelService**
```typescript
// Criar canal
await channelService.createChannel({ 
  name: 'geral', 
  workspace_id: workspaceId 
})

// Listar canais do workspace
const channels = await channelService.getWorkspaceChannels(workspaceId)
```

### **Hooks Disponíveis**

#### **useWorkspaces()**
```typescript
const { 
  workspaces, 
  createWorkspace, 
  isLoading 
} = useWorkspaces()
```

#### **useCurrentUser()**
```typescript
const { 
  profile, 
  updateProfile, 
  updateStatus 
} = useCurrentUser()
```

#### **useWorkspaceChannels(workspaceId)**
```typescript
const { 
  channels, 
  createChannel, 
  isLoading 
} = useWorkspaceChannels(workspaceId)
```

## 🔄 Próximos Passos

### **FASE 3: Sistema de Mensagens** (Próxima)
- [ ] Implementar MessageService com tempo real
- [ ] Sistema de reações e threads
- [ ] Upload de arquivos com Supabase Storage

### **FASE 4: Funcionalidades Avançadas**
- [ ] Sistema de busca com Full-Text Search
- [ ] Notificações push
- [ ] Status online/offline em tempo real
- [ ] Testes e otimizações

## 📁 Estrutura de Arquivos

```
src/
├── lib/
│   ├── supabase/           # Configuração Supabase
│   │   ├── config.ts       # Cliente principal
│   │   ├── server.ts       # Cliente servidor (SSR)
│   │   ├── client.ts       # Cliente browser
│   │   ├── middleware.ts   # Middleware auth
│   │   └── types.ts        # Tipos TypeScript
│   └── services/           # Serviços de negócio
│       ├── workspace-service.ts
│       ├── user-service.ts
│       └── channel-service.ts
├── hooks/                  # Hooks customizados
│   ├── use-auth.tsx
│   ├── use-workspaces.tsx
│   ├── use-users.tsx
│   └── use-channels.tsx
└── components/
    └── providers/
        └── auth-provider.tsx
```

## 🧪 Testando

1. **Execute o schema**: `supabase-schema.sql`
2. **Execute os dados de teste**: `supabase-seed-data.sql`
3. **Teste os hooks** em componentes React
4. **Verifique o banco** no Supabase Dashboard

## 🎯 Vantagens da Implementação

- ✅ **Type Safety**: TypeScript completo com tipos do Supabase
- ✅ **Cache Inteligente**: React Query para otimização de performance
- ✅ **Estado Centralizado**: Hooks reutilizáveis e consistentes
- ✅ **Tratamento de Erros**: Sistema robusto de notificações
- ✅ **Segurança**: RLS configurado e políticas implementadas
