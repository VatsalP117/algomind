# 06 — Safe Changes, Local Development, and Operations Runbook

## 1. Local development from a clean machine

### Prerequisites established by the repository

- Git.
- Node.js 20 (frontend Dockerfile); npm with lockfile support.
- Go 1.24 (`go.mod`, backend Dockerfile).
- PostgreSQL 15 (Compose image).
- Docker/Compose if using the provided DB.
- `migrate` CLI v4-compatible for Makefile/manual migration; the backend container
  includes v4.18.1.
- Chrome/Chromium for loading the unpacked extension.
- Clerk development application and keys.
- Optional Moonshot Kimi API key.

Exact supported host OS, npm version, Docker version, Clerk setup steps, and
global concept seed are **Unknown**.

### Setup

1. Clone and enter the repository.
2. Install locked dependencies:

   ```bash
   cd algomind-frontend
   npm ci
   cd ../algomind-extension
   npm ci
   cd ../algomind-backend
   go mod download
   ```

3. Start the development DB:

   ```bash
   cd algomind-backend
   docker compose up -d db
   ```

   The committed Compose DB is available at a local, development-only URL.
   Use the credentials configured by your local Compose environment.

4. Create untracked `algomind-backend/.env`:

   ```dotenv
   DATABASE_URL=postgres://<db-user>:<db-password>@localhost:5432/<db-name>?sslmode=disable
   CLERK_SECRET_KEY=<development Clerk secret>
   PORT=8080
   EXTENSION_TOKEN_SECRET=<independent development secret>
   # Optional:
   KIMI_API_KEY=<development key>
   KIMI_BASE_URL=https://api.moonshot.ai
   KIMI_MODEL=kimi-k2.5
   KIMI_TIMEOUT_SECS=120
   ```

5. Apply migrations:

   ```bash
   migrate -path migrations -database "$DATABASE_URL" up
   ```

   `make migration_up` uses the hardcoded local URL instead. There is no seed
   command. To use the product, global concepts must already exist or the user
   must create a custom concept through the UI.

6. Create untracked `algomind-frontend/.env.local`:

   ```dotenv
   NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<development publishable key>
   ```

   Clerk may require redirect URL settings in its dashboard for localhost.

7. Run two terminals:

   ```bash
   cd algomind-backend
   go run ./cmd/api
   ```

   ```bash
   cd algomind-frontend
   npm run dev
   ```

8. Build and load the extension:

   ```bash
   cd algomind-extension
   npm run build
   ```

   Open `chrome://extensions`, enable Developer mode, choose “Load unpacked,” and
   select `algomind-extension/dist`. Options can change API to
   `http://localhost:8080/api/v1` and app to `http://localhost:3000`.

### Verify

1. `curl http://localhost:8080/health` returns status OK.
2. Open frontend; sign up/sign in through development Clerk.
3. Create a concept if DB has no system concepts.
4. Add a manual problem and confirm it appears immediately in Review/Library.
5. Rate it and confirm dashboard metrics/streak change.
6. Generate a pairing code, pair extension, save from a LeetCode problem, and
   confirm inbox entry.

### Quality commands

```bash
cd algomind-backend
go test ./...
go vet ./...

cd ../algomind-frontend
npm run lint
npm run build

cd ../algomind-extension
npm run typecheck
npm run build
```

As of the investigation, frontend lint fails; see [04](04-delivery-dependencies-operations.md).

### Reset procedures

- Stop services normally.
- Development data reset is destructive. Confirm the exact Compose project and
  volume first, then use the Docker/Compose UI or reviewed command to remove only
  `algomind-backend`'s `postgres_data` volume. Do not copy a generic destructive
  volume command without verifying its target.
- Recreate DB, migrate, and manually seed/create concepts.
- Clear frontend Clerk cookies through Clerk sign-out/browser data.
- Extension “Disconnect” best-effort revokes server installation and always
  clears local session; options “Defaults restored” resets URLs.

### Common local failures

| Symptom | Likely check |
|---|---|
| backend exits immediately | required Clerk/DB env; DB container; migration |
| frontend 401 | Clerk session/token, matching backend secret/instance |
| browser CORS | frontend exactly `http://localhost:3000`; API URL |
| no concepts/form unusable | no seed exists; create custom concept/manual seed |
| extension cannot fetch localhost | dev manifest/dist contains localhost permission and option URL |
| extension pair rate limited | in-memory limiter; wait or restart only in development |
| LeetCode fetch fails | use manual entry; inspect direct/proxy logs |
| hints blank | Kimi env/timeout/logs; no retry mechanism |

## 2. How to change the project safely

### Add a frontend page

