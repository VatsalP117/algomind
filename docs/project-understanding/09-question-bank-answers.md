# Interview Question-Bank Answers

These are reference answers to the questions in [Learning curriculum and interview question bank](./08-learning-interviews-questions.md). Strong answers may differ, but they should distinguish repository evidence from proposed improvements.

## Basic answers

1. **B1.** `algomind-frontend` builds a Next.js web application, `algomind-backend` builds/runs a Go HTTP API, and `algomind-extension` builds an unpacked Chrome MV3 extension in `dist`. PostgreSQL is required infrastructure, not a repository project.
2. **B2.** PostgreSQL is authoritative for study/application data. Clerk authenticates web users. LeetCode supplies problem metadata/content through direct and fallback paths. Kimi optionally generates hints. Only the first two participate in core identity/data ownership.
3. **B3.** Frontend routes begin under `algomind-frontend/app`; the root layout is `app/layout.tsx`. Backend process startup begins at `algomind-backend/cmd/api/main.go`, with server construction and route registration under `internal/server`.
4. **B4.** A DTO is the HTTP-facing input/output contract. A database model describes persistence-facing data. Keeping them distinct prevents accidental schema leakage and lets either contract evolve independently.
5. **B5.** A migration is an ordered schema/data change. Deterministic order ensures every environment reaches the same schema and makes dependencies between changes explicit.
6. **B6.** `src` is authored TypeScript; `dist` is generated loadable JavaScript/manifest output. Source should be reviewed as intent and `dist` as a reproducible artifact.
7. **B7.** TanStack Query should own cached server-derived state and its freshness. Zustand should own narrow client-only or ephemeral state, not duplicate authoritative API records.
8. **B8.** Authentication establishes identity. Authorization checks whether that identity may perform the requested action on the specific resource.
9. **B9.** Liveness answers whether the process is running enough to be restarted or left alone. It does not prove dependencies or request paths are ready.
10. **B10.** One Go process exposes the API and contains separated handler, DTO, model, database, middleware, and integration packages. Those internal modules deploy together, so it is a modular monolith.

## Intermediate answers

11. **I1.** A client component invokes a feature hook/mutation, which uses the API client with the Clerk token. Echo middleware authenticates it, a handler validates the DTO, repository SQL reads/writes PostgreSQL, and the response returns through the API client. The mutation then invalidates affected query keys so the UI refetches authoritative state.
12. **I2.** Clerk-authenticated web requests carry provider-issued identity tokens. The extension obtains a one-time pairing code, exchanges it for application-issued access/refresh credentials, rotates refresh tokens, and uses extension-specific middleware/routes.
13. **I3.** A foreign key only proves that the target row exists. Without a composite tenant constraint or application ownership check, user A's row can reference user B's valid row.
14. **I4.** Creating the problem and updating the capture state are separate operations. A crash or second-operation failure can leave a created problem with an unimported capture, enabling retries or contradictory state.
15. **I5.** Users make rating choices based on the displayed consequence. If the label differs from server scheduling, the interface misrepresents a core learning rule and erodes trust even when persistence is internally consistent.
16. **I6.** Startup migration is simple and keeps small deployments self-contained, but couples availability to schema changes, creates races with multiple replicas, and makes backward compatibility and rollback harder.
17. **I7.** Invalidate every query whose server result may have changed: the mutated entity, containing lists, aggregates, and due queues. Avoid broad invalidation when stable query-key relationships can identify affected data.
18. **I8.** Without a timeout, provider stalls consume goroutines, sockets, and request capacity indefinitely. Explicit deadlines also make retry and user-visible failure behavior predictable.
19. **I9.** It originates from a third-party page and can change or contain active markup. Neither a trusted brand nor extension extraction makes it safe to persist and inject into the DOM.
20. **I10.** Validate the identifier and payload, load the folder scoped to the authenticated user, reject absent/foreign folders without leaking ownership, enforce hierarchy rules, then update within the intended transaction.

## Advanced answers

