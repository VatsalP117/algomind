# 05 — Security, Performance, Quality, Debt, and Unknowns

## 1. Security review

Severity describes potential impact; confidence describes evidence. “Confirmed
weakness” does not mean a working exploit was demonstrated.

### Ranked findings

| ID | Severity / confidence | Finding and evidence | Practical assessment / action |
|---|---|---|---|
| SEC-01 | **Critical / high** | Current frontend lockfile matches critical Clerk middleware protection and numerous high Next proxy/framework advisories. `package.json` pins Next 16.0.1 and permits Clerk 6.36.x; `npm audit` reported 3 critical/13 high. `proxy.ts` is the protected-page gate. | Advisory applicability is strong for route protection, but no exploit test was run. Upgrade Clerk/Next/related lockfile immediately, read advisory migration notes, run auth bypass E2E, and deploy rebuilt images. Backend API JWT checks reduce data exposure if only the page gate is bypassed, but UI/server content and any future server data remain at risk. |
| SEC-02 | **High / high** | Folder create/update/assignment accept arbitrary existing parent/folder/concept IDs without same-user/access checks. `handlers/concept_folder.go`; migration `000009` uses independent FKs. | A user who can guess IDs may create cross-tenant relationships and infer existence through different errors; cascades could affect another user's folder items. Add transactional ownership/access checks and composite DB constraints where possible; add two-user integration tests. |
| SEC-03 | **High / high** | `APP_ENV=development` + bearer `dev` bypasses Clerk using `TEST_USER_ID`; not startup-validated. `middleware/auth.go:37–57`. | Intended development feature becomes complete API impersonation if production env is wrong. Compile behind a dev build tag or require an explicit random dev secret and refuse startup when production indicators conflict. Monitor/configure it as a release invariant. |
| SEC-04 | **High / high** | HTML problem description is stored without sanitization and rendered via `dangerouslySetInnerHTML` in three components. Backend accepts arbitrary description strings. | Confirmed unsafe sink/source path; cross-user exploitability is limited by tenant isolation unless upstream LeetCode/proxy is compromised or an authorization bug supplies another user's content. Self-XSS remains possible. Sanitize on ingestion/render with an allowlist and add CSP/browser tests. |
| SEC-05 | **High / high** | No global request-body limit, route rate limit, string lengths, or pagination on `GET /problems`; metadata endpoints are authenticated but unrestricted. | Authenticated abuse or accidental large payloads can consume memory/DB/provider resources and grow storage. Add proxy+Echo limits, per-user limits, length validation, pagination, and provider-specific quotas. |
| SEC-06 | **High / medium** | Extension access token parser does not explicitly restrict valid algorithms or validate issuer; it validates signature, registered claims, audience, subject, installation. `extensions/service.go → ParseAccessToken`. | Library rejects `none` absent unsafe key, so no direct bypass is claimed. Harden with `jwt.WithValidMethods(["HS256"])`, issuer/audience options, and tests for algorithm/issuer confusion. |
| SEC-07 | **High / high** | Dependency audit found direct Axios/Next/Clerk and transitive advisories; extension has high build-time `brace-expansion`. | Upgrade and assess reachability. Axios is browser-used, making several Node adapter issues less applicable, but prototype/DoS advisories still warrant update. Establish automated policy. |
| SEC-08 | **Medium / high** | Extension refresh token is long-lived in `chrome.storage.local`; any extension compromise or sufficiently privileged local malware can read it. | Normal MV3 pattern but sensitive. Keep permissions/code narrow, prohibit remote code, consider `storage.session` for access token, rotate/revoke as implemented, document threat model. |
| SEC-09 | **Medium / high** | Extension signing secret derives from Clerk secret when missing. | Couples secrets and blast radius; Clerk rotation changes access signing. Require an independent high-entropy production secret and fail closed outside development. |
| SEC-10 | **Medium / high** | CORS accepts every `chrome-extension://` origin. `server/server.go`. | Clerk API routes still require Clerk JWT and extension routes require extension JWT, limiting direct impact. Restrict to the published extension ID(s) plus explicit dev IDs, configurable by environment. |
| SEC-11 | **Medium / high** | LeetCode host validation uses `strings.Contains(host,"leetcode.com")` in two parsers. | Accepts `evil-leetcode.com`; downstream calls remain fixed to legitimate APIs, so no SSRF was found. It weakens validation/canonical identity. Require exact host or `.leetcode.com` suffix over HTTPS. |
| SEC-12 | **Medium / high** | No security headers/CSP/HSTS/referrer/permissions policy configured in Next or Echo; proxy may supply some unknown headers. | Browser defense-in-depth absent in repo. Add and test headers at one documented layer; CSP is especially valuable around HTML sinks/analytics/Clerk. |
| SEC-13 | **Medium / high** | Logs include full request URI, user ID, IP, agent; Kimi errors include provider body previews. | Query strings may contain LeetCode URLs; IDs/IPs are personal/operational data. No tokens are intentionally logged. Define redaction/retention/access policy and avoid future sensitive query/body logging. |
| SEC-14 | **Medium / high** | Rate limiter trusts `c.RealIP()` but proxy trust configuration is absent; limiter is per-process and unbounded map. | Spoofing/evasion and memory growth depend on Echo/proxy headers. Configure trusted proxy hops, bounded TTL store, shared limiter for multi-replica production. |
| SEC-15 | **Medium / high** | Review entity type is a free path parameter; DB trigger checks concept existence, not visibility. | A user with or able to create a review state for a private concept could review it; normal API has no concept-state creation endpoint, reducing reachability. Enforce enum and concept access in service/trigger. |
| SEC-16 | **Medium / high** | Docker Compose/Makefile contain hardcoded DB credentials and expose port 5432. | Clearly development values, not a leaked production secret. Avoid reuse, bind locally where possible, use `.env.example`, and label as nonproduction. |
| SEC-17 | **Medium / high** | No evidence of DB least privilege, encrypted backups, secret manager, CI permissions, container non-root user, image scanning, or SBOM. | Operational controls are unknown, not proven absent in production. Verify and codify. Both images currently run as root by default. |
| SEC-18 | **Low / high** | Pairing codes use modulo reduction from random byte to 32-character alphabet. | Because 256 divides evenly by 32, there is no modulo bias here. Entropy is 40 bits and limiter/TTL/one-use protect it; document and monitor attempts. |

