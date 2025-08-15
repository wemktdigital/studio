# **App Name**: Slack UI Showcase

## Core Features:

- App Shell: App shell with a global header, fixed left sidebar, main timeline, and collapsible right sidebar, providing a standard layout for the application.
- Workspace and Channel/DM Lists: Workspace switcher with a list of workspaces and a modal to create new workspaces. Also contains channel list items and DM list items, which can change state depending on user interaction. Provides navigation and real-time updates of the application.
- Message Composer: Message input component with auto-expanding textarea, attachments, emojis, and @mentions. Enables users to compose and send messages within channels and DMs.
- Right Panel: Right panel that can display tabs with channel/DM info, members, files, and pinned messages. This helps the user explore more information about any channel or DM they are in.
- Global Search: Modal with input and mock results for channels, messages, and users. Allows users to quickly find channels, messages, or users and navigate to them.
- Smart Suggestions: Smart Suggestion tool: Predicts and suggests relevant channels or users based on the first few characters typed in the composer, using AI to improve suggestion accuracy over time.

## Style Guidelines:

- Primary color: Dark purple (#3F3D56), drawing inspiration from Slack's color palette. This adds a sense of familiarity while maintaining a modern aesthetic.
- Background color: Light gray (#F0F0F0), offering a clean, neutral backdrop that ensures readability and focus on the content.
- Accent color: Subtle teal (#76D9D1), used sparingly to highlight key interactive elements and provide a gentle contrast against the primary and background colors.
- Body and headline font: 'Inter' (sans-serif) for a modern, clean aesthetic, ensuring excellent readability and a contemporary feel. Inter is suitable for both headlines and body text.
- Code font: 'Source Code Pro' for displaying code snippets.
- Employ a responsive layout using breakpoints for mobile (≤640px), tablet (641–1024px), and desktop (≥1025px). Adapt the sidebar to collapse on mobile, and maintain a three-column structure on desktop for optimal viewing.
- Incorporate subtle transitions and animations for UI elements like modals, sidebars, and message updates. Enhance the user experience without being distracting.