21. **A1.** Accept an idempotency key or define duplicate semantics, lock the user's review row with `SELECT ... FOR UPDATE` (or use an optimistic version), calculate from the locked state and fixed clock, insert history/update schedule in one transaction, and return the committed result. A unique constraint can bind request keys to one result.
22. **A2.** Persist a job with entity ID, status, attempts, next-attempt time, and deduplication key in the same transaction that requests work. Bounded workers claim jobs atomically, call Kimi with deadlines, store results, back off retryable failures, terminally record permanent failures, emit metrics, and stop claiming while draining on shutdown.
23. **A3.** Use expand/migrate/contract: deploy additive nullable schema and code that tolerates both versions; backfill; switch reads/writes; validate; only later remove old fields. Build artifacts must declare compatible schema ranges and rollback must stay inside that range.
24. **A4.** Split only when measured independent scaling, availability isolation, ownership cadence, or technology constraints outweigh network, deployment, data consistency, and operational costs. A slow query alone calls for query/index work first.
25. **A5.** Store token-family identity and a hash/version of the current refresh token. On reuse of an already-rotated token, revoke the family/session, require re-pairing, record a security event, and avoid storing raw tokens.
26. **A6.** Define an authoritative machine-readable API contract or schema, validate Go handlers against it, generate or validate TypeScript clients, run provider-independent HTTP contract tests, and add extension compatibility tests for the supported server-version window.
27. **A7.** Inventory every path/query/body identifier; generate two tenants with related data; run a matrix of read/write/delete/cross-parent cases; assert non-disclosing denial and unchanged rows. Pair tests with SQL review and schema constraints where possible.
28. **A8.** Within rows already grouped by one concept, `COUNT(DISTINCT concept_id)` can only be zero or one. It should count distinct problems (or the intended association rows), so the current measure cannot represent mastery breadth.
29. **A9.** First bound caches and measure hit rate/memory. If replicas or revocation consistency require shared state, move only the affected cache/session data to a managed shared store with TTLs and failure semantics; keep safe read-through caches local where appropriate.
30. **A10.** Referential validity, uniqueness, nullability, and simple tenant-consistent relationships should be constrained in the database where expressible. Multi-row state transitions, provider calls, and policy-dependent scheduling require application transaction orchestration, reinforced by constraints.

## Debugging answers

31. **D1.** Compare production Clerk issuer/audience/key configuration, request origin and proxy headers, frontend API URL, token presence/expiry, middleware logs with a request ID, and clock skew. Do not disable auth as a diagnostic.
32. **D2.** Check whether tokens were persisted, whether refresh rotation completed, whether an MV3 worker lost only in-memory state, whether the refresh token was revoked/reused, and whether server/base URL changed. Inspect extension storage and the refresh response without logging raw tokens.
33. **D3.** The repository's intended order may partially complete, manual data changes may violate the state, or a delete may set the capture's problem reference to null while leaving state imported. Inspect capture state, `problem_id`, problem ownership, transaction logs, and deletion behavior.
34. **D4.** Inspect the submission response, persisted `next_review_at`, timezone/clock handling, queue predicate, query cache invalidation, and client sorting. Compare UI label assumptions with the backend's canonical calculation.
35. **D5.** If CI only builds, known correctness/static-analysis violations can ship. Lint currently has blocking React hook errors and a compiler warning, so the delivery definition must explicitly decide—and ideally fix and gate—both lint and build.
36. **D6.** The liveness route does not exercise Clerk configuration, authentication middleware, or tenant queries. Readiness and synthetic authenticated checks must cover critical dependencies separately.
37. **D7.** Correlate accepted requests with process restarts/deploys, provider calls, goroutine start/completion, and persisted hint state. Missing completion after termination supports the non-durable goroutine hypothesis; bounded job state would make it directly observable.
38. **D8.** Inspect handler validation, repository update predicates, folder lookup scoping, and schema constraints. The key test is whether both the problem and target folder are scoped to the same authenticated user.
39. **D9.** Capture slow query logs and `EXPLAIN (ANALYZE, BUFFERS)` for list/search/due-review/aggregate queries with representative cardinality. Check tenant-plus-filter/sort indexes, pagination, N+1 access, row widths, and database connection saturation.
40. **D10.** Log the request correlation ID, normalized target/problem identifier, path chosen, duration, provider status/error class, and fallback outcome. Do not log auth headers, full captured content, or provider secrets.

## Architecture answers