### Threat-boundary summary

- SQL injection risk is low in inspected code because queries use placeholders;
  dynamic SQL fragments are static.
- No file upload/path traversal surface exists.
- No user-controlled outbound destination was found in backend LeetCode calls;
  Kimi base URL is operator-controlled, so a malicious environment can cause SSRF
  by definition but already controls the deployment.
- CSRF risk on the Go API is low due to bearer headers; Next/Clerk framework
  advisory status still matters.
- Tenant isolation is strong for problems/captures/installations and weak for
  folder references.
- No webhook verification surface exists.
- Password/cookie/MFA protections are Clerk-owned and **Unknown**.
- No billing/payment/financial data exists in current schema.
- Personal data: Clerk ID, IP/user-agent logs, study content/solutions, install
  metadata, analytics. There is no privacy/export/deletion/retention workflow.

## 2. Performance and scalability

### Current likely bottlenecks

1. PostgreSQL is the single durable dependency and all dynamic routes depend on it.
2. Topic-mastery aggregation scans/join-aggregates growing problems/states/logs.
3. Unpaginated library fetch and browser-side filtering scale with all user
   problems.
4. Synchronous LeetCode calls hold API requests up to client/network timeout.
5. Every extension request performs an installation lookup and heartbeat write.
6. In-process hint goroutines have no concurrency cap and can create bursts of
   outbound calls and DB writes.
7. No DB pool limits mean defaults may be wrong for a small PostgreSQL plan or
   many replicas.
8. Client-heavy dashboard/charts/icons affect startup on low-end/mobile devices.

### Index assessment

Useful indexes exist for problem owner/concept, due queue, log user/time/entity,
concept owner, folder items, capture identity/state/time, and extension active
records. Missing/possible candidates must be justified with production plans:

- `review_logs(user_id, reviewed_at, rating)` might help recall but current index
  already starts correctly.
- metrics mastery joins use entity IDs and user; existing composite entity log
  index is appropriate.
- folder ownership/reference consistency needs constraints more than indexes.
- cleanup queries by entity type/id omit user and can scan; the entity composite
  index begins with user, so a separate `(entity_type,entity_id)` may help deletes
  at scale.

Use `EXPLAIN (ANALYZE, BUFFERS)` on production-like data before adding indexes.

### Scaling stages (estimates, not measurements)

| Scale | Likely behavior and first risks | Appropriate response |
|---|---|---|
| few users | architecture is ample; third-party/config/dependency failures dominate | fix security, tests, backups, observability; avoid distribution |
| hundreds active | DB still adequate; provider latency, goroutine bursts, library payloads, log volume visible | pool/timeouts, pagination, job table/worker, basic metrics/alerts |
| thousands active | mastery aggregates and heartbeat writes pressure DB; per-process rate limits inconsistent; deploy drops jobs | cache/precompute metrics, durable job worker, shared rate limit, replicas, graceful shutdown, DB tuning |
| much larger | single primary and synchronous architecture become limits; analytics/log/retention cost matters | read replicas/precomputed analytics where evidenced, partition/archive logs, queue external work, capacity test; do not split domain services without measured need |

