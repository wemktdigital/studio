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

## Integrating with Firestore

This project is set up to make future integration with a real backend like Firestore as seamless as possible. Here's a guide to the key places where you'll need to make changes:

1.  **Data Fetching**:
    - The primary data fetching logic is located in `src/lib/data.ts` within the `getMockData` function.
    - You will need to replace the mock data retrieval in this function with real-time listeners or queries to your Firestore collections.
    - Look for `// TODO: Replace with real data fetching` comments in the page components (e.g., `src/app/w/[workspaceId]/c/[channelId]/page.tsx`) and the main layout (`src/app/w/[workspaceId]/layout.tsx`). These are the primary locations to call your new data fetching hooks.

2.  **Data Mutation**:
    - Actions like sending a message are currently handled in components like `src/components/slack/message-composer.tsx`.
    - Look for `// TODO: Implement actual message sending logic` comments. You will need to replace the `console.log` statements with calls to the Firestore SDK to add new documents to your collections.

3.  **Authentication**:
    - The current user is mocked in `src/components/slack/channel-sidebar.tsx`.
    - You will need to implement a proper authentication flow (e.g., with Firebase Authentication) and use the authenticated user's information throughout the application.

By replacing the mock data functions with your Firestore logic at these key points, you can transition the application from a UI prototype to a fully functional, real-time messaging app.