41. **AR1.** Preserve the monorepo, modular monolith, PostgreSQL authority, migration history, Clerk integration, and feature-oriented frontend while scale remains compatible. Improve weak seams—authorization, transactional use cases, jobs, contracts, and operations—without wholesale replacement.
42. **AR2.** Capture conversion and review submission first because each combines authorization, multiple writes, domain rules, and consistency requirements. Hint job creation is another clear orchestration boundary.
43. **AR3.** Generation is useful once contract drift cost exceeds schema/tooling cost. An OpenAPI-first or code-derived contract could generate TypeScript types while preserving Go validation. Avoid pretending shared handwritten types create runtime compatibility; still run contract tests.
44. **AR4.** A worker is justified for durable hint jobs and independent concurrency/deploy control, though it may initially be another command from the same codebase rather than a new service/repository. Measured volume determines whether it needs separate scaling.
45. **AR5.** Boundaries surround the user browser/web app, third-party page plus extension, public API, PostgreSQL, Clerk, LeetCode, and Kimi. Mark token, untrusted HTML, tenant data, provider, and administrative/deployment crossings.
46. **AR6.** Actual hosting topology, replica counts, TLS and proxy configuration, network rules, secret store, database management, backups/restores, monitoring, domains, environments, release automation, and incident ownership are absent or not verifiable.
47. **AR7.** Add current-state ADRs labeled “reconstructed” with evidence and confidence, then record new decisions prospectively. Do not invent approval dates or claim an inferred rationale was formally chosen.
48. **AR8.** It increases browser JavaScript, hydration and client-state complexity, shifts availability toward API reachability, and reduces server-render opportunities. It also makes rich authenticated interactions straightforward and keeps backend/frontend deployment boundaries clear.
49. **AR9.** Version token/session contracts, accept old and new clients during a bounded window, add server capability negotiation, rotate secrets with overlapping verification keys, ship the extension first where needed, monitor adoption, then revoke/deprecate.
50. **AR10.** Extraction is a regression if it adds network failure, distributed transactions, duplicate authorization, and operational burden without independent scaling/ownership/availability benefit—or if the data boundary remains highly coupled.

## What-if and tradeoff answers

51. **W1.** Scale stateless API replicas and PostgreSQL access paths first, make rate-limit/auth/session state safe across replicas, and keep hints on a small bounded worker pool. Do not scale a low-volume provider integration with the request tier by accident.
52. **W2.** Core problem and review flows should remain available. Persist pending/failed hint state, retry with backoff, surface provider degradation, cap queue growth, and provide retry/cancel. Decide an age after which jobs fail visibly.
53. **W3.** Pin and upgrade the SDK deliberately, validate documented issuer/audience claims, use integration tests against supported tokens, monitor auth-error rates, and retain an emergency rollback compatible with both app and configuration.
54. **W4.** Add it nullable or with a safe default without rewriting/locking excessively, deploy dual-compatible code, backfill in batches, validate, then add `NOT NULL` in a later controlled migration.
55. **W5.** Fail captures transparently instead of storing corrupt content, detect parser/contract failures separately, use fixtures and provider contract monitoring, and retain a manual URL/data entry route. Update direct and fallback paths independently.
56. **W6.** Introduce a local durable event queue and conflict/idempotency model, cache only necessary problem data, encrypt sensitive credentials, synchronize with versioned operations, and define how scheduling time and duplicate reviews reconcile.
57. **W7.** Ownership becomes membership/ACL authorization. Add workspace/share entities and role-aware joins, migrate tenant predicates deliberately, audit every route, and avoid reusing a single `user_id` assumption piecemeal.
58. **W8.** Store immutable review events with actor, timestamp, prior/new state, algorithm version, and idempotency key. Rebuild or compensate state rather than editing history silently.
59. **W9.** Use immutable artifacts, readiness, graceful shutdown, at least two compatible replicas, expand/contract migrations, health-aware traffic switching, backward-compatible configuration, and observable automated smoke/rollback.
60. **W10.** Revoke token families/server-side sessions, rotate signing or refresh secrets only if necessary, notify affected users, force re-pairing, monitor replay, and keep Clerk web sessions independent unless evidence shows broader compromise.

## Code and data answers

61. **C1.** Scheduling should depend only on prior state, rating, and a supplied clock/policy, returning new state without I/O. That makes boundary cases deterministic and testable.
62. **C2.** Inject a clock into review scheduling, expiry/pairing logic, refresh rotation tests, job scheduling, and any query boundary based on “now.” Production uses a real clock; tests use fixed time.
63. **C3.** Validate/lock the capture, ensure it is importable for the user, create or deduplicate the problem and associations, set `problem_id` plus imported state, and commit once. Hint-job creation may join the transaction if import requests it.
64. **C4.** On parent change, reject self-parenting and walk ancestors in a transaction or use a recursive CTE to reject descendants. A closure table/materialized path is justified only if hierarchy queries demand it.
65. **C5.** Define product policy explicitly. System concepts should likely be protected. Deleting a user concept should normally detach/reassign problems or require confirmation rather than silently cascade-delete valuable problems.
66. **C6.** Use representative `EXPLAIN ANALYZE` showing costly scans/sorts, measured frequency and latency, and the proposed index's improvement. Account for write/storage overhead and redundant index prefixes.
67. **C7.** Use a stable ordered key such as `(created_at, id)` or domain sort plus ID, encode the last key in an opaque cursor, and fetch the next bounded page. It avoids growing offset scans and duplicate/skip behavior under inserts.
68. **C8.** Return a stable code, safe user message, optional field details, and correlation ID. Log the internal cause/stack and request context separately with secret/privacy redaction.
69. **C9.** Retrying the same logical create must not produce duplicate problems, reviews, captures, or jobs. The server binds a scoped idempotency key to the committed result or enforces a domain uniqueness rule.
70. **C10.** Extension `dist`, lockfiles, and other generated outputs should be checked for reproducibility and meaningful dependency/artifact changes, while authored source receives semantic review. Generated output should not conceal source drift.

