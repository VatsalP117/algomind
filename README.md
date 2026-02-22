# Algomind

Algomind is a spaced repetition study tool built for software engineers. It helps you track LeetCode problems and algorithm concepts over time using a review schedule that adapts based on how well you recall each item.

The core idea is simple: instead of grinding the same problems randomly, Algomind schedules each problem for review at the right time based on your past performance — before you forget it, not after.

---

## Features

**Spaced Repetition Engine**  
When you complete a review, you rate your recall (Again / Hard / Good / Easy). The next review date is calculated using a variant of the SM-2 algorithm, adjusting the interval and ease factor per problem based on your history.

**LeetCode Auto-fetch**  
Paste a LeetCode problem URL and the backend fetches the title, difficulty, and problem description automatically. You add your own solution notes and hints on top.

**Concept Library**  
Problems are linked to concepts (e.g. Sliding Window, DP, Graphs). The concepts page lets you study the theory before reviewing the associated problems.

**Dashboard**  
Shows your current review queue size, today's streak, problems due, and charts for recall quality over the past 7/30 days and topic-level mastery across concept categories.

**Auth-aware Landing Page**  
The landing page detects if you're already signed in and directs you to the dashboard instead of the sign-up flow.

---

## Architecture

The project is split into two separate services.

### Frontend — Next.js

- **Framework**: Next.js 15 (App Router) with `output: "standalone"` for Docker deployment
- **Auth**: Clerk — handles authentication, session management, and Google OAuth. Custom sign-in/sign-up UI built with Clerk hooks (`useSignIn`, `useSignUp`) instead of the default Clerk components, with inline OTP verification on sign-up.
- **Data fetching**: TanStack Query (React Query) with a shared `useAuthQuery` hook that gates all queries behind Clerk's `isLoaded && isSignedIn` check. Intelligent cache configuration — concepts cached for 10 minutes, dashboard metrics for 2 minutes, with prefix-based invalidation after mutations.
- **UI**: shadcn/ui components, Tailwind CSS, next-themes for dark mode.
- **Routing**: Dashboard pages are under `/dashboard` with a shared sidebar layout. Auth pages are under `/(auth)` with a split-screen layout.

### Backend — Go

- **Framework**: Echo v4
- **Auth**: Clerk Go SDK verifies JWT tokens in a middleware applied to all `/api/v1` routes. Each request extracts the Clerk user ID from the session claims.
- **Database**: PostgreSQL 15 via pgx/sqlx. Connection string passed via `DATABASE_URL` environment variable.
- **Logging**: zerolog for structured JSON logs.
- **Migrations**: golang-migrate — migrations live in `/migrations` and run automatically on container startup via `entrypoint.sh`.

### API Routes

```
GET  /health

POST /api/v1/problems
GET  /api/v1/concepts
GET  /api/v1/reviews/queue
POST /api/v1/reviews/:entity_type/:entity_id/log
GET  /api/v1/leetcode/fetch
GET  /api/v1/metrics/dashboard
GET  /api/v1/metrics/recall
GET  /api/v1/metrics/mastery

```

All routes require a valid Clerk session token in the `Authorization` header.

### Database Schema

Five tables:

- `users` — synced from Clerk on first login, stores streak data
- `concepts` — global algorithm/DS concepts (admin-managed)
- `problems` — user-added problems, linked to a concept
- `review_states` — per-user SRS state for each problem/concept (interval, ease factor, next review date)
- `review_logs` — full history of every review session

Indexes on `review_states(user_id, next_review_at)` for queue queries and `review_logs(user_id, reviewed_at)` for history, plus additional indexes on `problems(user_id)` and `problems(concept_id)`.

---

## Local Development

**Prerequisites**: Node.js 20, Go 1.24, PostgreSQL 15, golang-migrate CLI.

```bash
# Backend
cd algomind-backend
cp .env.example .env       # fill in DATABASE_URL and Clerk keys
go run ./cmd/api/main.go

# Frontend
cd algomind-frontend
cp .env.example .env.local # fill in NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY etc.
npm install
npm run dev
```

Run migrations:
```bash
migrate -path ./migrations -database "$DATABASE_URL" up
```

---

## Deployment

Both services are containerized. Each has a multi-stage Dockerfile — a builder stage compiles the application and a minimal Alpine runtime image ships the binary.

The backend `entrypoint.sh` runs `migrate up` before starting the server on every deploy, so schema changes are applied automatically.

Deployed on a Linux VPS using [Dokploy](https://dokploy.com), which handles Docker builds, Traefik reverse proxying, and Let's Encrypt SSL.

**Environment variables required at build time** (baked into the Next.js bundle):
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL
NEXT_PUBLIC_CLERK_SIGN_UP_URL
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL
```

**Environment variables required at runtime** (backend):
```
DATABASE_URL
CLERK_SECRET_KEY
PORT
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React, Tailwind CSS, shadcn/ui |
| Auth | Clerk |
| Data fetching | TanStack Query |
| Backend | Go, Echo v4 |
| Database | PostgreSQL 15 |
| Migrations | golang-migrate |
| Deployment | Docker, Dokploy, Traefik |
