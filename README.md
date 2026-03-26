# Todo App

A React + TypeScript todo application built with Vite, using Mock Service Worker (MSW) to simulate a REST API entirely in the browser.

---

## Project Structure

```
todo/
├── index.html                        # Vite entry HTML (must be at root)
├── vite.config.ts                    # Vite configuration
├── tsconfig.json
├── tsconfig.node.json
├── package.json
├── public/
│   └── mockServiceWorker.js          # MSW service worker (served at root)
└── src/
    ├── main.tsx                      # App entry — starts MSW before rendering
    ├── index.css                     # Global styles + font import
    ├── App.tsx                       # Root component
    ├── features/
    │   └── todo/
    │       ├── TodoApp.tsx           # Container — all state and API logic lives here
    │       ├── TodoApp.module.css    # Styles for the container/card layout
    │       ├── Todo.tsx              # Presentational component — single todo row + delete button
    │       └── Todo.module.css       # Styles for the todo row
    ├── mocks/
    │   ├── handlers.ts               # MSW route handlers — the mock API definition
    │   └── browser.ts                # Registers handlers with the browser Service Worker
    └── services/
        └── todoApi.ts                # fetch() wrappers for GET, POST, DELETE
```

---

## Feature Breakdown

### `src/features/todo/`

This folder owns everything related to the todo feature — UI, styles, and logic — in one place. This is the **features** pattern: instead of grouping files by type (all components together, all styles together), you group them by what they do. When the feature grows or is deleted, everything is in one folder.

**`TodoApp.tsx`** is the container component. It holds all the state (`todos`, `inputValue`, `searchValue`, `loading`, `error`) and all the event handlers (`handleSubmit`, `handleDelete`). It calls `todoApi.ts` functions and passes data and callbacks down as props. No fetch logic lives in the UI components — `TodoApp` is the single source of truth.

**`TodoApp.module.css`** scopes all layout styles to this component using CSS Modules. Class names are locally scoped at build time, so `.card` here will never clash with a `.card` class anywhere else in the app.

**`Todo.tsx`** is a pure presentational component. It receives `id`, `text`, and `onDelete` as props and renders a single todo row with a delete button. It has no state and no side effects — it only displays what it's given. This makes it trivially easy to test and reuse.

**`Todo.module.css`** styles the individual todo row — the amber dot, the text, the delete button hover state.

---

### `src/mocks/`

This folder is the entire mock backend. It only activates in development and is completely invisible to the rest of the app.

#### `handlers.ts`

This is where the mock API is defined. It uses MSW's `http` object to declare route handlers — one per endpoint:

```
GET    /api/todos        → returns the in-memory todos array
POST   /api/todos        → accepts { text }, creates a new todo with a unique id, returns it
DELETE /api/todos/:id    → removes the todo matching :id from the array
```

The in-memory store is a plain array declared at module scope:

```ts
let todos: TodoItem[] = [...]
let nextId = 4;
```

This array persists for the entire browser session — state survives re-renders but resets on page refresh, exactly like a real server would behave between restarts.

Each handler receives a standard Fetch API `Request` object — not something MSW invented. This means `request.json()`, `request.headers`, and `params` all work exactly as they would in a real backend like a Cloudflare Worker or a Next.js route handler. The pattern is intentionally identical to production so that replacing MSW with a real server requires no changes to your mental model.

#### `browser.ts`

```ts
import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);
```

This file creates the Service Worker instance. `setupWorker` is imported specifically from `"msw/browser"` because MSW also supports Node.js environments (for Jest/Vitest tests) where you would import from `"msw/node"` and use `setupServer` instead. The explicit path makes the target environment unambiguous.

The `worker` object exported here is what gets called in `main.tsx` via `worker.start()`. At that point the browser registers `mockServiceWorker.js` as a real Service Worker and all subsequent `fetch()` calls are intercepted.

The separation between `browser.ts` and `handlers.ts` is intentional — in a real project you would have a `server.ts` file alongside `browser.ts` that imports the same `handlers` for use in unit tests. The mock logic is defined once and shared across both environments.

---

### `src/services/todoApi.ts`

This file contains plain `fetch()` wrappers — one function per API operation:

```ts
fetchTodos(); // GET  /api/todos
createTodo(text); // POST /api/todos
deleteTodo(id); // DELETE /api/todos/:id
```

This layer exists to keep `TodoApp.tsx` clean and to centralise the API contract in one place. If the base URL changes, or you add auth headers, or you switch from `fetch` to `axios`, you change it here and nowhere else.

Critically, `todoApi.ts` has **zero knowledge that MSW exists**. It just calls `fetch()` against `/api/todos` exactly as it would against a real server. This is the entire point — when your real backend is ready, you delete `src/mocks/` and the one `enableMocking()` call in `main.tsx`. Nothing in `todoApi.ts` or the components changes at all.

---

## How MSW Works in This App

```
browser registers mockServiceWorker.js
            ↓
worker.start() resolves
            ↓
React renders (main.tsx defers this until worker is ready)
            ↓
TodoApp mounts → useEffect fires → fetchTodos() calls fetch("/api/todos")
            ↓
MSW service worker intercepts the request before it hits the network
            ↓
handlers.ts GET handler runs → returns HttpResponse.json(todos)
            ↓
fetchTodos() receives the response as if it came from a real server
```

---

## Advantages of MSW

1. **Intercepts at the network level, not the code level** — your `fetch()` calls are completely normal. MSW sits between the browser and the network as a real Service Worker, so you are testing the actual code path your production app will use. Other mocking approaches that patch `fetch` or `axios` directly skip this layer entirely.

2. **Zero changes when the real backend is ready** — because `todoApi.ts` never knew it was talking to a mock, swapping in a real backend means deleting `src/mocks/` and one line in `main.tsx`. No refactoring, no rewiring, no removing fake data from components.

3. **Requests appear in the browser's Network tab** — because interception happens at the Service Worker level, DevTools shows real intercepted requests with status codes, headers, and response bodies. You can inspect exactly what your app is sending and receiving.

4. **Enables true parallel development** — frontend and backend teams can agree on an API contract, the frontend team mocks it with MSW, and both sides develop independently without either blocking the other.

5. **Realistic error and loading state testing** — handlers can return `500`, `404`, or introduce artificial delays to simulate slow networks. This lets you build and test error states, loading skeletons, and retry logic without needing a real failing server.

6. **Shared handlers between browser and unit tests** — the same `handlers.ts` file can be used in both the browser (via `browser.ts`) and in Vitest/Jest tests (via `server.ts` with `setupServer`). Your mock API is defined once and works everywhere.

7. **No test-specific code in production components** — there are no `if (process.env.NODE_ENV === 'test')` checks or injected mock clients anywhere in the application code. MSW is entirely opt-in and entirely external to your components.

8. **Works with any fetch-based library** — because MSW intercepts at the network level, it works transparently with `fetch`, `axios`, `react-query`, `swr`, `apollo`, or any other HTTP client. No library-specific adapter needed.

---