1. Decide public/server-rendered vs protected/client-data page.
2. Add `app/<route>/page.tsx`; protected routes must match `/dashboard(.*)` or
   `/admin(.*)` in `proxy.ts`, or update the matcher with a security test.
3. Compose shared shells/components; put feature logic under `features/<name>`.
4. Use `useAuthQuery` for protected reads; use existing Axios client for browser
   calls and define stable query keys.
5. Add loading, empty, error, and unauthorized states. Prefer route `loading.tsx`
   / `error.tsx` when shared.
6. Add metadata/robots policy for public pages.
7. Add component/E2E/accessibility tests; lint/build and inspect bundle if large.

Common mistake: assuming a page hidden in navigation is authorized. The proxy and
backend must enforce access independently.

### Add a backend endpoint

1. Define resource/tenant/auth model first: public, Clerk, or extension group.
2. Define request/response/error codes and idempotency.
3. Add DTO validation; include lengths and enums.
4. Put business/transaction logic in a service and persistence in a repository
   for nontrivial work. Do not deepen SQL-in-handler inconsistency.
5. Register in `server/routes.go` under the correct group.
6. Scope every resource query by authenticated user; never accept owner ID.
7. Add unit + real-PostgreSQL handler/service/authorization contract tests.
8. Update [03](03-data-api-auth-config.md) and generate/update OpenAPI once adopted.

Common mistakes: route under wrong auth group, 500 for not-found, no row-count
check, inconsistent error body, contextless external call.

### Add a database field

1. Define nullability/default/backfill and old/new app compatibility.
2. Add paired migration files; use expand/backfill/contract for production-risky
   changes.
3. Update model DB/JSON tags, repository SELECT/INSERT/UPDATE, DTO and TypeScript
   type separately—sqlx mapping can silently break if omitted.
4. Update forms/views and validation at frontend/backend/DB.
5. Test empty DB up, existing-data upgrade, rollback compatibility, and SQL mapping.
6. Deploy schema-compatible migration before code that requires it; exact platform
   sequence must be confirmed.

### Add a table

Include ownership FK/cascade policy, PK generation, timestamps, invariants,
uniqueness/idempotency, indexes driven by known queries, retention, sensitive-data
classification, and tenant-safe composite references. Add repository/service,
integration tests, backup/restore inclusion, and operations documentation.

### Change authentication

Treat `proxy.ts`, Clerk provider/pages, Axios token injection, Go middleware,
`users.id`, and extension-secret fallback as one change surface. Plan session
migration/forced logout, key overlap, identity mapping, dev bypass, CORS, E2E
negative tests, and rollback. Never rely only on frontend checks.

### Add a background job

Do not add another unmanaged goroutine for required work. Define:

- durable job row/queue and idempotent payload;
- status/attempt/next-at/error timestamps;
- bounded worker concurrency and timeouts;
- retry/backoff/dead-letter/manual retry;
- transaction/outbox relationship to source write;
- startup/shutdown drain and multi-replica claiming;
- metrics/alerts and user-visible status;
- data/privacy/retention.

For Kimi migration, create the job in the same transaction as the problem, then
have a worker claim it after commit.

### Add an external integration

Create a typed client with explicit base URL, auth, timeout, body limits, retry
policy (only idempotent operations), error taxonomy, rate limits, observability
without secrets, data-sharing/privacy record, cost budget, circuit behavior, mock
tests, and manual product fallback. Keep destination configuration startup-validated.

### Add an environment variable

Add typed config field/read/default/validation, test valid/missing/invalid values,
document secret/public/build/runtime status in [03](03-data-api-auth-config.md),
add sanitized example env, inject in deployment, and verify startup. Avoid silent
fallback for security/production-critical values. Any `NEXT_PUBLIC_*` change
requires rebuild.

### Change deployment configuration

Capture current sanitized Dokploy config first. Change infrastructure as code,
not only UI, once introduced. Build exact image digest, stage/smoke, verify
health/readiness/logs/migration, deploy with rollback threshold, and record result.
Never combine an irreversible migration and platform migration without a tested
recovery boundary.

### Upgrade a major dependency

1. Read official migration/security notes.
2. Update direct version and lockfile with the correct package manager.
3. Inspect transitive changes and audit.
4. Run unit/lint/build/typecheck/integration/E2E.
5. For Next/Clerk, explicitly test route bypasses, session redirects, token
   injection, OAuth callback, production standalone image.
6. Stage with observability; keep prior image if schema-compatible.

### Add/change a business rule

