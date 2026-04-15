# Copilot Spaces API Explorer

A Next.js app for testing and exploring all 28 endpoints of the Copilot Spaces REST API.

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
   The token needs `copilot` scope.

3. Run:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_GITHUB_TOKEN` | Yes | — | GitHub PAT with `copilot` scope |
| `NEXT_PUBLIC_API_BASE_URL` | No | `https://api.github.com` | API base URL |

## Testing

```bash
npm test          # run all tests
npm run build     # type-check + build
```

## API Coverage

- **Spaces** (10 endpoints): list, get, create, update, delete × user/org
- **Resources** (10 endpoints): list, get, create, update, delete × user/org
- **Collaborators** (8 endpoints): list, add, update, remove × user/org