## Security and privacy answers

71. **S1.** A defensible order is: vulnerable internet-facing Clerk/Next dependencies because advisories include critical/high issues; missing cross-tenant folder checks because they can violate tenant isolation; unsafe HTML persistence/rendering because it creates stored-XSS risk. Exact ordering should incorporate reachability tests and deployed versions.
72. **S2.** Substrings do not respect URL authority boundaries: a malicious hostname or URL text can contain an allowed brand string. Parse the URL and compare normalized exact hostnames or controlled subdomains with the expected scheme.
73. **S3.** Short expiry, cryptographically random high entropy, single use, user/session binding, atomic consumption, request/IP/account rate limits, safe errors, audit events, and no logging of raw codes.
74. **S4.** Enforce allowed algorithm, issuer, audience, subject/session meaning, expiry, not-before/issued-at policy, token type/purpose, key identity/rotation rules, and revocation/session state.
75. **S5.** Prefer sanitizing at ingestion with a strict allowlist and treating stored content as sanitized-versioned data; also render safely at the sink as defense in depth. Never depend only on origin reputation.
76. **S6.** A configuration mistake can turn it into an authentication bypass in a reachable environment. Make it impossible in production builds/configuration, bind development servers narrowly, warn loudly, and test environment guards.
77. **S7.** Apply server/body-parser maximums, per-field string/array limits, pagination caps, content-type validation, upload/decompression limits if relevant, and rate/concurrency limits on costly routes and provider calls.
78. **S8.** Include correlation, tenant-safe internal identifiers, route, result, latency, and error class. Exclude raw tokens, pairing codes, authorization headers, secrets, full problem HTML, and unnecessary personal data; define retention/access.
79. **S9.** Frontend: a restrictive Content Security Policy, HSTS at the edge, frame protections via CSP, referrer and permissions policies, and secure cookies from providers. API: strict CORS, HSTS at the edge, content-type/nosniff, cache controls for sensitive responses, and size/rate limits.
80. **S10.** Create two users and resources. Authenticate as A while supplying B's IDs in every path/body/query mutation and relationship field; assert denial, no existence disclosure where practical, and no row change. Include indirect parent/association IDs.

## Deployment and operations answers

81. **O1.** Liveness should be a cheap in-process response that detects a wedged process. Readiness should verify configuration is loaded, the database can accept a bounded query, migrations are compatible, and required internal dependencies are initialized; optional providers may report degradation separately.
82. **O2.** Frontend install/lint/build (and tests when added), backend format/vet/test/build, extension install/typecheck/build, migration validation, dependency/security scanning with policy, secret scanning, and artifact provenance. Protect merges from failed required gates.
83. **O3.** Support overlapping old/new verification or credentials where the provider permits, deploy readers that accept both, switch writers/configuration, monitor, revoke old values, and test rollback. Never expose secret values in logs or repository files.
84. **O4.** A backup merely exists; recoverability is proven by scheduled restoration into an isolated environment, integrity/application checks, measured recovery time and data loss, and documented ownership.
85. **O5.** Start with API availability and latency for critical authenticated routes, error rates, database saturation, due-review correctness/lag, capture success, and hint job age/failure. Define user-impacting objectives and alert on burn, not every transient failure.
86. **O6.** Roll application code back while leaving an additive schema in place if old code tolerates it. Do not reverse a migration that would discard data during an incident; schedule contract cleanup after stability.
87. **O7.** Revoke the affected session/token family, detect and block replay, preserve audit evidence without raw tokens, require re-pairing, assess data access, notify as policy requires, and rotate broader keys only if compromise scope warrants it.
88. **O8.** Confirm liveness/readiness, one authenticated read and safe write path, migration/schema compatibility, frontend asset/API connectivity, extension compatibility where applicable, and critical provider degradation behavior.
89. **O9.** Traceability enables reproducible debugging, vulnerability/component inventory, rollback to a known artifact, and proof that reviewed/tested source is what runs. Record commit, build identity, dependency lock state, and deployment.
90. **O10.** Production hosts/topology, environments, traffic/TLS config, replica/autoscaling values, secret store, database management, backup/restore evidence, monitoring/alerts, deployment automation, SLOs, data retention, incident ownership, and actual production configuration remain unknown.