Identify all enforcement layers: form, Go validator/service, SQL constraints or
triggers, metrics, TypeScript/Go enums, UI text, migrations, and historical data.
Make one domain layer authoritative, duplicate only defensive validation, add
table-driven domain tests and end-to-end contract tests, and write/update an ADR
if it changes user-visible semantics (especially SRS).

## 3. Operational runbook

The following separates **confirmed repository commands** from platform
templates. Replace every `<...>` only after confirming Dokploy/provider behavior.

### Deploy

Confirmed build checks are listed above. Repository evidence does not expose the
actual deploy trigger. A safe platform procedure should:

1. record source SHA and current image/migration;
2. pass CI and dependency policy;
3. back up/verify restore point before risky migration;
4. build and scan images once;
5. run migration as a controlled job;
6. deploy exact digests;
7. verify liveness, readiness, authenticated smoke journeys, errors/latency;
8. monitor and record.

### Rollback

1. Stop/abort rollout through the confirmed platform mechanism.
2. Determine whether the new migration is backward compatible.
3. If compatible, redeploy previous image digest.
4. If not, choose a reviewed forward fix or restore plan. Do not reflexively run
   `make migration_down`; down SQL can discard data.
5. Verify user journeys and reconcile partially completed hints/captures.

### Migrate

Repository command:

```bash
migrate -path /app/migrations -database "$DATABASE_URL" up
```

Before production: inspect pending SQL, lock/write duration, backup, app
compatibility, concurrent migrators, disk headroom, and rollback. After: record
version and validate constraints/query behavior. Migration `000008` uses cleanup
deletes and `NOT VALID`; understand data effects.

### Backup and restore

No commands/provider are known. Required template:

1. Confirm DB host/type/version and approved tool.
2. Define encrypted backup scope, schedule, retention, offsite copy, RPO/RTO.
3. For restore drill, create isolated PostgreSQL 15, restore, apply/verify
   migration version, run integrity queries and smoke tests, record duration.
4. Never test restore over production.

### Secret rotation

Use the expectations in [03](03-data-api-auth-config.md). Confirm platform secret
update semantics and restart/rebuild requirements. Redact values from logs/tickets.
Test old/new token behavior and revoke extension installations if compromise is
suspected.

### Service restart and health verification

Platform restart command is unknown. A restart drops in-flight requests and hint
goroutines due to no graceful shutdown. After restart:

- check migration and “Connected/Starting” logs;
- `GET /health`;
- perform authenticated dashboard read;
- perform a harmless DB-backed read;
- verify error/latency rate;
- inspect hint work manually if relevant.

### Log access

Location/query command is unknown. Search structured fields:
`request_id`, `component`, `handler`, `user_id`, `problem_id`, `job_id`,
`status_code`, `duration_ms`. Do not share raw tokens, solutions, or unnecessary
personal IP/user-agent data.

### Database access and data correction

Use read-only credentials by default. Begin a transaction, select by user and
entity, check FKs/review logs/migration version, and save query/results in the
incident record. For correction:

1. reproduce and define expected invariant;
2. back up affected rows;
3. write bounded SQL with exact IDs and tenant predicate;
4. peer review and dry-run counts;
5. execute in a transaction;
6. validate and audit.

No generic correction SQL is safe enough to invent here.

### Cache clearing

There is no server cache. Restart clears API auth-user cache and rate limiters,
but should not be used as routine cache management. Browser TanStack cache resets
on page reload; Clerk and extension sessions are separate and should not be
cleared unless diagnosing auth.

### User-support investigation

Collect user-reported time/timezone, route/action, request ID, capture/problem ID,
extension version/installation name, and screenshot—never credentials. Use Clerk
ID only through authorized support lookup. Check ownership/status/logs and avoid
exposing other tenants. There is no support/admin tool, so production DB access
must be tightly controlled.

### Provider outage

- Clerk: communicate auth outage, preserve sessions if provider supports them,
  do not introduce bypass.
- PostgreSQL: stop writes/deploys, follow provider failover/restore, verify
  consistency/migration afterward.
- LeetCode/proxy: manual entry and failed-capture retry are supported.
- Kimi: disable by removing key only through controlled env/restart; problem
  creation continues with unavailable hints.
- Iris: product should continue; disable client in a tested rebuild if it causes
  runtime problems.

### Incident response skeleton

1. Declare severity/owner/channel and freeze risky deploys.
2. Preserve timestamps, SHA/image, migration, logs, provider status.
3. Contain without weakening auth.
4. Restore service using known-good artifact/forward fix.
5. Validate data and user journeys.
6. Notify affected users/regulators according to policy (**Unknown**).
7. Write root cause, contributing controls, detection gap, actions/owners/dates,
   and an ADR if architecture changes.
