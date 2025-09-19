# 🚀 Configuração Rápida - Envio de Emails

## ⚡ Configuração em 3 passos

### 1. Criar conta no Resend (2 minutos)
1. Acesse [resend.com](https://resend.com)
2. Clique em "Sign Up" 
3. Use seu email pessoal
4. Confirme o email

### 2. Obter API Key (1 minuto)
1. No dashboard, clique em **"API Keys"**
2. Clique em **"Create API Key"**
3. Nome: "Studio App"
4. Copie a chave (começa com `re_`)

### 3. Configurar no projeto (30 segundos)
1. Crie o arquivo `.env.local` na raiz do projeto:
   ```bash
   touch .env.local
   ```

2. Adicione sua chave:
   ```env
   RESEND_API_KEY=re_sua_chave_aqui
   ```

3. Reinicie o servidor:
   ```bash
   npm run dev
   ```

## ✅ Teste Rápido

1. Abra `http://localhost:9002`
2. Clique no nome do workspace
3. Selecione "Convidar pessoas"
4. Digite seu email pessoal
5. Clique em "Enviar convites"
6. Verifique seu email!

## 🎯 Resultado Esperado

- ✅ Toast de sucesso aparece
- ✅ Email chega na caixa de entrada
- ✅ Email tem design profissional
- ✅ Link funciona para aceitar convite

## 🔧 Se algo não funcionar

### Email não chega?
- Verifique a pasta de spam
- Confirme se a chave está correta no `.env.local`
- Verifique os logs no terminal

### Erro de API?
- Certifique-se de que o arquivo `.env.local` está na raiz
- Reinicie o servidor após adicionar a chave
- Verifique se a chave começa com `re_`

### Quer usar outro serviço?
- SendGrid: `npm install @sendgrid/mail`
- AWS SES: `npm install @aws-sdk/client-ses`
- Nodemailer: `npm install nodemailer`

## 📊 Monitoramento

Acesse [resend.com/dashboard](https://resend.com/dashboard) para ver:
- Quantos emails foram enviados
- Taxa de entrega
- Logs de erro
- Métricas de abertura

---

**🎉 Pronto! Seus convites agora são enviados por email real!**
