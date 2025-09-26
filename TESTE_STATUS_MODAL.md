# 🔍 Teste do Modal de Status

## Como Testar

### 1. Acesse a aplicação
- Vá para: http://localhost:9002
- Faça login na sua conta

### 2. Abra o menu do usuário
- **Clique na sua foto de perfil** no cabeçalho superior direito
- O menu dropdown deve abrir

### 3. Procure pela opção "Definir seu status"
- Deve aparecer entre "Limpar status" e "Pausar notificações"
- Ícone: ⏰ (relógio)
- Texto: "Definir seu status"

### 4. Clique em "Definir seu status"
- O modal deve abrir com:
  - Título: "Definir seu status"
  - Campo de entrada com placeholder "Qual é o seu status?"
  - Ícone de escudo no campo
  - Sugestões de status em grid
  - Seletor de duração
  - Botões "Limpar status" e "Salvar"

## Se não aparecer:

### Verifique o console do navegador
1. Abra as Ferramentas do Desenvolvedor (F12)
2. Vá para a aba "Console"
3. Procure por mensagens como:
   - `🔍 Abrindo modal de status...`
   - `🔍 Renderizando StatusModal:`
   - `🔍 Fechando modal de status...`

### Verifique se o servidor está rodando
- Terminal deve mostrar: `Ready in XXXms`
- URL deve estar acessível: http://localhost:9002

### Limpe o cache
- Ctrl+Shift+R (ou Cmd+Shift+R no Mac)
- Ou abra em aba anônima

## Estrutura do Menu Esperada:

```
┌─────────────────────────┐
│ 👤 Seu Nome             │
│ Ativo                   │
├─────────────────────────┤
│ 🛡️  Limpar status       │
│ ⏰  Definir seu status   │ ← ESTA OPÇÃO
│ 🔔 Pausar notificações  │
├─────────────────────────┤
│ 👤 Perfil               │
│ ⚙️  Preferências        │
├─────────────────────────┤
│ 🚪 Sair de Studio       │
└─────────────────────────┘
```

## Funcionalidades do Modal:

- ✅ Campo de entrada de status
- ✅ Sugestões pré-definidas
- ✅ Seletor de duração (30 min, 1 hora, etc.)
- ✅ Botão "Limpar status"
- ✅ Botão "Salvar"
- ✅ Link "Editar sugestões para Studio"

Se ainda não conseguir encontrar, me informe qual opção aparece no menu!
