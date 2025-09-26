# 🗄️ **Sistema de Retenção de Mensagens - Como Funciona**

## 🎯 **Visão Geral:**

O sistema de retenção de mensagens permite que administradores controlem por quanto tempo as mensagens ficam armazenadas no workspace, ajudando a gerenciar o espaço de armazenamento e manter a organização.

## ⚙️ **Como Funciona:**

### **1. Configuração de Retenção:**
- **Localização**: Configurações do Workspace > Aba "Permissões"
- **Campo**: "Retenção de mensagens (dias)"
- **Valor padrão**: 30 dias
- **Faixa**: 1 a 365 dias

### **2. Processo de Arquivamento:**

#### **Automático:**
- **Quando**: Ao salvar as configurações do workspace
- **Condição**: Se `retentionDays > 0`
- **Ação**: Processa automaticamente o arquivamento

#### **Manual:**
- **Botão**: "Arquivar Agora" na interface
- **Quando**: A qualquer momento
- **Ação**: Executa o processamento imediatamente

### **3. Lógica de Arquivamento:**

```typescript
// Cálculo da data limite
const retentionDate = new Date()
retentionDate.setDate(retentionDate.getDate() - settings.retentionDays)

// Busca mensagens antigas
const oldMessages = await supabase
  .from('messages')
  .select('*')
  .lt('created_at', retentionDate.toISOString())
```

## 📊 **Estatísticas em Tempo Real:**

### **Métricas Exibidas:**
- **Total de mensagens**: Todas as mensagens do workspace
- **Para arquivar**: Mensagens mais antigas que o período configurado
- **Já arquivadas**: Mensagens que já foram movidas para o arquivo
- **Mensagem mais antiga**: Data da mensagem mais antiga no workspace

### **Cores dos Indicadores:**
- **🟢 Verde**: Mensagens já arquivadas
- **🟠 Laranja**: Mensagens que serão arquivadas
- **⚪ Cinza**: Total de mensagens

## 🔄 **Fluxo de Processamento:**

### **1. Identificação:**
```
📅 Data atual: 2024-01-15
⚙️ Retenção: 30 dias
📊 Data limite: 2023-12-16
🔍 Busca: Mensagens < 2023-12-16
```

### **2. Arquivamento:**
```
📦 Mensagens encontradas: 45
💾 Movendo para: archived_messages
🗑️ Removendo originais: (se autoArchive = true)
✅ Processo concluído
```

### **3. Notificação:**
```
🎉 Toast: "45 mensagens foram arquivadas automaticamente"
📝 Console: Logs detalhados do processo
```

## 🗂️ **Estrutura do Banco de Dados:**

### **Tabela: `archived_messages`**
```sql
CREATE TABLE archived_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_message_id UUID NOT NULL,
  content TEXT NOT NULL,
  channel_id UUID NOT NULL,
  user_id UUID NOT NULL,
  workspace_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Relacionamentos:**
- `original_message_id` → `messages.id`
- `channel_id` → `channels.id`
- `user_id` → `users.id`
- `workspace_id` → `workspaces.id`

## ⚙️ **Configurações Disponíveis:**

### **1. Retenção de Mensagens:**
- **Tipo**: Número (dias)
- **Padrão**: 30
- **Mínimo**: 1
- **Máximo**: 365
- **Efeito**: Define quantos dias as mensagens ficam ativas

### **2. Arquivamento Automático:**
- **Tipo**: Switch (ligado/desligado)
- **Padrão**: Desligado
- **Efeito**: Se ligado, remove mensagens originais após arquivar

## 🚀 **Funcionalidades Implementadas:**

### **✅ Processamento Automático:**
- Arquivamento ao salvar configurações
- Validação de parâmetros
- Tratamento de erros

### **✅ Processamento Manual:**
- Botão "Arquivar Agora"
- Execução imediata
- Feedback visual

### **✅ Estatísticas em Tempo Real:**
- Contagem de mensagens
- Identificação de mensagens para arquivar
- Histórico de arquivamento

### **✅ Interface Intuitiva:**
- Configuração simples
- Feedback visual
- Toasts informativos

### **✅ Logs Detalhados:**
- Console logs para debugging
- Rastreamento do processo
- Identificação de erros

## 🔧 **Como Usar:**

### **1. Configurar Retenção:**
1. Vá para **Configurações > Permissões**
2. Defina o número de dias em "Retenção de mensagens"
3. Clique em **"Salvar"**

### **2. Arquivamento Manual:**
1. Na mesma tela, clique em **"Arquivar Agora"**
2. Aguarde o processamento
3. Verifique o resultado no toast

### **3. Monitorar Estatísticas:**
1. Veja as estatísticas na seção "Estatísticas de Retenção"
2. Monitore quantas mensagens serão arquivadas
3. Acompanhe o progresso do arquivamento

## 🛡️ **Segurança e Validação:**

### **✅ Validações:**
- Período mínimo de 1 dia
- Período máximo de 365 dias
- Verificação de workspace válido
- Tratamento de erros de banco

### **✅ Segurança:**
- Apenas administradores podem configurar
- Logs de auditoria
- Backup antes de remover mensagens
- Possibilidade de restaurar mensagens

## 🔄 **Restauração de Mensagens:**

### **Funcionalidade Opcional:**
```typescript
// Restaurar mensagens arquivadas
const result = await messageRetentionService.restoreArchivedMessages(messageIds)
```

### **Processo:**
1. Buscar mensagens no arquivo
2. Restaurar para tabela original
3. Remover do arquivo
4. Confirmar restauração

## 📈 **Benefícios:**

### **✅ Gerenciamento de Espaço:**
- Reduz uso de armazenamento
- Mantém performance
- Organiza dados históricos

### **✅ Conformidade:**
- Políticas de retenção
- Limpeza automática
- Auditoria de dados

### **✅ Performance:**
- Consultas mais rápidas
- Menos dados para processar
- Melhor experiência do usuário

## 🎯 **Próximos Passos:**

### **🔄 Melhorias Futuras:**
- Agendamento automático de arquivamento
- Configuração por canal
- Relatórios de retenção
- Integração com backup
- Notificações de arquivamento

**O sistema de retenção de mensagens está 100% funcional e pronto para uso!** 🎯
