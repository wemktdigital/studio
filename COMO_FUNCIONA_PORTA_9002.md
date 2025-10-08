# 🔌 Como Funciona a Porta 9002 vs talk.we.marketing

## 🎯 **Resposta Rápida:**

**SIM, a aplicação PRECISA ficar rodando na porta 9002, mas os usuários acessam diretamente `talk.we.marketing` (sem porta)!**

O Nginx faz o "proxy" (redirecionamento interno) da porta 80/443 para a 9002.

---

## 🏗️ **Arquitetura (Como Está Configurado)**

```
┌─────────────────────────────────────────────────────────────┐
│                        USUÁRIO                               │
│                            ↓                                 │
│              https://talk.we.marketing                       │
│                   (Porta 443 - HTTPS)                        │
└──────────────────────────────┬──────────────────────────────┘
                               ↓
┌──────────────────────────────────────────────────────────────┐
│                         NGINX                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Porta 80 (HTTP)  → Redirect 301 → HTTPS               │ │
│  │ Porta 443 (HTTPS) → SSL + Proxy → localhost:9002      │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────┘
                               ↓ (Proxy interno)
┌──────────────────────────────────────────────────────────────┐
│                    APLICAÇÃO NEXT.JS                         │
│              localhost:9002 (interno)                        │
│           PM2 gerencia o processo                            │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔍 **Explicação Detalhada**

### **1. Porta 9002 (Interna)**
- ✅ **Aplicação Next.js roda aqui**
- ✅ **Apenas acessível localmente** (127.0.0.1:9002)
- ✅ **Não é acessível pela internet**
- ✅ **Gerenciada pelo PM2**

```bash
# A aplicação roda assim:
pm2 start npm --name "studio" -- start

# Está escutando em:
# http://localhost:9002
```

### **2. Porta 443 (HTTPS - Externa)**
- ✅ **Nginx escuta aqui**
- ✅ **Acessível pela internet**
- ✅ **Com certificado SSL**
- ✅ **Faz proxy para porta 9002**

```nginx
# No nginx-studio.conf:
upstream studio_app {
    server 127.0.0.1:9002;  # ← Aponta para aplicação
}

server {
    listen 443 ssl http2;
    server_name talk.we.marketing;
    
    location / {
        proxy_pass http://studio_app;  # ← Redireciona para 9002
    }
}
```

### **3. Porta 80 (HTTP - Externa)**
- ✅ **Nginx também escuta aqui**
- ✅ **Redireciona automaticamente para HTTPS**
- ✅ **Ninguém acessa diretamente**

```nginx
server {
    listen 80;
    server_name talk.we.marketing;
    
    location / {
        return 301 https://$server_name$request_uri;  # ← Redirect
    }
}
```

---

## 👥 **Quem Faz O Quê?**

### **✅ Já Configurado por Vocês (Desenvolvedor):**

1. **Aplicação Next.js**
   - ✅ Configurada para rodar na porta 9002
   - ✅ Arquivo `package.json` com script de start
   - ✅ PM2 configurado para gerenciar

2. **Nginx**
   - ✅ Configuração completa em `nginx-studio.conf`
   - ✅ Proxy da porta 443 → 9002
   - ✅ Redirect HTTP → HTTPS
   - ✅ SSL configurado

3. **Documentação**
   - ✅ Todos os scripts e guias prontos
   - ✅ Instruções para o webmaster

### **🔧 O que o Webmaster Precisa Fazer:**

1. **No servidor, instalar o Nginx** (se ainda não tiver)
```bash
sudo apt update
sudo apt install nginx
```

2. **Copiar a configuração**
```bash
# Copiar nginx-studio.conf para o servidor
sudo cp nginx-studio.conf /etc/nginx/sites-available/studio

# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/studio /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

3. **Gerar certificado SSL**
```bash
sudo ./setup-https.sh
```

**Pronto! Nginx vai automaticamente fazer o proxy.**

---

## 🌐 **Como os Usuários Acessam**

### **Cenário 1: Usuário digita HTTP**
```
http://talk.we.marketing
     ↓
Nginx (Porta 80)
     ↓
301 Redirect
     ↓
https://talk.we.marketing
     ↓
Nginx (Porta 443)
     ↓
SSL + Proxy
     ↓
localhost:9002 (Next.js)
```

### **Cenário 2: Usuário digita HTTPS**
```
https://talk.we.marketing
     ↓
Nginx (Porta 443)
     ↓
SSL + Proxy
     ↓
localhost:9002 (Next.js)
```

### **Cenário 3: Usuário tenta acessar porta diretamente**
```
https://talk.we.marketing:9002
     ↓
❌ ERRO: Porta bloqueada pelo firewall
     (Apenas localhost pode acessar)
```

---

## 🔒 **Segurança**

### **Por que usar Nginx como proxy?**

