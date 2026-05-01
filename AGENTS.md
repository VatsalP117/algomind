# AGENTS.md

This is a monorepo with two projects:
- `algomind-frontend/` - Next.js 16 frontend
- `algomind-backend/` - Go backend
- `algomind-extension/` - Chrome MV3 extension

See project-specific AGENTS.md files for detailed guidance.

## Quick Commands

### Frontend
```bash
cd algomind-frontend
npm run dev          # Dev server (localhost:3000)
npm run build        # Production build
npm run lint         # Run ESLint
```

### Backend
```bash
cd algomind-backend
go run ./cmd/...     # Run server
make migration_up    # Run migrations
go vet ./...         # Lint
go fmt ./...         # Format
go test ./...        # Tests
```

### Extension
```bash
cd algomind-extension
npm run build        # Build unpacked extension into dist/
npm run typecheck    # Type-check extension source
```

## Tech Stack

| Layer | Frontend | Backend |
|-------|----------|---------|
| Framework | Next.js 16, React 19 | Echo v4 |
| Language | TypeScript | Go 1.24 |
| UI | Tailwind CSS v4, shadcn/ui | - |
| State | TanStack Query, Zustand | - |
| Database | - | PostgreSQL, pgx/v5, sqlx |
| Auth | Clerk | Clerk SDK |
| Validation | Zod | go-playground/validator |

## Project Structure
```
algomind/
├── algomind-frontend/    # Next.js App Router
│   ├── app/              # Pages
│   ├── components/        # Shared UI components
│   ├── features/          # Feature-based modules
│   ├── hooks/             # Custom hooks
│   └── lib/               # Utilities, API client
├── algomind-backend/      # Go Echo server
│   ├── cmd/               # Entry points
│   ├── internal/          # Private packages
│   │   ├── handlers/      # HTTP handlers
│   │   ├── models/        # Data models
│   │   ├── dto/           # Data transfer objects
│   │   ├── database/      # DB service
│   │   └── server/        # Server setup
│   └── migrations/         # SQL migrations
├── algomind-extension/    # Chrome MV3 package
│   ├── src/               # Background, popup, content script
│   └── dist/              # Build output for loading unpacked extension
```

## Environment Variables

### Frontend (.env)
```
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

### Backend (.env)
```
CLERK_SECRET_KEY=<key>
DATABASE_URL=<postgres connection string>
PORT=8080
```

## Notes
- No automated tests currently configured
- Frontend uses oklch color space with CSS variables
- Backend uses zerolog for structured logging
- Migrations are SQL-based in `algomind-backend/migrations/`

## Agent skills

### Issue tracker

Issues live as local markdown files under `.scratch/<feature>/` in this repo. See `docs/agents/issue-tracker.md`.

### Triage labels

Default label vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Multi-context layout. A `CONTEXT-MAP.md` at the repo root points to per-project `CONTEXT.md` files and `docs/adr/` directories. See `docs/agents/domain.md`.