The API is horizontally scalable for core request state because sessions live in
Clerk/DB, but local auth cache/limiters and goroutines make replicas behaviorally
inconsistent. PostgreSQL and shared external quotas remain single coordination
points.

### Performance correctness issues

- Mastery `problem_count` is 0/1 due to `COUNT(DISTINCT ps.concept_id)`.
- `progressPercent` uses current index, so the first card displays 0%; may be
  intended “completed” progress.
- UI review interval subtitles diverge from SRS and can mislead decisions.
- Auth user `sync.Map` grows forever per process.
- Rate-limit maps grow forever.
- `last_seen_at` write on every extension request creates unnecessary write
  amplification; throttle heartbeat updates.
- Static public pages are strong; Next build confirms 19 generated routes.

## 3. Code-quality and maintainability assessment

### Strong choices

- Small modular monolith fits current product/scale.
- Clear composition root in `server/routes.go`.
- Transactions protect the highest-value multi-write operations.
- Parameterized SQL and database integrity triggers/constraints are meaningful.
- SRS is isolated as a pure, well-tested package.
- External problem deduplication is backed by unique indexes, not only code.
- Extension refresh rotation/replay revocation and hashed token storage are
  thoughtful security design.
- Chrome runtime has no third-party runtime packages and content script is narrow.
- Feature folders, shared API client, query keys, and invalidation are learnable.
- Request IDs and structured request/error logs are a solid observability base.
- Git history shows deliberate repository extraction rather than needless
  microservice splitting.

### Accidental complexity / weak boundaries

- Layering is inconsistent: repositories for some domains, SQL handlers for
  others, raw SQL in extension service.
- LeetCode logic is duplicated in handler and client, with different validation
  and timeout behavior.
- API types are duplicated Go↔TypeScript with no schema.
- Problem form is a large component with fetch, mapping, preview, validation,
  capture prefill, and UI concerns.
- Concept manager was extracted, but remains a deep stateful coordinator.
- Generated shadcn components inflate the tree but are not business complexity.
- Standard and structured logs coexist.
- Comments such as “NEW,” numbered tutorial steps, and stale claims suggest
  AI-assisted scaffolding was not fully normalized.
- `schema.ts`, generic login form, admin types/layout, dual Iris deps, and unused
  pathname are dead/unclear.
- Tracked extension `dist/` was already inconsistent with source; source should be
  authoritative and release artifacts reproducible.
- README/AGENTS/context guidance materially drift from implementation.

### Underengineering

- no integration/E2E tests, CI, API schema, production IaC, graceful shutdown,
  durable jobs, readiness, metrics/alerts, backup/restore docs, pagination,
  audit history, or data lifecycle;
- auth/tenant framework versions lag security fixes;
- no HTML sanitization or body/length limits;
- no role model despite `/admin` protection route.

### Overengineering

No distributed-system overengineering exists. Some dependency/abstraction
overhead is unnecessary:

- separate interfaces for one implementation are justified for tests only if
  service tests are added; currently most are not;
- two LeetCode handler paths plus centralized client are redundant;
- both Zustand and TanStack Query are fine, but Zustand could be local state at
  current complexity;
- unused form/analytics packages add supply-chain surface.

## 4. Technical-debt register

| ID/type | Evidence and impact | Risk/urgency | Difficulty | Recommendation |
|---|---|---|---|---|
| TD-01 security | SEC-01 dependency findings | critical / now | medium | upgrade Clerk/Next/Axios and lockfile; auth regression suite |
| TD-02 security | folder cross-tenant references | high / now | medium | service checks + DB ownership constraints + tests |
| TD-03 security | unsanitized HTML sinks | high / now | medium | allowlist sanitizer and CSP |
| TD-04 reliability | non-durable hint goroutine | high / soon | medium-high | job table + bounded worker/retry/status |
| TD-05 testing | no service/DB/frontend/E2E tests | high / now | high | build prioritized pyramid from [04](04-delivery-dependencies-operations.md) |
| TD-06 delivery | no CI and unknown deploy controls | high / now | medium | protected workflow, exact artifacts, staging, migration gate |
| TD-07 data integrity | folder ownership, cycles, imported-null capture, concept access | high / now | medium-high | invariants/migrations/repair script |
| TD-08 reliability | no graceful shutdown | high / soon | low-medium | signal context + `Echo.Shutdown` + job drain |
| TD-09 API | implicit inconsistent contracts/errors | medium / soon | medium | OpenAPI/error codes/generated TS client |
| TD-10 performance | library unbounded; metric count bug | medium / soon | low-medium | pagination/order; correct/count/test metrics |
| TD-11 operations | liveness only, no metrics/alerts | high / soon | medium | readiness, RED metrics, DB/job/provider dashboards |
| TD-12 data ops | backup/restore/retention unknown | high / now | org-dependent | verify, codify, restore drill |
| TD-13 maintainability | duplicate LeetCode paths | medium / later | low | one client/service path |
| TD-14 maintainability | mixed SQL layers/logging | medium / later | medium | converge by domain when changing code, not mass rewrite |
| TD-15 correctness | concurrent reviews/idempotency | medium-high / soon | medium | row lock/version + idempotency key |
| TD-16 correctness | static interval labels | medium / soon | low | backend preview or derive same algorithm |
| TD-17 configuration | silent dangerous defaults/dev bypass | high / now | low-medium | typed validation, production invariants |
| TD-18 supply chain | unused deps/tracked dist | medium / soon | low | remove unused, generate/check release artifacts in CI |
| TD-19 documentation | README/context drift | medium / now | low | update entry docs to point to this handbook |
| TD-20 product | concept review backend/schema not usable in UI | medium / decide | medium | formally support or remove/deprecate |
| TD-21 auditability | deletes erase review history; no before/after state | medium / decide | medium-high | decide retention/audit requirements before schema |
| TD-22 privacy | no export/delete/retention/analytics consent docs | high / now | org-dependent | data inventory and user/privacy workflows |

