# 🚀 Acesso Rápido - Administração de Usuários

## 📍 Onde Acessar AGORA

### **1️⃣ Primeiro Acesso**
```
1. Abra: http://localhost:9002
2. Faça login
3. Você será redirecionado para: http://localhost:9002/w
```

### **2️⃣ Lista de Workspaces**
```
URL: http://localhost:9002/w

O que você vê aqui:
✅ Todos os workspaces que você tem acesso
✅ Badge de "Admin" se você for administrador
✅ Botão para criar novo workspace
✅ Informações de cada workspace
```

### **3️⃣ Dentro do Workspace**
```
URL: http://localhost:9002/w/[workspaceId]

Exemplo: http://localhost:9002/w/123e4567-e89b-12d3-a456-426614174000

O que você vê aqui:
✅ Sidebar com canais
✅ Lista de membros
✅ DMs (mensagens diretas)
✅ Botão de configurações (⚙️) no topo
```

### **4️⃣ Página de Settings (AQUI VOCÊ GERENCIA TUDO!)**
```
URL: http://localhost:9002/w/[workspaceId]/settings

Como chegar:
1. Entre no workspace
2. Procure o ícone de engrenagem (⚙️) no canto superior direito
3. OU clique no nome do workspace → "Settings"

O que você encontra aqui:

┌─────────────────────────────────────────────┐
│                Settings                      │
├─────────────────────────────────────────────┤
│ [Geral] [Membros] [Permissões] [Avançado]  │
└─────────────────────────────────────────────┘

ABA "MEMBROS" - GERENCIAMENTO DE USUÁRIOS:
✅ Lista completa de membros
✅ Adicionar novos membros
✅ Enviar convites por email
✅ Alterar cargos (Admin, Member, Guest)
✅ Remover membros
✅ Reenviar convites pendentes
✅ Ativar/desativar usuários
```

---

## 🎯 Ações Rápidas

### **Adicionar Novo Usuário**
```
1. Acesse: /w/[workspaceId]/settings
2. Clique na aba "Membros"
3. Botão: "+ Adicionar Membro"
4. Preencha: Nome, Email, Cargo
5. Clique: "Enviar Convite"
6. ✅ Pronto! Usuário receberá email
```

### **Ver Todos os Usuários do Workspace**
```
1. Acesse: /w/[workspaceId]/settings
2. Clique na aba "Membros"
3. Você verá uma tabela com:
   - Nome
   - Email
   - Cargo
   - Status
   - Data de entrada
   - Ações (...)
```

### **Alterar Cargo de Usuário**
```
1. Na lista de membros
2. Clique no menu "..." do usuário
3. Selecione "Alterar Cargo"
4. Escolha: Admin, Member ou Guest
5. Confirme
```

### **Remover Usuário**
```
1. Na lista de membros
2. Clique no menu "..." do usuário
3. Selecione "Remover"
4. Confirme
⚠️ Ação irreversível!
```

---

## 🗂️ Estrutura Visual da Aplicação

```
http://localhost:9002
│
├─ / (Página inicial)
│  └─ Redireciona para /auth/login se não logado
│     Redireciona para /w se logado
│
├─ /auth
│  ├─ /login          → Login
│  ├─ /signup         → Cadastro
│  └─ /profile        → Perfil do usuário atual
│
├─ /w                 → LISTA DE WORKSPACES ⭐
│  │                     (Aqui você vê todos os workspaces)
│  │
│  └─ /w/[workspaceId]                    → Workspace específico
│     │
│     ├─ ?channel=[id]                    → Canal específico
│     ├─ ?dm=[userId]                     → DM com usuário
│     │
│     ├─ /settings     → GERENCIAR WORKSPACE ⭐⭐⭐
│     │  │              (AQUI VOCÊ GERENCIA USUÁRIOS!)
│     │  │
│     │  └─ Abas:
│     │     ├─ Geral        → Nome, descrição do workspace
│     │     ├─ Membros      → 👥 GERENCIAR USUÁRIOS
│     │     ├─ Permissões   → Configurar permissões
│     │     └─ Avançado     → Retenção, etc
│     │
│     ├─ /audit                           → Logs de auditoria
│     ├─ /mentions                        → Menções
│     └─ /threads                         → Threads
│
└─ /invite/[token]    → Aceitar convite
```

---

## 🎨 Identificando os Elementos na Tela

### **Header do Workspace**
```
┌─────────────────────────────────────────────────────┐
│ [≡] Workspace Name            🔍 [Busca]  👤 ⚙️  │
└─────────────────────────────────────────────────────┘
        ↑                                      ↑   ↑
     Sidebar                              Perfil Settings
                                                     ↑
                                          CLIQUE AQUI!
```

### **Sidebar do Workspace**
```
┌─────────────────┐
│ Workspace Name  │
│ ───────────────│
│ 🏠 Início       │
│ 💬 Conversas    │
│ 🔔 Atividade    │
│                 │
│ Canais          │
│ # general       │
│ # random        │
│                 │
│ Mensagens       │
│ 👤 João Silva   │
│ 👤 Maria Santos │
│                 │
│ [Configurações] │ ← OU AQUI TAMBÉM!
└─────────────────┘
```

