# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server with HMR at http://localhost:5173
npm run build        # Production build
npm run start        # Serve production build
npm run typecheck    # Run react-router typegen + TypeScript check
npm test             # Run tests with Vitest
npm run test:ui      # Run tests with Vitest UI
```

## Architecture

This is a **React Router v7 SSR app** (framework mode) with **Appwrite** as the backend.

**Data flow:** Routes use React Router's `loader`/`action` pattern — loaders fetch data server-side, actions handle form mutations. The `~/lib/appwrite.server.ts` module (server-only) initializes the Appwrite client from env vars and exports `users`, `databases`, `DB_ID`, and `COLLECTION_ID`.

**Routes** ([app/routes.ts](app/routes.ts)):
- `/signup` — user registration via Appwrite Users API
- `/todos` — main todo CRUD page

**Key data model** ([app/lib/types.ts](app/lib/types.ts)): `TodoItem` has `$id`, `title`, `completed`, `userId`, and optional `parentId` — enabling an **infinitely nested tree** of sub-tasks stored flat in Appwrite and reconstructed recursively in the UI.

**Rendering:** `TodoList` and `TodoItemRow` in [app/components/TodoList.tsx](app/components/TodoList.tsx) are mutually recursive components. Top-level todos (no `parentId`) are rendered first; each item filters `allTodos` to find its children. The todos route ([app/routes/todos.tsx](app/routes/todos.tsx)) has a duplicate inline copy of these components — the canonical version is in `app/components/`.

**Toggle behavior:** Toggling a todo's `completed` state recursively updates all descendants in the Appwrite action.

## Environment Variables

The app requires these env vars (used in `app/lib/appwrite.server.ts`):
- `APPWRITE_ENDPOINT`
- `APPWRITE_PROJECT_ID`
- `APPWRITE_API_KEY`
- `APPWRITE_DATABASE_ID`
- `APPWRITE_COLLECTION_ID`