Fix TD-01/02/03/05/06/12/17 before adding broad new product capability. Leave
the modular monolith and PostgreSQL choice alone; they are not debt.

## 5. Unknowns and contradictions

### Dangerous unknowns

| Question | Inspected/evidence | Why unresolved / resolution |
|---|---|---|
| Where/how is production deployed? | README Docker/Dokploy claim; Dockerfiles | no Dokploy/IaC/export. Capture sanitized production config and topology. |
| Are backups restorable? | no files | provider dashboard/runbook absent. Record schedule/RPO/RTO and run restore drill. |
| What is live schema/version/data validity? | migrations only | no DB access. Query migration table/constraints safely. |
| Which secrets manager/roles/network controls? | env consumers only | runtime platform absent. Audit production. |
| Are branch protection/CI checks enforced? | no workflows; PR bot comments | GitHub settings absent. Inspect settings and codify. |
| Clerk settings/session/MFA/domains? | SDK code | Clerk dashboard absent. Export/record nonsecret policy. |
| Analytics collection/retention/legal basis? | hardcoded Iris client | analytics service/privacy docs absent. Audit endpoint and policy. |
| Who creates global concepts? | no admin/seed path; concept Markdown | likely manual, but unknown. Create explicit seed/admin process. |
| Actual traffic, latency, DB size/cost? | no telemetry | measure before scaling decisions. |
| Whether critical advisories are exploitable in deployed topology | audit + code | version match is known, exploit reachability untested. Patch first, then validate. |

### Contradictions

1. Root `AGENTS.md` says two projects, then lists three; actual repo has three.
2. It says no automated tests; backend now has unit tests.
3. `docs/agents/domain.md` says root `CONTEXT-MAP.md`, per-project `CONTEXT.md`,
   and ADR folders exist; none exist.
4. README says Next.js 15; manifest/build reports 16.0.1.
5. README says “five tables” but enumerates more and migrations create eleven.
6. README says all API routes require Clerk; pair/refresh are public and extension
   routes use a distinct JWT.
7. README says `LLM_*` fallbacks remain; commit `6351b30` removed them.
8. README tells users to copy `.env.example`; no examples are tracked.
9. README/agent guidance emphasizes Zod, but central problem form uses RHF/manual
   types and its Zod schema is unused.
10. README calls the SRS an SM-2 variant; that is fair, but exact intervals and
    difficulty multipliers are bespoke and UI labels do not match.
11. `ProblemCapture` state includes `pending_enrichment`; no writer uses it.
12. “All routes” API listing in README is incomplete versus `routes.go`.
13. Frontend build metadata warns `metadataBase` missing in some generated
    context even though root layout sets it; likely route-specific generation,
    but exact origin needs Next investigation.
14. Extension `dist/` differed from source before investigation, proving generated
    artifact drift.

### Questions for the owner

- Is concept review an intended product feature?
- Should deleting a custom concept delete its problems and review history?
- Is `summary` still a distinct domain field from HTML description?
- Should automatic hints send the full solution and stable Clerk ID to Kimi?
- What privacy promise is made for analytics, solutions, and extension data?
- What is the desired retention/audit behavior after account/problem deletion?
- Is Dokploy still production, and is PostgreSQL managed or in the same VPS?
- Which environment is canonical for migrations, and has restore ever been tested?
- Should users be able to organize global concepts into private folders only
  (probably yes), and should private concepts ever cross users (no)?
- Was system-concept seeding done manually from `algomind-concepts.MD`?