### **Página de Settings - Aba Membros**
```
┌──────────────────────────────────────────────────┐
│  Settings > Membros                              │
├──────────────────────────────────────────────────┤
│                                                   │
│  Membros do Workspace (15)    [+ Adicionar]     │
│  ────────────────────────────────────────────    │
│                                                   │
│  🔍 [Pesquisar...]  [Todos▼] [Status▼] [Cargo▼]│
│                                                   │
│  ┌────────────────────────────────────────────┐  │
│  │ 👤 João Silva                        [...]│  │
│  │    joao@empresa.com                        │  │
│  │    🔹 Admin • ✅ Ativo • 15 Jan 2024      │  │
│  └────────────────────────────────────────────┘  │
│                                                   │
│  ┌────────────────────────────────────────────┐  │
│  │ 👤 Maria Santos                      [...]│  │
│  │    maria@empresa.com                       │  │
│  │    🔸 Member • ✅ Ativo • 20 Fev 2024     │  │
│  └────────────────────────────────────────────┘  │
│                                                   │
│  ┌────────────────────────────────────────────┐  │
│  │ 👤 Pedro Costa                       [...]│  │
│  │    pedro@empresa.com                       │  │
│  │    🔸 Member • ⏳ Pendente • Convidado    │  │
│  │    [Reenviar Convite]                      │  │
│  └────────────────────────────────────────────┘  │
│                                                   │
└──────────────────────────────────────────────────┘
```

### **Menu de Ações do Membro [...]**
```
┌─────────────────────┐
│ Alterar Cargo       │
│ ─────────────────── │
│ Ver Detalhes        │
│ Desativar           │
│ ─────────────────── │
│ ❌ Remover          │
└─────────────────────┘
```

---

## 📊 Status e Badges

### **Cargos**
- 🔹 **Admin** - Badge azul
- 🔸 **Member** - Badge cinza
- 🔶 **Guest** - Badge laranja

### **Status**
- ✅ **Ativo** - Verde
- ⏳ **Pendente** - Amarelo
- ❌ **Inativo** - Vermelho

### **Níveis de Usuário (Super Admin)**
- 👑 **Super Admin** - Acesso total
- 🛡️ **Admin** - Acesso ao workspace
- 👤 **User** - Usuário padrão

---

## 🔍 Como Encontrar um Usuário Específico

### **Método 1: Busca na Página de Membros**
```
1. /w/[workspaceId]/settings → Membros
2. Use a caixa de busca 🔍
3. Digite nome ou email
4. Resultados aparecem em tempo real
```

### **Método 2: Filtros**
```
1. /w/[workspaceId]/settings → Membros
2. Use os filtros:
   - Por Cargo: Admin, Member, Guest
   - Por Status: Ativo, Inativo, Pendente
3. Lista é filtrada automaticamente
```

### **Método 3: Supabase Dashboard**
```
1. Acesse: https://supabase.com
2. Seu projeto
3. Table Editor → "users"
4. Busque pelo email ou id
```

### **Método 4: Console do Navegador**
```
Abra o console (F12) e execute:

// Buscar usuário por email
const email = 'usuario@email.com'
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('email', email)
console.log(data)

// Ver todos os membros de um workspace
const workspaceId = 'seu-workspace-id'
const { data } = await supabase
  .from('workspace_users')
  .select('*, users(*)')
  .eq('workspace_id', workspaceId)
console.table(data)
```

---

## ✨ Atalhos de Teclado (Se Implementados)

```
Ctrl + K         → Busca global
Ctrl + Shift + K → Busca de usuários
/settings        → Ir para settings
```

---

## 🎯 Checklist de Verificação

Quando acessar a aplicação, verifique:

- [ ] Consigo ver a lista de workspaces em `/w`
- [ ] Consigo acessar um workspace específico
- [ ] Vejo o botão de configurações (⚙️) no topo
- [ ] Consigo abrir `/w/[id]/settings`
- [ ] Vejo as abas: Geral, Membros, Permissões, Avançado
- [ ] Na aba "Membros" vejo a lista de usuários
- [ ] Consigo clicar em "+ Adicionar Membro"
- [ ] Vejo o menu [...] para cada membro

Se algum item falhar, pode haver:
- Problema de permissão (precisa ser Admin)
- Erro no código (verifique o console)
- Dados não carregados (verifique Supabase)

---

## 🚨 Troubleshooting

### **Não vejo o botão de Settings**
```
Possível causa: Você não é Admin do workspace

Solução:
1. Verifique seu cargo no banco
2. OU faça login como usuário Admin
3. OU promova seu usuário no Supabase
```

### **Lista de membros vazia**
```
Possível causa: Workspace sem membros ou erro de query

Solução:
1. Verifique console do navegador (F12)
2. Verifique tabela workspace_users no Supabase
3. Tente adicionar um membro manualmente
```

### **Não consigo adicionar membro**
```
Possível causa: Erro de permissão ou configuração de email

Solução:
1. Verifique RLS no Supabase
2. Verifique configuração de email (.env)
3. Veja logs do console
```

---

## 📞 Precisa de Ajuda Imediata?

**Me pergunte:**
- "Como faço para [ação específica]?"
- "Não consigo ver [elemento]"
- "Está dando erro em [página]"

**Posso te ajudar com:**
- ✅ Código específico
- ✅ Configuração do banco
- ✅ Debug de problemas
- ✅ Implementar novas funcionalidades

---

**🎉 Aplicação rodando em: http://localhost:9002**

**📱 Comece agora:**
1. Acesse http://localhost:9002
2. Faça login
3. Vá para `/w/[seu-workspace-id]/settings`
4. Clique em "Membros"
5. Comece a gerenciar!

