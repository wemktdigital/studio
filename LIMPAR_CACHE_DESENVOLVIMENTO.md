# 🧹 Como Limpar Cache no Desenvolvimento

## ❌ Erro: Invalid Refresh Token: Refresh Token Not Found

### **Causa:**
Tokens de autenticação antigos/inválidos armazenados no navegador.

### **✅ Solução Rápida:**

#### **Opção 1: DevTools (Mais Fácil)**
1. Abra o DevTools (F12)
2. Vá para a aba **Application** (Chrome) ou **Storage** (Firefox)
3. No menu lateral:
   - Clique em **Local Storage** → `http://localhost:9002` → **Clear All**
   - Clique em **Cookies** → `http://localhost:9002` → **Clear All**
4. Recarregue a página (F5)

#### **Opção 2: Console JavaScript**
1. Abra o console (F12)
2. Execute:
```javascript
localStorage.clear();
sessionStorage.clear();
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});
location.reload();
```

#### **Opção 3: Modo Incógnito**
1. Abra uma janela anônima/privada
2. Acesse http://localhost:9002
3. Faça login novamente

### **🔄 Após limpar o cache:**
1. Acesse: http://localhost:9002/auth/login
2. Faça login novamente
3. O erro deve desaparecer

### **🛠️ Para desenvolvedores:**
Se o erro persistir, pode ser necessário:
- Verificar configuração do Supabase
- Verificar RLS (Row Level Security)
- Implementar melhor tratamento de erros de autenticação