1. **🛡️ Segurança**
   - Aplicação Next.js fica isolada (localhost)
   - Nginx expõe apenas HTTPS (443)
   - Porta 9002 não é acessível externamente

2. **⚡ Performance**
   - Nginx serve arquivos estáticos mais rápido
   - Cache de conteúdo
   - Compressão gzip
   - HTTP/2

3. **🔐 SSL/TLS**
   - Nginx gerencia certificados
   - Renovação automática
   - TLS 1.2/1.3

4. **🚦 Rate Limiting**
   - Proteção contra DDoS
   - Limites por rota (login, signup, api)
   - Configurado no Nginx

---

## 📝 **Configuração Atual**

### **No `nginx-studio.conf`:**

```nginx
# Aplicação roda na porta 9002 (interno)
upstream studio_app {
    server 127.0.0.1:9002;  # ← Aplicação Next.js
    keepalive 32;
}

# Nginx escuta na porta 443 (externo)
server {
    listen 443 ssl http2;
    server_name talk.we.marketing www.talk.we.marketing;
    
    # Proxy para aplicação
    location / {
        proxy_pass http://studio_app;  # ← Redireciona para 9002
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### **No `package.json`:**

```json
{
  "scripts": {
    "start": "next start -p 9002"  // ← Aplicação na 9002
  }
}
```

### **No PM2:**

```bash
pm2 start npm --name "studio" -- start
# Isso executa: next start -p 9002
```

---

## 🧪 **Como Testar**

### **1. Testar aplicação diretamente (localhost)**
```bash
# No servidor:
curl http://localhost:9002

# Deve retornar HTML da aplicação
```

### **2. Testar Nginx (externo)**
```bash
# De qualquer lugar:
curl https://talk.we.marketing

# Deve retornar o mesmo HTML
# (Nginx fez proxy para 9002)
```

### **3. Verificar se porta 9002 está bloqueada externamente**
```bash
# De fora do servidor:
curl https://talk.we.marketing:9002

# Deve dar erro (correto!)
# Porta 9002 só é acessível localmente
```

---

## ❓ **Perguntas Frequentes**

### **1. Por que não usar porta 80/443 diretamente?**
- Next.js não deve rodar como root (inseguro)
- Portas < 1024 requerem root
- Nginx é mais seguro para expor na internet

### **2. Posso mudar a porta 9002?**
- ✅ Sim! Mas precisa mudar em 3 lugares:
  1. `package.json` (script start)
  2. `nginx-studio.conf` (upstream)
  3. PM2 restart

### **3. Usuários veem a porta 9002?**
- ❌ Não! Eles acessam apenas `talk.we.marketing`
- URL nunca mostra `:9002`

### **4. E se o Nginx cair?**
- Site fica offline (usuários não conseguem acessar)
- Aplicação continua rodando na 9002 (mas inacessível)
- Solução: `sudo systemctl restart nginx`

### **5. E se a aplicação cair?**
- Nginx retorna erro 502 (Bad Gateway)
- PM2 reinicia automaticamente
- Solução: `pm2 restart studio`

---

## 🎯 **Checklist de Configuração**

### **No Código (Já Pronto ✅):**
- [x] Aplicação configurada para porta 9002
- [x] `nginx-studio.conf` com proxy configurado
- [x] PM2 configurado
- [x] Scripts de deploy prontos

### **No Servidor (Webmaster faz 🔧):**
- [ ] Nginx instalado
- [ ] Arquivo `nginx-studio.conf` copiado
- [ ] Link simbólico criado
- [ ] Nginx testado (`nginx -t`)
- [ ] Nginx recarregado
- [ ] Certificado SSL gerado
- [ ] Firewall bloqueando porta 9002 externa
- [ ] Firewall permitindo portas 80 e 443

---

## 🎉 **Conclusão**

### **Resumo:**

| Porta | Quem Acessa | Função | Visível? |
|-------|-------------|--------|----------|
| 9002 | Localhost | Next.js App | ❌ Não (interno) |
| 80 | Internet | Nginx (redirect) | ✅ Sim (redireciona) |
| 443 | Internet | Nginx (HTTPS) | ✅ Sim (principal) |

### **Para Usuários:**
- ✅ Acessam: `https://talk.we.marketing`
- ❌ Não veem: porta 9002
- ✅ Conexão: sempre HTTPS

### **Para Desenvolvedores:**
- ✅ Aplicação roda: `localhost:9002`
- ✅ Nginx faz: proxy automático
- ✅ Já configurado: tudo pronto!

### **Para Webmaster:**
- ✅ Apenas copiar: configuração do Nginx
- ✅ Gerar: certificado SSL
- ✅ Recarregar: Nginx

---

**🎯 Resposta Final: Aplicação roda na 9002, usuários acessam talk.we.marketing. Nginx faz a "ponte" automaticamente!**

*Tudo já está configurado nos arquivos. O webmaster só precisa instalar e ativar!*
