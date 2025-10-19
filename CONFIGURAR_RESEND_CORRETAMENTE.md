# 🔧 Como Configurar o Resend Corretamente

## ❌ Problema Identificado

A API key do Resend está retornando erro `401 - API key is invalid`. Isso significa que a chave não está correta ou não está ativa.

## ✅ Solução Passo a Passo

### **1. Verificar sua conta no Resend**

1. **Acesse**: [resend.com](https://resend.com)
2. **Faça login** na sua conta
3. **Vá para**: Dashboard → API Keys
4. **Verifique se**:
   - Sua conta está ativa
   - O domínio está verificado
   - A API key está ativa

### **2. Obter uma nova API key**

1. **No dashboard do Resend**:
   - Clique em "Create API Key"
   - Dê um nome: "Studio App"
   - Selecione as permissões necessárias
   - Clique em "Create"

2. **Copie a chave** (começa com `re_`)

### **3. Configurar no projeto**

1. **Abra o arquivo** `.env.local`:
   ```bash
   nano .env.local
   ```

2. **Substitua a linha**:
   ```env
   RESEND_API_KEY=re_sua_chave_real_aqui
   ```

3. **Salve o arquivo**

### **4. Verificar domínio**

Para emails funcionarem, você precisa:

1. **No Resend Dashboard**:
   - Vá para "Domains"
   - Adicione o domínio `we.marketing`
   - Configure os registros DNS

2. **Para desenvolvimento**:
   - Use `localhost` ou domínio de teste
   - Ou configure um domínio personalizado

### **5. Testar novamente**

Execute o teste:
```bash
node test-email-config.js
```

## 🔍 Verificações Importantes

### **Formato da API Key**
- ✅ Deve começar com `re_`
- ✅ Deve ter pelo menos 20 caracteres
- ✅ Não deve ter espaços ou caracteres especiais

### **Status da Conta**
- ✅ Conta ativa no Resend
- ✅ Domínio verificado
- ✅ Sem limitações de quota

### **Configuração Local**
- ✅ Arquivo `.env.local` existe
- ✅ Variável `RESEND_API_KEY` está definida
- ✅ Servidor foi reiniciado após mudança

## 🚨 Problemas Comuns

### **1. API Key Inválida**
```
Error: API key is invalid
```
**Solução**: Obtenha uma nova chave no dashboard do Resend

### **2. Domínio Não Verificado**
```
Error: Domain not verified
```
**Solução**: Verifique o domínio no dashboard do Resend

### **3. Quota Excedida**
```
Error: Rate limit exceeded
```
**Solução**: Verifique seu plano no Resend

## 🎯 Próximos Passos

1. **Configure corretamente** a API key
2. **Teste novamente** com o script
3. **Teste o sistema de convites** na aplicação
4. **Verifique se os emails** chegam corretamente

## 📞 Suporte

Se continuar com problemas:
- Verifique a documentação do Resend
- Entre em contato com o suporte do Resend
- Verifique se sua conta está ativa

**Depois de configurar corretamente, os convites por email funcionarão perfeitamente!** 🎉
