# Slack UI Showcase

This is a Next.js project showcasing a complete UI for a Slack-like messaging application. It is built with a focus on a reusable component architecture, realistic states, and a professional design system. The application is currently for demonstration purposes and uses mock data for all interactions.

## Features

- **App Shell**: A familiar multi-column layout with a workspace sidebar, channel/DM list, main message timeline, and a collapsible details pane.
- **Realistic Interactions**: Navigate between workspaces, channels, and DMs. Send messages, react, and see unread indicators, all simulated on the client-side.
- **Component-Based Architecture**: Built with reusable and well-structured React components using `shadcn/ui` as a base.
- **Rich Composer**: A message composer with support for attachments, mentions, and emojis.
- **AI-Powered Suggestions**: Type `@` or `#` to get smart suggestions for users and channels, powered by Genkit.
- **Dark Mode**: A fully-functional dark mode toggle.
- **Responsive Design**: The UI adapts gracefully to different screen sizes.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.

## Modifying Mock Data

All mock data for the application (workspaces, users, channels, messages, etc.) is located in:

`src/lib/data.ts`

You can modify the arrays exported from this file to change the content displayed in the UI. The data structures and types are defined in `src/lib/types.ts`.

## Backend com Supabase

Este projeto agora inclui um backend completo com Supabase! 🚀

### ✅ O que já está implementado:
- **Configuração completa do Supabase** com TypeScript
- **Sistema de autenticação** com hooks e providers
- **Schema do banco de dados** com todas as tabelas necessárias
- **Middleware de autenticação** para proteção de rotas
- **Row Level Security (RLS)** para segurança dos dados

### 🔧 Configuração necessária:
1. **Criar projeto no Supabase** ([supabase.com](https://supabase.com))
2. **Configurar variáveis de ambiente** (ver `env.example`)
3. **Executar schema SQL** do arquivo `supabase-schema.sql`

### 📚 Documentação:
- **Backend Setup**: `docs/backend-setup.md`
- **Schema SQL**: `supabase-schema.sql`
- **Tipos TypeScript**: `src/lib/supabase/types.ts`

### 🔄 Próximos passos:
- [ ] Implementar serviços de dados (WorkspaceService, MessageService, etc.)
- [ ] Migrar componentes para usar dados reais
- [ ] Implementar sistema de mensagens em tempo real
- [ ] Adicionar upload de arquivos

### 🎯 Vantagens do Supabase:
- ✅ PostgreSQL nativo com funcionalidades avançadas
- ✅ Tempo real nativo com WebSockets
- ✅ Autenticação robusta e fácil de implementar
- ✅ Storage para upload de arquivos
- ✅ Full-Text Search integrado
- ✅ Row Level Security para controle de acesso granular
