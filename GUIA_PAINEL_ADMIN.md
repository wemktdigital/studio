# 👑 Guia do Painel de Administração

## 🎯 O que é?

O **Painel de Administração** é uma interface completa e visual onde Super Admins podem gerenciar **TODO O SISTEMA**:

✅ Ver todos os usuários cadastrados  
✅ Criar usuários manualmente (sem convite)  
✅ Ver todos os workspaces  
✅ Vincular usuários a workspaces  
✅ Desvincular usuários  
✅ Deletar usuários  
✅ Ver estatísticas do sistema  

---

## 📍 Como Acessar

### **URL do Painel:**
```
http://localhost:9002/admin
```

### **Acesso pelo sistema:**
```
1. Faça login como Super Admin
2. Vá para: /w (lista de workspaces)
3. Clique no botão: "👑 Painel Admin" (canto superior direito)
```

### **⚠️ IMPORTANTE:**
- Apenas **Super Admins** podem acessar
- Usuários normais serão redirecionados automaticamente
- Você verá a mensagem "Acesso Negado" se não tiver permissão

---

## 🔐 Como Se Tornar Super Admin

### **Método 1: Via Supabase Dashboard**
```sql
1. Acesse: https://supabase.com
2. Vá para seu projeto → Table Editor → "users"
3. Encontre seu usuário
4. Edite o campo: user_level = 'super_admin'
5. Salve
6. Faça logout e login novamente
```

### **Método 2: Via SQL**
```sql
-- Execute no SQL Editor do Supabase:
UPDATE users 
SET user_level = 'super_admin' 
WHERE email = 'seu-email@exemplo.com';
```

### **Método 3: Via Console do Navegador**
```javascript
// Abra o console (F12) e execute (se tiver permissões):
const email = 'seu-email@exemplo.com'
const { error } = await supabase
  .from('users')
  .update({ user_level: 'super_admin' })
  .eq('email', email)

if (!error) console.log('✅ Você é Super Admin agora!')
```

---

## 🎨 Interface do Painel

### **Estrutura Visual:**

```
┌────────────────────────────────────────────────────┐
│ 👑 Painel de Administração          [Atualizar]   │
│ [Super Admin]                                      │
├────────────────────────────────────────────────────┤
│                                                     │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐         │
│ │  50 │ │  12 │ │   5 │ │  20 │ │1000 │         │
│ │Users│ │Ativos│ │Works│ │Canais││Msgs│         │
│ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘         │
│                                                     │
│ [Usuários] [Workspaces] [Vínculos]                │
│ ─────────────────────────────────────────────      │
│                                                     │
│ [Conteúdo da aba selecionada]                     │
│                                                     │
└────────────────────────────────────────────────────┘
```

---

## 📊 Funcionalidades Detalhadas

### **1. ABA: USUÁRIOS** 👥

#### **Ver Todos os Usuários**
- Lista completa de todos os usuários do sistema
- Informações exibidas:
  - Nome
  - Email
  - Nível (Super Admin, Admin, Member, etc)
  - Status (online, offline, away)
  - Quantidade de workspaces

#### **Buscar Usuários**
```
🔍 [Pesquisar por email ou nome...]
```
- Busca em tempo real
- Filtra por nome ou email
- Resultados instantâneos

#### **Criar Usuário Manualmente**
```
Botão: [+ Criar Usuário]

Campos:
- Email * (obrigatório)
- Nome Completo * (obrigatório)
- Senha * (obrigatório, mínimo 6 caracteres)
- Nível de Acesso (Member, Admin, Moderator, Guest, Viewer)

✅ Usuário criado instantaneamente
✅ Não precisa confirmar email
✅ Já pode fazer login imediatamente
```

**Exemplo:**
```
Email: joao@empresa.com
Nome: João Silva
Senha: senha123
Nível: Member

[Criar Usuário] → ✅ Usuário criado!
```

#### **Ações por Usuário:**

Menu [...] de cada usuário:
- **Vincular a Workspace** - Adicionar a um workspace
- **Deletar Usuário** - Remover do sistema (IRREVERSÍVEL!)

---

### **2. ABA: WORKSPACES** 🏢

#### **Ver Todos os Workspaces**
- Lista completa de workspaces do sistema
- Informações exibidas:
  - Nome do workspace
  - Status (Ativo/Inativo)
  - Quantidade de membros
  - Quantidade de canais

#### **Gerenciar Workspace**
```
Botão: [Gerenciar]

Redireciona para: /w/[workspaceId]/settings
```

---

### **3. ABA: VÍNCULOS** 🔗

Esta é a aba **MAIS IMPORTANTE** para vincular usuários a workspaces!

