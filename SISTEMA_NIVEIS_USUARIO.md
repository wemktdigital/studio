# 📊 Sistema de Níveis de Usuário - Studio

## **🎯 Visão Geral**

O sistema de "Gerenciar Níveis" permite controlar as permissões e acesso dos usuários dentro de cada workspace. Existem **6 níveis diferentes** com permissões específicas.

---

## **👑 Níveis Disponíveis**

### **1. Super Admin** 👑
- **Ícone:** Crown (Coroa)
- **Cor:** Roxo (`bg-purple-500`)
- **Descrição:** Nível máximo de acesso
- **Quem pode alterar:** Apenas outros Super Admins

**Permissões:**
- ✅ **Todas as permissões** (acesso total)
- ✅ Gerenciar outros usuários
- ✅ Alterar níveis de usuários
- ✅ Gerenciar workspace
- ✅ Criar/deletar canais
- ✅ Banir usuários
- ✅ Ver analytics
- ✅ Enviar/deletar mensagens
- ✅ Fixar mensagens

---

### **2. Admin** 🛡️
- **Ícone:** Shield (Escudo)
- **Cor:** Vermelho (`bg-red-500`)
- **Descrição:** Administrador do workspace
- **Quem pode alterar:** Super Admins

**Permissões:**
- ✅ Gerenciar usuários
- ✅ Gerenciar workspace
- ✅ Criar/deletar canais
- ✅ Banir usuários
- ✅ Ver analytics
- ✅ Enviar/deletar mensagens
- ✅ Fixar mensagens
- ❌ Alterar níveis de usuários (apenas Super Admin)

---

### **3. Manager** ⚙️
- **Ícone:** Settings (Configurações)
- **Cor:** Azul (`bg-blue-500`)
- **Descrição:** Gerente de equipe
- **Quem pode alterar:** Super Admins e Admins

**Permissões:**
- ✅ Criar canais
- ✅ Ver analytics
- ✅ Enviar mensagens
- ✅ Fixar mensagens
- ❌ Deletar canais
- ❌ Gerenciar usuários
- ❌ Banir usuários
- ❌ Gerenciar workspace

---

### **4. Member** 👤
- **Ícone:** User (Usuário)
- **Cor:** Verde (`bg-green-500`)
- **Descrição:** Membro padrão
- **Quem pode alterar:** Super Admins e Admins

**Permissões:**
- ✅ Enviar mensagens
- ❌ Criar/deletar canais
- ❌ Gerenciar usuários
- ❌ Banir usuários
- ❌ Ver analytics
- ❌ Gerenciar workspace
- ❌ Deletar mensagens
- ❌ Fixar mensagens

---

### **5. Guest** 👥
- **Ícone:** Users (Usuários)
- **Cor:** Cinza (`bg-gray-500`)
- **Descrição:** Visitante/convidado
- **Quem pode alterar:** Super Admins e Admins

**Permissões:**
- ✅ Enviar mensagens (limitado)
- ❌ Criar/deletar canais
- ❌ Gerenciar usuários
- ❌ Banir usuários
- ❌ Ver analytics
- ❌ Gerenciar workspace
- ❌ Deletar mensagens
- ❌ Fixar mensagens

---

### **6. Banned** ⚠️
- **Ícone:** AlertTriangle (Triângulo de Alerta)
- **Cor:** Preto (`bg-black`)
- **Descrição:** Usuário banido
- **Quem pode alterar:** Super Admins e Admins

**Permissões:**
- ❌ **Nenhuma permissão** (acesso bloqueado)
- ❌ Não pode enviar mensagens
- ❌ Não pode acessar canais
- ❌ Não pode fazer nada no workspace

---

## **🔧 Como Funciona o Sistema**

### **Hierarquia de Níveis:**
```
Super Admin (máximo)
    ↓
Admin
    ↓
Manager
    ↓
Member
    ↓
Guest
    ↓
Banned (mínimo)
```

### **Regras de Alteração:**
1. **Apenas Super Admins** podem alterar níveis de usuários
2. **Admins** podem gerenciar usuários mas não alterar níveis
3. **Managers** têm permissões limitadas
4. **Members** são usuários padrão
5. **Guests** têm acesso restrito
6. **Banned** são bloqueados completamente

---

## **🎨 Interface Visual**

### **No Painel "Gerenciar Níveis":**
- **Seu Nível:** Mostra o nível atual do usuário logado
- **Selecionar Usuário:** Dropdown com usuários disponíveis
- **Níveis Disponíveis:** Lista dos 6 níveis com cores e ícones

### **Indicadores Visuais:**
- **Badge colorido** ao lado do nome do usuário
- **Ícone específico** para cada nível
- **Cor de fundo** diferenciada para fácil identificação

---

## **📋 Permissões Detalhadas**

| Permissão | Super Admin | Admin | Manager | Member | Guest | Banned |
|-----------|-------------|-------|---------|--------|-------|--------|
| **Enviar Mensagens** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Criar Canais** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Deletar Canais** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Gerenciar Usuários** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Banir Usuários** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Ver Analytics** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Gerenciar Workspace** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Deletar Mensagens** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Fixar Mensagens** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Alterar Níveis** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## **🚀 Como Usar**

### **Para Alterar Nível de um Usuário:**
1. Acesse o painel "Gerenciar Níveis" (sidebar)
2. Selecione o usuário no dropdown
3. Escolha o novo nível desejado
4. Confirme a alteração

### **Para Ver Seu Nível:**
- Olhe o badge colorido ao lado do seu nome
- Consulte a seção "Seu Nível" no painel

---

## **⚠️ Importante**

- **Super Admins** têm controle total do sistema
- **Apenas Super Admins** podem alterar níveis
- **Níveis são específicos por workspace**
- **Mudanças são aplicadas imediatamente**
- **Usuários banidos perdem acesso total**

**O sistema está funcionando perfeitamente e todas as permissões estão ativas!** 🎉
