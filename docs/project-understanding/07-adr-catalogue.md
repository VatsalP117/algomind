# 07 — Architecture Decision Record Catalogue

## How to read this catalogue

No ADR files are present. Therefore there are **zero Recorded ADRs**. Entries
below are **Reconstructed ADRs**: the implemented decision is factual, while
motivation is labeled by confidence. Commit/PR dates approximate when choices
entered this repository; they do not prove when the owner first decided.

| ID | Decision | Status | Timeframe | Confidence in motivation |
|---|---|---|---|---|
| RADR-001 | Three-project monorepo | accepted | Jan–May 2026 | high |
| RADR-002 | Next.js/React client-heavy web application | accepted, upgrade urgent | Nov 2025 onward | medium |
| RADR-003 | Go/Echo modular monolith | accepted | Dec 2025 onward | high |
| RADR-004 | PostgreSQL/sqlx/SQL migrations | accepted | Dec 2025 onward | high |
| RADR-005 | Clerk for web identity and lazy local provisioning | accepted, security upgrade urgent | Dec 2025 onward | high |
| RADR-006 | Polymorphic review state/log model and custom SRS | accepted | Dec 2025–Apr 2026 | high |
| RADR-007 | TanStack Query plus small Zustand review store | accepted | Dec 2025 onward | high |
| RADR-008 | Direct LeetCode with proxy fallback | accepted, duplicate implementation | Feb 2026 onward | high |
| RADR-009 | Copy-on-write concepts and private folders | accepted, integrity remediation needed | Mar 2026 | medium |
| RADR-010 | Paired Chrome extension with rotating tokens/inbox | accepted | May 2026 | high |
| RADR-011 | Optional in-process Kimi hint generation | experimental | Mar 2026 onward | medium |
| RADR-012 | Docker + automatic startup migrations + Dokploy | accepted/partly unknown | Feb 2026 onward | medium |
| RADR-013 | Repository extraction by domain, incrementally | accepted/in progress | May 2026 | high |
| RADR-014 | Structured JSON request/error logging, no metrics | accepted with gap | Mar 2026 | high |

## RADR-001 — Three-project monorepo

**Status:** accepted. **Decision:** keep `algomind-frontend`,
`algomind-backend`, and `algomind-extension` in one Git repository with
independent language/package/build roots.

**Evidence:** commit `7435b35` “change path due to monorepo setup” (2026-01-30);
extension added by `06f8afb` (2026-05-01); root `AGENTS.md`.

**Context/problem:** coordinate one product whose web, API, and extension share
contracts but require different runtimes. **Why likely selected (strong
inference):** one owner/small team benefits from atomic visibility and simpler
issue/history management without forcing a shared build tool.

**Plausible alternatives:** separate repositories; a workspace orchestrator
(Nx/Turborepo); extension inside frontend; full-stack TypeScript.

**Consequences:** easy cross-layer tracing and atomic commits; duplicated
contracts and three toolchains; root has no unified build/test command; generated
extension output can drift. Security/cost: one checkout/CI scope exposes all
source but avoids extra infrastructure. Performance: no runtime effect. DX:
simple until CI/release coordination grows.

**Revisit when:** teams/releases become independent, cross-project CI time becomes
material, or ownership/security boundaries diverge. **Current assessment:** still
correct; add root orchestration/CI, do not split repos now.

## RADR-002 — Next.js App Router and client-heavy dashboard

**Status:** accepted; dependency upgrade urgent. **Decision:** Next.js App Router
serves static marketing/server shells, while authenticated product pages mostly
hydrate into client components using Clerk and browser API calls.

**Evidence:** `app/**`; `proxy.ts`; `app/layout.tsx`; `package.json`; Docker
standalone output. Frontend began commit `1290d0e` (2025-11-02).

**Context/problem:** need SEO marketing pages plus interactive authenticated UI.
**Motivation (possible):** Next provides both, Clerk integration, routing, and
deployable standalone output.

**Alternatives:** SPA/Vite; server-rendered Next data fetching; Remix; Go
templates; mobile app. **Trade-offs:** strong SEO/routing/ecosystem and shared
React UI; client waterfall and bundle size on dashboard; token retrieval tied to
`window.Clerk`; framework security surface and version churn. Cost depends on VPS,
not framework. Security relies on proxy plus API enforcement.

**Revisit when:** dashboard performance needs server data, offline behavior is a
goal, or framework upgrades dominate maintenance. **Assessment:** sensible, but
upgrade immediately and selectively move stable dashboard reads server-side only
when it materially improves UX.

## RADR-003 — Go/Echo modular monolith

**Status:** accepted. **Decision:** one Go/Echo API process contains all product
domains and integrations.

**Evidence:** `cmd/api/main.go`; `server/routes.go`; one backend Dockerfile;
`go.mod`. Backend began 2025-12 commits.

