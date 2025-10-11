# 👥 Guia de Gerenciamento de Usuários e Workspaces

## 📍 Onde Acessar

### **1. Interface de Administração de Workspace**
```
URL: http://localhost:9002/w/[workspaceId]/settings
```

**Como chegar:**
1. Acesse seu workspace: `http://localhost:9002/w/[workspaceId]`
2. Clique no **ícone de engrenagem (⚙️)** no canto superior
3. OU acesse diretamente: `/w/[workspaceId]/settings`

### **2. Visão Geral dos Workspaces**
```
URL: http://localhost:9002/w
```

**Como chegar:**
1. Logo após o login, você verá a lista de todos os workspaces
2. Se estiver dentro de um workspace, clique no nome dele no topo

---

## 🎯 Funcionalidades Disponíveis

### **📊 Página de Settings do Workspace**

#### **Aba "Membros" (Members)**

##### **1. Listar Membros**
- ✅ Ver todos os membros do workspace
- ✅ Ver informações: nome, email, cargo, status
- ✅ Filtrar por cargo: Admin, Membro, Convidado
- ✅ Filtrar por status: Ativo, Inativo, Pendente

**Informações exibidas:**
- Nome completo
- Email
- Cargo (Admin, Member, Guest)
- Status (Active, Pending, Inactive)
- Data de entrada
- Nível de usuário (para super admins)

##### **2. Adicionar Membros**
Clique no botão **"+ Adicionar Membro"**

**Campos:**
- Nome completo
- Email
- Cargo (Admin, Member, Guest)

**Fluxo:**
1. Preencha os dados do novo membro
2. Sistema envia convite automático por email
3. Membro recebe link de convite
4. Status fica como "Pendente" até aceitar
5. Após aceitar, status muda para "Ativo"

##### **3. Gerenciar Membros Existentes**

**Ações disponíveis para cada membro:**

| Ação | Descrição | Ícone |
|------|-----------|-------|
| **Alterar Cargo** | Promover/rebaixar entre Admin, Member, Guest | 🔄 |
| **Desativar** | Desativar temporariamente o acesso | ⏸️ |
| **Reativar** | Reativar um membro desativado | ▶️ |
| **Remover** | Remover permanentemente do workspace | 🗑️ |
| **Reenviar Convite** | Para membros pendentes | 📧 |
| **Ver Detalhes** | Ver atividade e informações | 👁️ |

##### **4. Sistema de Convites**

**Status dos convites:**
- ✅ **Ativo**: Membro aceitou o convite e está ativo
- ⏳ **Pendente**: Convite enviado, aguardando aceite
- ❌ **Inativo**: Membro foi desativado

**Gerenciar convites pendentes:**
```
1. Veja a lista de membros com status "Pendente"
2. Ações disponíveis:
   - Reenviar convite
   - Cancelar convite
   - Aprovar manualmente (para admins)
```

---

### **🔐 Permissões e Cargos**

#### **Super Admin**
- ✅ Acesso total a todos os workspaces
- ✅ Criar/editar/deletar qualquer workspace
- ✅ Gerenciar todos os usuários
- ✅ Alterar níveis de usuário
- ✅ Ver auditoria completa

#### **Admin**
- ✅ Gerenciar membros do seu workspace
- ✅ Criar/editar canais
- ✅ Enviar convites
- ✅ Alterar configurações do workspace
- ❌ Não pode deletar o workspace
- ❌ Não pode alterar níveis de usuário

#### **Member (Membro)**
- ✅ Ver membros do workspace
- ✅ Participar de canais públicos
- ✅ Criar DMs
- ❌ Não pode gerenciar membros
- ❌ Não pode alterar configurações

#### **Guest (Convidado)**
- ✅ Acesso limitado a canais específicos
- ❌ Não vê lista completa de membros
- ❌ Acesso temporário

---

## 🛠️ Como Usar (Passo a Passo)

### **1. Adicionar Novo Membro ao Workspace**

```bash
1. Acesse: /w/[workspaceId]/settings
2. Clique na aba "Membros"
3. Clique em "+ Adicionar Membro"
4. Preencha:
   - Nome: João Silva
   - Email: joao@empresa.com
   - Cargo: Member
5. Clique em "Enviar Convite"
6. ✅ Convite enviado! O usuário receberá um email
```

### **2. Ver Todos os Workspaces e Membros**

```bash
1. Acesse: /w
2. Você verá todos os workspaces (se for admin)
3. Clique em um workspace
4. Acesse Settings → Membros
5. Veja todos os membros daquele workspace
```

### **3. Alterar Cargo de um Membro**

```bash
1. Acesse: /w/[workspaceId]/settings → Membros
2. Encontre o membro na lista
3. Clique no menu "..." ao lado do nome
4. Selecione "Alterar Cargo"
5. Escolha: Admin, Member ou Guest
6. Confirme
7. ✅ Cargo atualizado!
```

### **4. Remover Membro do Workspace**

```bash
1. Acesse: /w/[workspaceId]/settings → Membros
2. Encontre o membro
3. Clique no menu "..." → "Remover"
4. Confirme a remoção
5. ⚠️ O usuário perderá acesso imediato ao workspace
```

### **5. Ver Dados no Supabase**

Para ver os dados reais armazenados:

```bash
1. Acesse: https://supabase.com
2. Faça login no seu projeto
3. Vá para "Table Editor"
4. Tabelas importantes:
   - "users" - Todos os usuários cadastrados
   - "workspace_users" - Relacionamento usuário ↔ workspace
   - "workspaces" - Todos os workspaces
   - "invites" - Convites pendentes
```

---

## 📊 Estrutura das Tabelas