#### **Criar Novo Vínculo**
```
Botão: [+ Criar Vínculo]

Modal abre com:

1. Selecione o Usuário:
   [João Silva (joao@empresa.com) ▼]

2. Selecione o Workspace:
   [Marketing ▼]

3. Escolha o Cargo:
   [Member ▼]  (Member, Admin, Guest)

[Vincular] → ✅ Usuário adicionado ao workspace!
```

#### **Ver Vínculos Existentes**
```
Para cada usuário com vínculos, você vê:

┌──────────────────────────────────────┐
│ João Silva                     [2]   │
│ joao@empresa.com                     │
│ ─────────────────────────────────   │
│ 🏢 Marketing    [Member]      [🔓]  │
│ 🏢 Vendas       [Admin]       [🔓]  │
└──────────────────────────────────────┘

[🔓] = Desvincular usuário deste workspace
```

#### **Desvincular Usuário**
```
Clique no botão [🔓] ao lado do workspace
Confirme a ação
✅ Usuário removido do workspace
```

---

## 🚀 Casos de Uso Práticos

### **Caso 1: Adicionar Novo Funcionário**

**Cenário:** Um novo funcionário entrou na empresa

**Passos:**
```
1. Acesse: /admin
2. Aba "Usuários"
3. Clique: [+ Criar Usuário]
4. Preencha:
   - Email: novo@empresa.com
   - Nome: Novo Funcionário
   - Senha: senha123
   - Nível: Member
5. [Criar Usuário]
6. Aba "Vínculos"
7. Clique: [+ Criar Vínculo]
8. Selecione:
   - Usuário: Novo Funcionário
   - Workspace: Marketing
   - Cargo: Member
9. [Vincular]
10. ✅ Pronto! Novo funcionário pode fazer login e acessar o workspace
```

---

### **Caso 2: Mover Usuário Entre Workspaces**

**Cenário:** João mudou de departamento (Marketing → Vendas)

**Passos:**
```
1. Acesse: /admin → Vínculos
2. Encontre: João Silva
3. Veja seus workspaces atuais:
   - Marketing [Member]
   - Vendas [Admin]
4. Clique [🔓] para desvincular de Marketing
5. Se necessário, crie novo vínculo para Vendas
6. ✅ Pronto! João agora está apenas em Vendas
```

---

### **Caso 3: Auditar Acessos**

**Cenário:** Ver quem tem acesso a quais workspaces

**Passos:**
```
1. Acesse: /admin → Vínculos
2. Role a página para ver todos os usuários
3. Cada usuário mostra seus workspaces
4. Você consegue visualizar:
   - Quem tem acesso a cada workspace
   - Qual o cargo de cada um
   - Quantos workspaces cada usuário participa
```

---

### **Caso 4: Remover Funcionário Demitido**

**Cenário:** Um funcionário saiu da empresa

**Passos:**
```
⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL!

1. Acesse: /admin → Usuários
2. Encontre o usuário
3. Clique no menu [...]
4. Selecione: [Deletar Usuário]
5. Confirme a exclusão
6. ✅ Usuário e todos os seus vínculos foram removidos
```

**O que é deletado:**
- ✅ Conta do usuário
- ✅ Todos os vínculos com workspaces
- ❌ Mensagens enviadas (permanecem no sistema)

---

## 📊 Estatísticas do Sistema

No topo do painel, você vê estatísticas em tempo real:

```
┌──────────────────────────────────────────────────┐
│ Total Usuários │ Ativos │ Workspaces │ Canais  │
│      50        │   12   │     5      │   20    │
└──────────────────────────────────────────────────┘
```

- **Total de Usuários**: Todos os usuários cadastrados
- **Usuários Ativos**: Usuários online agora
- **Workspaces**: Total de workspaces criados
- **Canais**: Total de canais em todos os workspaces
- **Mensagens**: Total de mensagens enviadas

---

## 🔒 Permissões e Segurança

### **Quem Pode Acessar**

✅ **Super Admin** - Acesso total  
❌ **Admin** - Não pode acessar (apenas seu workspace)  
❌ **Member** - Não pode acessar  
❌ **Guest** - Não pode acessar  

### **Proteções Implementadas**

1. **Verificação no Backend**
   - Toda ação verifica se é Super Admin
   - Retorna erro se não tiver permissão

2. **Proteção de Rotas**
   - URL `/admin` verifica permissões
   - Redireciona automaticamente se não autorizado

3. **RLS no Supabase**
   - Row Level Security protege os dados
   - Apenas Super Admins podem modificar

---

## 💡 Dicas e Boas Práticas

### ✅ **Faça**

