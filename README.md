# Copilot Spaces API Explorer

A Next.js 16 app for testing and exploring all 28 endpoints of the Copilot Spaces REST API. Built with React 19, TypeScript, and Primer design tokens.

## Setup

1. Clone and install:
   ```bash
   git clone https://github.com/lewis-mcgillion/copilot-spaces-api-explorer.git
   cd copilot-spaces-api-explorer
   npm install
   ```

2. Configure your token — copy `.env.example` to `.env.local` and set your PAT:
   ```bash
   cp .env.example .env.local
   # Edit .env.local and set NEXT_PUBLIC_GITHUB_TOKEN=ghp_your_token_here
   ```
   The token needs the `copilot` and `read:user` scope.

3. Run:
   ```bash
   npm run dev
   ```
   This builds the app for production and starts the server at [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Build + start production server (reliable, recommended) |
| `npm run dev:hot` | Start Next.js dev server with HMR (faster refresh, but may have hydration issues in some environments like Codespaces) |
| `npm run build` | Production build only |
| `npm start` | Start production server (requires `npm run build` first) |
| `npm test` | Run all Vitest component tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint |

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_GITHUB_TOKEN` | Yes | — | GitHub PAT with `copilot` scope |
| `NEXT_PUBLIC_API_BASE_URL` | No | `https://api.github.com` | API base URL |

> **Note:** After changing environment variables, you must restart the server (`npm run dev`) for changes to take effect. `NEXT_PUBLIC_*` variables are compiled at build time.

## Pages

| Route | Description |
|---|---|
| `/` | Home — welcome page with quick links |
| `/spaces` | List all your user and org spaces |
| `/spaces/new` | Create a new space (user or org owned) |
| `/spaces/[ownerType]/[ownerLogin]/[number]` | Space detail — view, edit, delete |
| `/spaces/.../resources` | Manage space resources (repositories, snippets, etc.) |
| `/spaces/.../collaborators` | Manage space collaborators |
| `/settings` | Token status, verify connection, view orgs |

## Architecture

- **Server-side auth**: `layout.tsx` is an async server component that fetches user + orgs at request time using the GitHub API, passing data as props to client components. No client-side token verification needed on page load.
- **Client-side CRUD**: API calls for creating/editing/deleting spaces, resources, and collaborators happen client-side via the `ApiClient` class.
- **API Log**: All API calls are logged in a collapsible panel in the sidebar, showing method, URL, status, and timing.
- **Proxy route**: `/api/proxy/[...path]` forwards requests to the GitHub API server-side to avoid CORS issues.

## API Coverage

All 28 Copilot Spaces REST API endpoints:

- **Spaces** (10 endpoints): list, get, create, update, delete × user/org
- **Resources** (10 endpoints): list, get, create, update, delete × user/org
- **Collaborators** (8 endpoints): list, add, update, remove × user/org

## Base Roles

When creating or editing a space:
- **User-owned spaces**: `reader` or `no_access`
- **Org-owned spaces**: `reader`, `writer`, `admin`, or `no_access`
