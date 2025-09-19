# 📧 Configuração de Envio de Emails

## Resend (Recomendado)

O projeto está configurado para usar o **Resend** como serviço de envio de emails. É gratuito até 3.000 emails/mês e muito fácil de configurar.

### 1. Criar conta no Resend

1. Acesse [resend.com](https://resend.com)
2. Crie uma conta gratuita
3. Verifique seu email

### 2. Obter API Key

1. No dashboard do Resend, vá em **API Keys**
2. Clique em **Create API Key**
3. Dê um nome (ex: "Studio App")
4. Copie a chave gerada (começa com `re_`)

### 3. Configurar no projeto

1. Copie o arquivo `.env.example` para `.env.local`:
   ```bash
   cp env.example .env.local
   ```

2. Edite o arquivo `.env.local` e adicione sua chave:
   ```env
   RESEND_API_KEY=re_sua_chave_aqui
   ```

### 4. Verificar domínio (Opcional)

Para emails mais profissionais, você pode verificar seu domínio:

1. No Resend, vá em **Domains**
2. Adicione seu domínio
3. Configure os registros DNS conforme instruído
4. Atualize o `from` no arquivo `src/lib/services/email-service.ts`:
   ```typescript
   from: 'Studio <noreply@seudominio.com>'
   ```

## Alternativas

### SendGrid
```bash
npm install @sendgrid/mail
```

### AWS SES
```bash
npm install @aws-sdk/client-ses
```

### Nodemailer (SMTP)
```bash
npm install nodemailer
```

## Testando o Envio

1. Configure a chave do Resend
2. Reinicie o servidor: `npm run dev`
3. Teste enviando um convite pelo modal "Convidar pessoas"
4. Verifique os logs no console para confirmar o envio

## Troubleshooting

### Erro: "Invalid API key"
- Verifique se a chave está correta no `.env.local`
- Certifique-se de que o arquivo `.env.local` está na raiz do projeto

### Erro: "Domain not verified"
- Use um domínio verificado ou configure o domínio no Resend
- Para testes, você pode usar o domínio padrão do Resend

### Emails não chegam
- Verifique a pasta de spam
- Confirme se o email de destino está correto
- Verifique os logs do servidor para erros

## Monitoramento

O Resend oferece dashboard com:
- Estatísticas de envio
- Taxa de entrega
- Logs de emails
- Métricas de abertura

Acesse o dashboard em [resend.com/dashboard](https://resend.com/dashboard)