1. **Use a busca** - Economiza tempo ao procurar usuários
2. **Verifique vínculos** - Antes de deletar usuários
3. **Defina cargos apropriados** - Member para maioria, Admin apenas quando necessário
4. **Documente mudanças** - Anote quem você adicionou/removeu
5. **Use senhas temporárias** - Ao criar usuários, peça para mudarem depois

### ❌ **Evite**

1. **Não delete usuários sem verificar** - Ação irreversível
2. **Não dê Super Admin sem necessidade** - Poder demais é perigoso
3. **Não compartilhe o acesso** - Apenas pessoas de confiança
4. **Não vincule a workspaces errados** - Verifique antes de confirmar

---

## 🆘 Troubleshooting

### **Problema: "Acesso Negado"**

**Causa:** Você não é Super Admin

**Solução:**
```sql
-- Execute no Supabase:
UPDATE users 
SET user_level = 'super_admin' 
WHERE email = 'seu-email@exemplo.com';
```
Faça logout e login novamente.

---

### **Problema: Não vejo o botão "Painel Admin"**

**Causa:** Sistema não reconheceu você como Super Admin

**Solução:**
1. Verifique seu nível no banco de dados
2. Faça logout e login novamente
3. Limpe o cache do navegador
4. Verifique se a query RLS está correta

---

### **Problema: Erro ao criar usuário**

**Causa:** Email já existe ou senha muito curta

**Solução:**
- Verifique se o email já está cadastrado
- Use senha com no mínimo 6 caracteres
- Verifique logs do console (F12)

---

### **Problema: Erro ao vincular usuário**

**Causa:** Vínculo já existe

**Solução:**
- Verifique na aba "Vínculos" se já existe
- Se existir, primeiro desvincule e depois recrie
- Ou apenas mude o cargo na aba Settings do workspace

---

## 🎓 Tutorial em Vídeo (Textual)

### **Do Zero ao Admin em 5 Minutos**

```
Minuto 1: Tornar-se Super Admin
─────────────────────────────────
1. Acesse Supabase
2. Table Editor → users
3. Seu usuário → user_level → 'super_admin'
4. Save

Minuto 2: Acessar o Painel
───────────────────────────
1. Login no sistema
2. /w → Botão "👑 Painel Admin"
3. Você está dentro!

Minuto 3: Criar Primeiro Usuário
──────────────────────────────────
1. Aba "Usuários"
2. [+ Criar Usuário]
3. Preencha dados
4. [Criar]
5. ✅ Usuário criado!

Minuto 4: Vincular a Workspace
────────────────────────────────
1. Aba "Vínculos"
2. [+ Criar Vínculo]
3. Selecione usuário, workspace, cargo
4. [Vincular]
5. ✅ Vinculado!

Minuto 5: Verificar
────────────────────
1. Faça login com o novo usuário
2. Veja o workspace na lista
3. Acesse e use normalmente
4. ✅ Sucesso!
```

---

## 📞 Suporte

### **Precisa de Ajuda?**

**Me pergunte:**
- "Como faço para [ação específica]?"
- "Não consigo [fazer algo]"
- "Está dando erro em [funcionalidade]"

**Posso te ajudar com:**
- ✅ Criar funcionalidades customizadas
- ✅ Debug de problemas
- ✅ Explicar o código
- ✅ Implementar melhorias

---

## 🔗 Links Rápidos

| Funcionalidade | URL |
|---------------|-----|
| **Painel Admin** | `/admin` |
| Lista de Workspaces | `/w` |
| Seu Perfil | `/auth/profile` |
| Supabase Dashboard | `https://supabase.com` |
| Guia Visual | `/admin-guide.html` |

---

## ✨ Funcionalidades Futuras

Funcionalidades que podem ser adicionadas:

- [ ] Exportar relatórios em CSV
- [ ] Gráficos de uso e atividade
- [ ] Histórico de alterações (auditoria)
- [ ] Bulk actions (ações em massa)
- [ ] Importar usuários via CSV
- [ ] Enviar emails em massa
- [ ] Dashboard com métricas avançadas
- [ ] Backup e restore de dados

**Quer alguma dessas? Me peça!**

---

## 🎉 Conclusão

Você agora tem um **Painel de Administração completo** onde pode:

✅ Gerenciar todos os usuários visualmente  
✅ Criar usuários manualmente sem convites  
✅ Vincular usuários a workspaces facilmente  
✅ Ver estatísticas do sistema em tempo real  
✅ Ter controle total do sistema  

**Acesse agora:** `http://localhost:9002/admin`

---

**Status**: ✅ **FUNCIONAL E PRONTO PARA USO**  
**Atualização**: Outubro 2024  
**Versão**: 1.0.0