### **Tabela: users**
```sql
id                  UUID (PK)
email               TEXT
display_name        TEXT
avatar_url          TEXT
user_level          TEXT (super_admin, admin, moderator, etc)
status              TEXT (online, offline, away)
created_at          TIMESTAMP
```

### **Tabela: workspace_users**
```sql
id                  UUID (PK)
user_id             UUID (FK → users)
workspace_id        UUID (FK → workspaces)
role                TEXT (admin, member, guest)
joined_at           TIMESTAMP
is_active           BOOLEAN
```

### **Tabela: workspaces**
```sql
id                  UUID (PK)
name                TEXT
logo_url            TEXT
is_active           BOOLEAN
created_at          TIMESTAMP
```

### **Tabela: invites**
```sql
id                  UUID (PK)
workspace_id        UUID (FK → workspaces)
email               TEXT
role                TEXT
token               TEXT
status              TEXT (pending, accepted, expired)
invited_by          UUID (FK → users)
invited_at          TIMESTAMP
expires_at          TIMESTAMP
```

---

## 🎨 Interface Visual

### **Localização dos Botões**

```
┌─────────────────────────────────────────────┐
│ Workspace Settings                      [X] │
├─────────────────────────────────────────────┤
│ [Geral] [Membros] [Permissões] [Avançado]  │
├─────────────────────────────────────────────┤
│                                              │
│  Membros (12)          [+ Adicionar Membro] │
│  ────────────────────────────────────────   │
│                                              │
│  🔍 [Pesquisar membros...]                  │
│                                              │
│  Filtros: [Todos ▼] [Status ▼] [Cargo ▼]   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │ 👤 João Silva                    [...│   │
│  │    joao@empresa.com                  │   │
│  │    Admin • Ativo • Entrou em Jan 2024│   │
│  └──────────────────────────────────────┘   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │ 👤 Maria Santos                  [...│   │
│  │    maria@empresa.com                 │   │
│  │    Member • Ativo • Entrou em Fev 2024│  │
│  └──────────────────────────────────────┘   │
│                                              │
└─────────────────────────────────────────────┘
```

---

## 🔍 Filtros e Busca

### **Filtrar Membros**

**Por Cargo:**
- Todos
- Admin
- Member
- Guest

**Por Status:**
- Todos
- Ativos
- Inativos
- Pendentes

**Busca:**
- Por nome
- Por email
- Por cargo

---

## 📧 Sistema de Convites

### **Como Funciona**

1. **Admin envia convite**
   ```
   POST /api/invite
   {
     "email": "usuario@email.com",
     "workspace_id": "uuid",
     "role": "member"
   }
   ```

2. **Sistema gera token único**
   ```
   Token: invite_1234567890_abc123xyz
   Link: https://seu-dominio.com/invite/[token]
   ```

3. **Email automático enviado** (via Resend)
   ```
   Para: usuario@email.com
   Assunto: Você foi convidado para [Nome do Workspace]
   
   Olá!
   
   Você foi convidado para participar do workspace [Nome].
   
   [Aceitar Convite]
   
   Este convite expira em 7 dias.
   ```

4. **Usuário aceita convite**
   - Clica no link
   - Faz cadastro/login
   - É adicionado automaticamente ao workspace

---

## 🚀 Comandos Úteis para Desenvolvimento

### **Ver usuários no console do browser:**
```javascript
// Abra o console (F12) e execute:
const { data } = await supabase
  .from('users')
  .select('*')
console.table(data)
```

### **Ver membros de um workspace:**
```javascript
const workspaceId = 'seu-workspace-id'
const { data } = await supabase
  .from('workspace_users')
  .select(`
    *,
    users(*),
    workspaces(*)
  `)
  .eq('workspace_id', workspaceId)
console.table(data)
```

### **Ver todos os workspaces:**
```javascript
const { data } = await supabase
  .from('workspaces')
  .select('*')
console.table(data)
```

---

## 💡 Dicas Importantes

### **⚠️ Atenção**

1. **Remoção de Admin**
   - Não é possível remover o último admin de um workspace
   - Sistema previne automaticamente

2. **Convites Expirados**
   - Convites expiram após 7 dias
   - É necessário reenviar um novo convite

3. **Super Admins**
   - Têm acesso a TODOS os workspaces
   - Não podem ser removidos de workspaces
   - Nível só pode ser alterado no banco de dados

4. **Email de Convite**
   - Verifique configuração do Resend em `.env`
   - Logs aparecem no console em desenvolvimento

### **✅ Boas Práticas**

1. **Sempre defina um cargo apropriado**
   - Admin: Para gestores
   - Member: Para equipe
   - Guest: Para temporários

2. **Mantenha emails atualizados**
   - Convites vão para o email cadastrado
   - Sem email válido = sem acesso

3. **Revise membros periodicamente**
   - Remova inativos
   - Atualize cargos quando necessário

4. **Use a auditoria**
   - Acompanhe mudanças
   - Veja quem fez o quê

---

## 🔗 Links Rápidos

| Funcionalidade | URL |
|---------------|-----|
| Lista de Workspaces | `/w` |
| Settings do Workspace | `/w/[id]/settings` |
| Auditoria | `/w/[id]/audit` |
| Aceitar Convite | `/invite/[token]` |
| Perfil de Usuário | `/auth/profile` |

---

## 📞 Precisa de Ajuda?

Se tiver dúvidas sobre:
- Como adicionar um usuário específico
- Problemas com permissões
- Configuração de convites
- Integração com Supabase

**Me pergunte!** Posso te ajudar com código específico ou solucionar problemas.

---

**Última atualização**: Outubro 2024  
**Status**: ✅ Sistema totalmente funcional