**Context/problem:** transactional CRUD/SRS API with modest scale. **Motivation
(strong inference):** Go offers simple deployment/concurrency/performance; Echo
provides lightweight routing/middleware. One process preserves transaction and
operational simplicity.

**Alternatives:** Next API routes, Node/Nest, Python, multiple services.
**Consequences:** efficient binary, clear DB transactions, low infrastructure
cost; frontend/backend type duplication; uneven internal layering; goroutine
temptation for background work. Security boundary is concentrated and auditable.
Horizontal scaling is possible after local-state cleanup.

**Revisit when:** measured independent scaling/ownership/compliance boundaries
exist—not merely user count. **Assessment:** correct; keep monolith and strengthen
modules/tests/worker boundary.

## RADR-004 — PostgreSQL, sqlx, and explicit SQL migrations

**Status:** accepted. **Decision:** PostgreSQL is the sole store; SQL is written
explicitly through sqlx/pgx; golang-migrate applies ordered SQL.

**Evidence:** `internal/database`; repositories/handlers; migrations; Compose.

**Context/problem:** relational ownership, SRS state/history, transactions, and
unique integrity. **Motivation (high):** PostgreSQL constraints/transactions and
SQL transparency fit the domain; sqlx avoids heavy ORM behavior.

**Alternatives:** ORM; SQLite; MySQL; managed NoSQL. **Consequences:** strong
integrity, expressive partial indexes/triggers/JSONB, straightforward debugging;
manual mapping/contract drift, PostgreSQL-specific triggers, migration discipline
required. One DB is current availability/scale boundary. Cost can stay low but
backup/operations are owner responsibility.

**Revisit when:** offline single-user app, compliance topology, or measured DB
scaling demands it. **Assessment:** excellent choice; invest in integration tests,
pool/timeouts, backups—not a new database.

## RADR-005 — Clerk web identity and lazy user provisioning

**Status:** accepted; dependency remediation urgent. **Decision:** buy web
identity/session/OAuth from Clerk; verify bearer JWTs in Go; create a minimal
local user on first API request.

**Evidence:** auth pages/provider/proxy, Axios interceptor,
`middleware/auth.go`, `users` migration.

**Context/problem:** credentials/OAuth/session security should not be built from
scratch. **Motivation (high):** faster secure auth integration; Google OAuth and
custom UI. **Alternatives:** Auth.js, Supabase Auth, Cognito, self-hosted OIDC.

**Consequences:** no password storage and simple Clerk-ID tenancy; provider
dependency/cost and SDK advisory exposure; browser and Go SDKs must agree; local
profile is intentionally sparse. Lazy provisioning avoids webhook dependence but
cannot capture profile changes/deletion automatically. Extension secret fallback
unnecessarily couples trust.

**Revisit when:** cost, enterprise SSO, data residency, or vendor outage becomes
material. **Assessment:** still reasonable; patch SDK, formalize settings and
account deletion, remove production dev bypass, decouple extension secret.

## RADR-006 — Polymorphic review entities and custom SRS

**Status:** accepted. **Decision:** one `review_states` and one `review_logs`
table serve problems and concepts through `(entity_type,entity_id)`; a custom
algorithm calculates schedules.

**Evidence:** migration `000001`; hardening `000008`; `srs/algo.go`; SRS tuning
commit `f80c35a`; HARD migration/commit `e0fdb7d`.

**Context/problem:** schedule multiple study entity types with one engine/history.
**Motivation (high):** shared queue/metrics and easy future entity types. Custom
rules allow DSA difficulty tuning beyond stock SM-2.

**Alternatives:** separate state/log tables; normal supertype entity table;
external SRS library/FSRS. **Consequences:** uniform algorithm/queue and less
duplicate schema; no normal FK, so triggers are complex and access semantics can
drift. Bespoke cognitive behavior must be owned/tested/explained. Concept flow is
currently incomplete, reducing benefit.

Security/ops/performance: triggers protect integrity but add migration/debug
complexity; indexes support due/history; deletion destroys history. **Revisit
when:** concept review is removed, another entity is added, or evidence supports
FSRS. **Assessment:** decide concept-review intent. If only problems remain,
simplify; otherwise keep and strengthen accessibility/audit tests.

## RADR-007 — TanStack Query for server state, Zustand for review session

**Status:** accepted. **Decision:** TanStack Query caches API data; a small
Zustand store holds the current in-browser review session.

**Evidence:** `components/providers.tsx`, `features/useAuthQuery.ts`, feature
hooks, `features/review/store`.

**Context/problem:** coordinate asynchronous authenticated data, invalidation,
loading, and review navigation. **Motivation (high):** Query solves remote cache;
Zustand provides simple cross-component actions without prop drilling.

**Alternatives:** React state/context; Redux; server components; one state tool.
**Consequences:** clear distinction and useful query invalidation; two mental
models, ephemeral session, manual query-key discipline. No persistent sensitive
server data cache beyond memory. Bundle/developer cost is modest.

**Revisit when:** offline/persistence/multitab sync is required or review state
fits one parent. **Assessment:** fine; test invalidation and consider reducer/local
state before expanding Zustand.

## RADR-008 — Direct LeetCode API with proxy fallback

**Status:** accepted; implementation should converge. **Decision:** try
LeetCode GraphQL directly and fall back to alfa-leetcode-api.

**Evidence:** PR
[#1](https://github.com/VatsalP117/algomind/pull/1) explicitly says reliability
through direct-first/fallback; `useFetchLeetCode.ts`; `leetcode/client.go`.

**Context/problem:** automate metadata despite unofficial/fragile upstreams.
**Alternatives:** proxy only, direct only, client scraping, manual input, licensed
dataset. **Consequences:** better availability and manual fallback; duplicated
clients/parsers, two privacy/availability dependencies, possible ToS/schema
breakage. Timeouts prevent most hangs except legacy handler. No usage cost is
evidenced.

**Revisit when:** upstream contract changes, rate limits/ToS object, or metadata
quality fails. **Assessment:** strategy makes sense; centralize one client,
strictly validate host, instrument provider outcomes, retain manual entry.

## RADR-009 — Copy-on-write system concepts and user folders

**Status:** accepted; integrity remediation required. **Decision:** shared system
concepts remain immutable to users; editing creates a per-user override; users
can add concepts and one-folder assignments.

**Evidence:** migration `000009`, handlers, commit `f0b7761`.

**Context/problem:** give useful default theory without preventing personalization.
**Motivation (medium):** copy-on-write preserves common content while making
edits private. **Alternatives:** fully global immutable concepts plus user notes;
copy every concept per user; versioned templates; tags only.

**Consequences:** storage-efficient defaults and easy reset; identity confusion
because problems are not repointed, cascade-delete surprises, folder tenant gaps,
and no version/update time. Security requires reference ownership checks.
Performance is simple. DX/UI complexity is significant.

**Revisit when:** system concepts need upgrades/versioning, collaboration, or
problem links should follow overrides. **Assessment:** product idea is sound;
formalize semantics and repair DB constraints before expansion.

## RADR-010 — Paired Chrome extension with separate rotating credentials

**Status:** accepted. **Decision:** authorize extension installations using a
short web-created code; issue local short JWT + rotating database-backed refresh
token; quick-save into a separate capture inbox.

**Evidence:** commit `06f8afb`, migration `000010`, extension/background,
extension service, publishing docs.

**Context/problem:** Clerk browser sessions are not naturally available/suitable
to a standalone extension; quick save must be low-friction without requiring full
problem data. **Motivation (high):** scoped revocable device identity and delayed
completion.

**Alternatives:** Clerk OAuth in extension, API keys, web deep link/bookmarklet,
content script posting through website. **Consequences:** strong one-use pairing,
hash-at-rest rotation/replay defense, per-device revocation; substantial auth
code/security ownership, long-lived local token, extra tables/UI/state. Inbox
separates capture availability from strict problem invariants. Operational writes
occur on every request.

**Revisit when:** Clerk offers suitable extension OAuth, additional browser/store
clients appear, or enterprise device control is needed. **Assessment:** thoughtful
design; add exhaustive tests, dedicated secret, issuer/algorithm enforcement,
heartbeat throttling, exact extension-origin CORS.

## RADR-011 — Optional Kimi hint generation in an API goroutine

**Status:** experimental. **Decision:** after problem commit, launch an in-process
goroutine that sends solution context to Kimi and writes a short hint if still
blank.

**Evidence:** commits `2e5235f`, `c254e25`, `6351b30`;
`problems/service.go`; `llm/client.go`.

**Context/problem:** AI hints should not block problem creation. **Motivation
(medium):** smallest asynchronous implementation and optional provider.
**Alternatives:** synchronous call, durable job table/worker, client generation,
no AI.

**Consequences:** responsive create and no infrastructure; lost work on crash,
unbounded concurrency, no retry/status, solution/user data sharing, ambiguous
“queued” semantics. Low infrastructure cost but provider usage cost is
uncontrolled. Security/privacy review is required.

**Revisit trigger:** before promising reliable hints, scaling replicas, or adding
any second background task. **Assessment:** acceptable prototype only; move to a
durable bounded worker.

## RADR-012 — Docker deployment and startup migrations

**Status:** Docker/entrypoint accepted; Dokploy details unknown. **Decision:** two
multi-stage Alpine images; backend startup runs migrations; README says Dokploy
and Traefik deploy on a VPS.

**Evidence:** Dockerfiles, `entrypoint.sh`, commits `79fce73`, `e08cb84`,
`7e3fa0e`, README.

**Context/problem:** reproducible deployable artifacts and automated schema
updates. **Motivation (medium):** one-command VPS platform operations.
**Alternatives:** managed serverless, Kubernetes, PaaS, separate migration job.

**Consequences:** portable small images and simple delivery; root containers,
tag-not-digest bases, migration/app coupling, unknown zero-downtime/backup/health.
VPS likely lowers cost but increases operational responsibility.

**Revisit when:** more than one replica, risky migrations, formal SLO, or
compliance. **Assessment:** containers are fine; externalize migration job,
codify Dokploy/IaC, add non-root/readiness/rollback.

## RADR-013 — Incremental repository/service extraction

**Status:** accepted/in progress. **Decision:** extract repository interfaces and
services around high-value domains without mass-rewriting all handlers.

**Evidence:** sequential commits `a1cae9e`, `253f2df`, `2fa54bd`, `6c4d88b`
explicitly move SQL from problem/review/capture logic.

**Context/problem:** SQL-heavy handlers were hard to reason about/test as workflows
grew. **Motivation (high):** isolate persistence and business orchestration while
preserving working code.

**Alternatives:** leave active record/handlers; full clean architecture rewrite;
code generation/ORM. **Consequences:** better seams and explicit transactions;
temporary inconsistency and many one-implementation interfaces without service
tests. DX improves when boundaries are honored.

**Revisit when:** adding concepts/folders/metrics behavior. **Assessment:** the
incremental approach is good. Extract when changing a domain, add tests first,
and avoid abstraction for trivial read-only SQL.

## RADR-014 — Structured logging without application metrics/tracing

**Status:** accepted with a documented gap. **Decision:** use zerolog request,
panic, error, and Kimi events with request IDs; remove Prometheus experiment.

**Evidence:** commits `7f46206`; add/revert `2bf7004`/`74e6a0e`;
`server/server.go`, observability package.

**Context/problem:** production debugging needed request/error context.
**Motivation (high for logs, unknown for metrics revert):** structured logs are
low-cost; why Prometheus was reverted is not documented.

**Alternatives:** OpenTelemetry, hosted error/metrics service, plain logs.
**Consequences:** useful correlation and latency fields; no aggregate SLOs/alerts,
mixed standard logs, no traces. Cost low but detection is reactive/manual.
Security requires log redaction/retention.

**Revisit:** before formal production SLO or multiple replicas. **Assessment:**
retain logs, standardize them, add RED/DB/job/provider metrics and error tracking;
use OpenTelemetry if traces become valuable.

## Recommended future ADRs

| Decision | Trigger | Options/evaluation/evidence | Reversibility and early-decision risk |
|---|---|---|---|
| Durable background execution | reliable hints or second job | PostgreSQL job table, managed queue, external worker; delivery guarantee, cost, ops, retry, privacy; measure volume/latency | medium; choosing distributed queue too early adds ops |
| HTML content trust/sanitization | before next release | store sanitized HTML, render sanitize, convert to Markdown/plain; fidelity, security, performance | high if retaining raw source; delaying leaves XSS risk |
| Concept semantics/versioning | global content updates/collaboration | override, notes overlay, per-user copy, versioned template; problem identity, reset, migrations | low-medium after more user data; decide before expansion |
| Concept review support | product commitment | implement full UI/access or remove polymorphism | schema simplification gets harder with more logs |
| API contract strategy | first external client/version break | OpenAPI-first, code annotations, shared schemas; Go/TS generation quality | high; delaying increases drift |
| Data deletion/audit/privacy | before public scale/compliance | hard delete, soft delete, anonymized retained logs; user promise/legal needs | low once data is deleted; must not guess |
| Production platform/IaC | next infra change | codified Dokploy, PaaS, managed services; cost, SLO, backups, skills | medium; premature migration distracts from controls |
| Auth provider lifecycle | material Clerk cost/enterprise need | stay, OIDC abstraction, migrate providers; exportability/SSO/security | low-medium; abstracting now may be waste |
| Metrics/observability stack | formal SLO/on-call | Prometheus/Grafana, OTel/vendor, platform metrics; cardinality/cost/retention | high; not deciding blocks reliable operations |
| Review concurrency/idempotency | duplicate evidence or mobile clients | row lock, optimistic version, idempotency table; UX/throughput | high; implement simple DB semantics first |
| Backup/RPO/RTO | immediately for production ownership | provider snapshots + logical dumps + offsite; recovery objectives/drills | architecture choice reversible, lost data is not |
| Extension distribution/privacy | Web Store submission | exact permissions, telemetry/no telemetry, privacy policy, token storage | store review history makes later change slower |

For each future ADR, collect current traffic/data size, incident/user feedback,
provider cost, operational skill, latency/error metrics, and a rollback
experiment. Avoid choosing queues, services, or caches solely for architectural
fashion.

