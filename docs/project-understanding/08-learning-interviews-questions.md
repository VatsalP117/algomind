# Learning Curriculum and Interview Question Bank

This curriculum turns the repository into a sequence of progressively harder study modules. It is intentionally project-specific: every lesson ends at real AlgoMind files, behavior, or operational evidence rather than at a generic framework tutorial.

Confidence labels used here follow the [handbook index](./README.md): **Confirmed** means directly evidenced in the repository, **Strong inference** means a reasoned interpretation supported by multiple clues, and **Unknown** means the repository does not settle the question.

## How to use this curriculum

Work through the modules in order if AlgoMind is unfamiliar. For each module:

1. Read the beginner explanation.
2. Trace the listed files and symbols.
3. Answer the checkpoint questions without looking at the answer bank.
4. Complete the exercise or practical modification on a branch.
5. Run the stated verification before moving on.

Exercises are proposals, not changes made by this documentation effort.

## Module 1 — Product, repository, and runtime map

**Concept.** Establish the product vocabulary and identify which runtime owns each responsibility.

**Why it matters here.** AlgoMind is not one deployable. The web frontend, Go API, PostgreSQL database, browser extension, Clerk, LeetCode, and Kimi have different trust and failure boundaries.

**Prerequisites.** Basic web request knowledge.

**Start with.**

- `AGENTS.md`
- `algomind-frontend/app`
- `algomind-backend/cmd/api/main.go`
- `algomind-extension/src`
- [Architecture and repository](./01-architecture-and-repository.md)

**Beginner explanation.** The frontend renders the main product and calls the API. The API owns persistent business data in PostgreSQL. Clerk establishes a web user's identity. The extension has a separate pairing and token flow so that it can capture LeetCode problems. External services enrich rather than own the primary data.

**Deeper explanation.** A user journey can cross four independently changing contracts: browser UI to API, API to database, API to identity provider, and extension to both LeetCode and the API. A correct local change can still fail after deployment if one contract, secret, origin, migration, or browser permission is omitted.

**Checkpoint questions.**

- What are AlgoMind's deployable artifacts?
- Which system is authoritative for users, and which is authoritative for study data?
- Why should the extension be modeled as a separate client rather than another frontend page?

**Exercise.** Draw the system from memory, including trust boundaries and one failure mode on each external edge.

**Practical modification.** Add a harmless build-version endpoint and display it in a development-only frontend panel. Decide where the extension's version belongs.

**Verify.** Build all three projects and explain which output is deployed or loaded for each.

## Module 2 — Next.js frontend composition

**Concept.** Understand App Router pages, client components, providers, feature modules, shared UI, API access, and state ownership.

**Why it matters here.** AlgoMind uses Next.js 16 and React 19, but much of the authenticated application behaves as a client-side application backed by TanStack Query and Zustand.

**Prerequisites.** React components, hooks, promises, TypeScript.

**Start with.**

- `algomind-frontend/app/layout.tsx`
- `algomind-frontend/app/dashboard/layout.tsx`
- `algomind-frontend/components/providers.tsx`
- `algomind-frontend/features`
- `algomind-frontend/lib/api-client.ts`

**Beginner explanation.** Routes are folders under `app`. Layouts wrap groups of pages. Client components use hooks for user interaction and remote data. TanStack Query owns server-derived data and caching; Zustand owns small client-side state. Shared primitives live below `components`.

**Deeper explanation.** The central architectural question is not “which state library?” but “who is authoritative?” Remote records should be invalidated and refetched through query keys; durable business truth should remain in PostgreSQL; ephemeral interface preferences can remain local. Violating this boundary produces stale or contradictory state.

**Checkpoint questions.**

- What makes a component require `"use client"`?
- Where are authenticated routes grouped?
- When should a mutation invalidate a query rather than directly mutate a Zustand store?

**Exercise.** Trace a dashboard request from page render through hook, API client, HTTP route, and returned DTO.

**Practical modification.** Add loading, empty, success, and typed error states to one existing list without duplicating server state.

**Verify.** Run `npm run lint` and `npm run build`; manually exercise all four states.

## Module 3 — Go request lifecycle and boundaries

**Concept.** Follow Echo startup, middleware, handlers, repositories, models, DTOs, and database calls.

**Why it matters here.** The backend is a modular monolith. Its boundaries are conventions rather than process boundaries, so maintaining them depends on disciplined code placement and dependency direction.

**Prerequisites.** Go syntax, interfaces, HTTP status codes, SQL basics.

**Start with.**

- `algomind-backend/cmd/api/main.go`
- `algomind-backend/internal/server`
- `algomind-backend/internal/handlers`
- `algomind-backend/internal/database`
- `algomind-backend/internal/dto`

**Beginner explanation.** `main` loads configuration and starts the server. Middleware performs cross-cutting work such as authentication. Handlers parse HTTP input and select a response. Repositories execute SQL. DTOs shape the public contract; database models represent stored records.

**Deeper explanation.** Some business rules currently sit in handlers or SQL repositories because there is no explicit service layer. That is acceptable for small flows, but multi-step operations become hard to make transactional, retryable, and independently testable. The capture conversion and review scheduling flows show this pressure.

**Checkpoint questions.**

- Where is route registration performed?
- Which layer should decide that a folder belongs to the authenticated user?
- Which errors should a repository return without deciding the HTTP status?

**Exercise.** Trace `POST /api/v1/problems` from route registration to its inserts and response.

**Practical modification.** Add one validated endpoint using an existing repository pattern and write handler plus repository tests.

**Verify.** Run `go test ./...`, `go vet ./...`, and test authorization with two user identities.

## Module 4 — Relational data and migrations

**Concept.** Learn the schema, constraints, indexes, transactions, migrations, and data lifecycle.

**Why it matters here.** PostgreSQL is the authoritative store for problems, concepts, reviews, captures, folders, and extension sessions. Security and correctness rely on tenant predicates and constraints as much as on HTTP code.

**Prerequisites.** Primary/foreign keys, joins, transactions.

**Start with.**

- `algomind-backend/migrations`
- `algomind-backend/internal/database`
- [Data, API, auth, and configuration](./03-data-api-auth-config.md)

**Beginner explanation.** Migrations evolve the schema in a repeatable order. Foreign keys connect records, indexes speed selected access paths, and transactions make a group of writes succeed or fail together.

**Deeper explanation.** A foreign key proves that a referenced record exists; it does not prove that it belongs to the same user. AlgoMind's folder references therefore require explicit tenant-aware checks or a stronger schema design. Likewise, a state machine spanning several rows needs a transaction and concurrency policy, not merely sequential successful calls.

**Checkpoint questions.**

- Which tables are tenant-owned?
- Why does `folder_id` require more than a foreign key?
- What can happen if capture conversion succeeds but marking the capture imported fails?

**Exercise.** For each foreign key, document deletion behavior and whether cross-user references are possible.

**Practical modification.** Design a migration that adds a constraint or index safely on a populated production table, including rollback and validation queries.

**Verify.** Apply migrations to a clean database and to representative existing data; compare query plans before and after.

## Module 5 — Identity, authorization, and extension tokens

**Concept.** Separate authentication from authorization and compare the web and extension trust models.

**Why it matters here.** Web requests rely on Clerk, while the extension pairs through a short-lived code and then uses access and rotating refresh tokens. Both paths ultimately act on tenant-owned data.

**Prerequisites.** JWTs, bearer tokens, OAuth/OIDC concepts, browser origins.

**Start with.**

- backend authentication middleware and extension handlers under `algomind-backend/internal`
- extension background code under `algomind-extension/src`
- frontend Clerk provider and middleware
- the auth matrix in [Data, API, auth, and configuration](./03-data-api-auth-config.md)

**Beginner explanation.** Authentication answers “who is this?” Authorization answers “may this identity perform this operation on this record?” A valid token alone is insufficient when an endpoint accepts another record's identifier.

**Deeper explanation.** Extension refresh rotation creates a token family and replay problem: the server must distinguish the latest valid token, revoke compromised sessions, and apply strict JWT validation. Pairing codes need short expiry, single use, limited guessing opportunities, and a clear binding to the initiating user.

**Checkpoint questions.**

- Why are Clerk tokens not automatically interchangeable with extension tokens?
- Which JWT claims and signing methods should be validated?
- What is an insecure direct object reference in AlgoMind terms?

**Exercise.** Build an endpoint-by-endpoint authorization matrix and attempt every identifier-bearing request with a second user.

**Practical modification.** Add explicit ownership checks and negative integration tests for folder assignment and parent-folder changes.

**Verify.** Confirm cross-user requests return a non-disclosing error and leave the database unchanged.

## Module 6 — Spaced repetition and domain correctness

**Concept.** Understand the review state, scheduling algorithm, concept mastery, and product meaning.

**Why it matters here.** Review scheduling is a core product rule. Small discrepancies between labels, formulas, persisted fields, and UI assumptions directly change what users study.

**Prerequisites.** Module 3 and Module 4.

**Start with.**

- review handlers, DTOs, and repository methods
- review UI under `algomind-frontend/features`
- domain glossary and invariants in [Runtime journeys and domain](./02-runtime-journeys-and-domain.md)

**Beginner explanation.** A review records a user's rating and updates fields such as next-review time, interval, ease, and streak. The next due set should come from persisted scheduling state.

**Deeper explanation.** Correctness requires one canonical rating vocabulary and scheduling function shared by API semantics, UI labels, and tests. Concurrent submissions need idempotency or row-level serialization. Aggregated mastery must count the intended entities; counting distinct concept IDs per concept collapses the value to zero or one.

**Checkpoint questions.**

- Which fields form the review state?
- Where do UI interval hints disagree with the server algorithm?
- What invariant should hold after two concurrent submissions?

**Exercise.** Create a table of inputs and expected scheduling outputs at boundary values.

**Practical modification.** Extract scheduling into a pure function and add table-driven tests before changing behavior.

**Verify.** Run deterministic tests with a fixed clock and test duplicate/concurrent submission behavior.

## Module 7 — Extension capture pipeline

**Concept.** Understand MV3 service workers, content extraction, permissions, pairing, capture states, and the LeetCode proxy fallback.

**Why it matters here.** The extension runs in an untrusted page/browser context and communicates with both LeetCode and AlgoMind. Manifest permissions and token storage are part of the security architecture.

**Prerequisites.** Browser extension basics, modules 1 and 5.

**Start with.**

- `algomind-extension/manifest.json`
- `algomind-extension/src/background.ts`
- popup and content-script source
- extension API handlers in the backend

**Beginner explanation.** A content script can read supported page content. The extension's background service worker coordinates messages and network requests. Pairing gives the extension its own credentials. Captures are later imported into the main study model.

**Deeper explanation.** MV3 workers are ephemeral, so correctness cannot depend on in-memory continuity. Content from LeetCode is untrusted HTML. Host checks, permissions, message validation, token storage, and retry semantics determine the blast radius of compromise.

**Checkpoint questions.**

- Why can an MV3 background worker disappear between events?
- What does the direct/fallback LeetCode strategy optimize?
- Where must captured HTML be sanitized?

**Exercise.** Enumerate all extension permissions and host access, then justify or reduce each.

**Practical modification.** Add strict URL parsing and supported-host validation with tests for deceptive hostnames.

**Verify.** Run type checking, build `dist`, load it unpacked, and test pair/capture/refresh/revoke across browser restart.

## Module 8 — External integrations and asynchronous work

**Concept.** Model provider calls, timeouts, retries, idempotency, durability, and graceful shutdown.

**Why it matters here.** LeetCode, Clerk, and Kimi can fail independently. Hint generation currently runs in a non-durable goroutine, which creates silent loss and unbounded concurrency risks.

**Prerequisites.** Go contexts, HTTP clients, failure modes.

**Start with.**

- LeetCode client/proxy code
- Kimi hint-generation code
- authentication provider integration
- [Delivery, dependencies, and operations](./04-delivery-dependencies-operations.md)

**Beginner explanation.** External calls need a timeout and a meaningful failure response. Retrying is safe only when the operation is idempotent or protected by an idempotency key.

**Deeper explanation.** Work acknowledged before it is durably queued can be lost on crash or deploy. A production hint pipeline needs a persistent job state, bounded workers, attempt limits, backoff, observability, cancellation, and a recovery path. Provider-specific errors should not leak secrets or become indistinguishable from internal failures.

**Checkpoint questions.**

- What happens to a hint goroutine during process termination?
- Which LeetCode failures should trigger fallback?
- What data is required to retry a job safely?

**Exercise.** Write a failure-mode table for timeout, 429, malformed payload, authentication failure, and partial database write.

**Practical modification.** Design a durable `hint_jobs` model and worker contract; include deduplication and shutdown behavior.

**Verify.** Kill the process mid-job, restart it, and prove the job is either completed once or visibly failed.

## Module 9 — Delivery, observability, and incident response

**Concept.** Connect source changes to build artifacts, migrations, deployment, health, logs, metrics, rollback, and recovery.

**Why it matters here.** Repository evidence mentions Docker and Dokploy/Traefik, but production topology and operational controls are not encoded. The health endpoint is liveness-only and no CI workflow is present.

**Prerequisites.** Containers, HTTP, SQL migrations.

**Start with.**

- Dockerfiles and Compose files
- backend health route and logging setup
- [Delivery, dependencies, and operations](./04-delivery-dependencies-operations.md)
- [Safe-change and operations runbook](./06-safe-change-and-runbook.md)

**Beginner explanation.** A build turns source into an artifact. Deployment starts that artifact with configuration. Readiness decides whether traffic should reach it. Logs explain events; metrics expose trends; traces connect a request across components.

**Deeper explanation.** Startup migrations couple schema availability to process startup and complicate rollback when application and schema compatibility diverge. A robust release has explicit migration phases, backward-compatible changes, immutable artifacts, smoke tests, and an evidence-backed rollback/data-restoration plan.

**Checkpoint questions.**

- Why is a liveness endpoint not a sufficient readiness check?
- Which rollback cases are unsafe after a migration?
- What signals would detect a broken review scheduler before users report it?

**Exercise.** Simulate a deployment where the database is reachable but a migration is incompatible; write the decision tree.

**Practical modification.** Add request correlation, readiness checks, and three product-level metrics with alert thresholds.

**Verify.** Trigger representative failures and confirm a responder can identify tenant, route, status, latency, and cause without exposing secrets.

## Module 10 — Architecture evolution and technical leadership

**Concept.** Make evidence-backed tradeoffs, reconstruct decisions, prioritize debt, and evolve boundaries safely.

**Why it matters here.** AlgoMind is compact enough that broad rewrites would be costly and unnecessary, but several flows have outgrown handler-plus-repository sequencing.

**Prerequisites.** All prior modules.

**Start with.**

- [Reconstructed ADR catalogue](./07-adr-catalogue.md)
- [Security, performance, and debt](./05-security-performance-debt.md)
- git history and reviewed pull requests

**Beginner explanation.** Architecture is the set of important decisions that are expensive to change. An ADR records the context, options, decision, consequences, and revisit conditions.

**Deeper explanation.** The appropriate evolution is selective: preserve the modular monolith while introducing explicit use-case boundaries where transactions, authorization, or background work demand them. Prioritization should combine user harm, exploitability, frequency, reversibility, and learning value—not stylistic preference.

**Checkpoint questions.**

- Which current decisions are still fit for purpose?
- Where would a service/use-case layer pay for itself first?
- Which debt item should be addressed before feature expansion, and why?

**Exercise.** Defend one reconstructed ADR and overturn another using new evidence and measurable revisit criteria.

**Practical modification.** Implement one vertical slice that fixes a ranked risk, includes tests and telemetry, and updates its ADR.

**Verify.** Present the change in an architecture review covering contract compatibility, migration, security, rollout, monitoring, and rollback.

## Role-specific interview explanations

### Frontend engineer

Explain AlgoMind as a client-heavy Next.js application whose server truth is accessed through a typed API layer and cached with TanStack Query. Focus on route/layout composition, Clerk session propagation, query invalidation, accessible interaction states, unsafe HTML rendering, and the drift between review labels and backend rules. A strong candidate identifies state ownership and contract testing as more important than component aesthetics alone.

Expect follow-ups about why a component is client-rendered, query-key design, hydration and bundle cost, safe HTML rendering, form/error accessibility, and how a backend contract change is rolled out without breaking the UI.

### Backend engineer

Explain it as an Echo modular monolith over PostgreSQL/sqlx. Walk through middleware, handler validation, DTOs, repository SQL, and transactions. Focus on tenant authorization, atomic capture conversion, review concurrency, provider timeouts, and a durable hint pipeline. A strong candidate improves boundaries selectively without proposing services for their own sake.

Expect follow-ups about middleware order, transaction isolation, idempotency, tenant-aware predicates, graceful shutdown, provider retries, and why a use-case layer is justified for some flows but not every handler.

### Full-stack engineer

Use one journey—adding or reviewing a problem—to show how a UI event crosses query hooks, API client, auth, route, SQL, and cache invalidation. Discuss how a schema or DTO change propagates through both TypeScript and Go without generated types. A strong candidate proposes contract tests and compatible rollout order.

Expect follow-ups about source-of-truth ownership, validation duplication, API compatibility, cache invalidation, end-to-end testing, migration sequencing, and diagnosing a locally working feature that fails after deployment.

### System-design candidate

Start from the current modular monolith and identify load dimensions: active users, library size, due-review queries, extension captures, and hint jobs. Discuss indexes, connection limits, stateless API replicas, per-process caches, durable queues, observability, and tenant isolation. A strong answer gives thresholds before adding infrastructure.

Expect follow-ups about capacity assumptions, the first likely bottleneck, database indexes and pagination, multi-replica consistency, job-delivery guarantees, failure isolation, SLOs, and concrete criteria for extracting a service.

### DevOps/SRE candidate

Explain the known Docker/Dokploy direction and clearly label the absent production evidence. Design CI gates, immutable artifacts, staged migrations, readiness, secrets, backup restoration tests, SLOs, and rollback. A strong candidate distinguishes application rollback from data rollback.

Expect follow-ups about artifact provenance, zero-downtime prerequisites, migration races, health-check semantics, secret rotation, database recovery objectives, alert design, and the response to an apparently healthy but unusable release.

### Security engineer

Map identities, assets, entry points, and trust boundaries. Prioritize vulnerable dependencies, cross-tenant folder references, unsafe HTML, development auth bypass, JWT validation, extension origins, and abuse controls. A strong candidate pairs each finding with an exploit path, control, and regression test.

Expect follow-ups about IDOR testing, CSP and sanitization placement, refresh-token replay, pairing-code abuse, CORS versus CSRF, SSRF/hostname parsing, sensitive logging, dependency reachability, and which finding should block release.

### Product-minded engineer

Connect technical behavior to learning outcomes: review scheduling consistency, capture import reliability, concept mastery accuracy, and transparent failure states. A strong candidate asks how success is measured and avoids polishing flows whose underlying domain rules are inconsistent.

Expect follow-ups about the metric that defines a successful review experience, how to resolve ambiguous deletion behavior, whether hints are core or optional, prioritizing reliability against new features, and how to test that a technical change improves learning rather than only throughput.

# Interview question bank

Answers are deliberately separated into [Question-bank answers](./09-question-bank-answers.md). Question identifiers remain stable so the two documents can be used independently.

## Basic

1. **B1.** What are AlgoMind's three repository projects, and what artifact does each produce?
2. **B2.** What responsibilities belong to PostgreSQL, Clerk, LeetCode, and Kimi?
3. **B3.** Where does frontend routing begin, and where does backend startup begin?
4. **B4.** What is the difference between a DTO and a database model in this codebase?
5. **B5.** What is a migration, and why must its order be deterministic?
6. **B6.** Why is the extension's `dist` directory different from its `src` directory?
7. **B7.** What does TanStack Query own, and what should Zustand own?
8. **B8.** What is the difference between authentication and authorization?
9. **B9.** What is a liveness check?
10. **B10.** What evidence supports calling the backend a modular monolith?

## Intermediate

11. **I1.** Trace an authenticated frontend request from user action to PostgreSQL and back.
12. **I2.** How does extension pairing differ from a normal Clerk-authenticated request?
13. **I3.** Why can a valid foreign key still permit a cross-tenant security bug?
14. **I4.** What consistency risk exists in capture-to-problem conversion?
15. **I5.** Why can static review interval labels be harmful even if the backend calculation is correct?
16. **I6.** What are the tradeoffs of starting migrations with the application process?
17. **I7.** When should the frontend invalidate queries after a mutation?
18. **I8.** Why should external HTTP clients have explicit timeouts?
19. **I9.** What makes captured problem HTML untrusted?
20. **I10.** Which checks should precede assigning a problem to a folder?

## Advanced

21. **A1.** Design concurrency-safe review submission with a clear duplicate-request policy.
22. **A2.** Design a durable replacement for asynchronous hint generation.
23. **A3.** How would you make application and database releases backward compatible?
24. **A4.** At what measurable threshold would you split a component out of the monolith?
25. **A5.** How should rotating refresh-token replay be detected and contained?
26. **A6.** Design a contract-testing strategy across TypeScript, Go, and the extension.
27. **A7.** How would you prove tenant isolation across all identifier-bearing routes?
28. **A8.** What is wrong with calculating `problem_count` as a distinct concept count inside a single concept group?
29. **A9.** How would you replace per-process caches without overbuilding?
30. **A10.** Which invariants belong in the database, and which require application transactions?

## Debugging

31. **D1.** The dashboard returns 401 only in production. What do you inspect first?
32. **D2.** Extension capture works until the browser restarts, then returns 401. Form a hypothesis tree.
33. **D3.** A capture is marked imported but no problem is visible. Where can inconsistency arise?
34. **D4.** The review queue shows a problem immediately after it was rated “easy.” How do you localize the bug?
35. **D5.** Build succeeds but lint fails. What is the delivery implication?
36. **D6.** A deployment is “healthy” but every authenticated query fails. Why did the health check miss it?
37. **D7.** Hint generation intermittently disappears with no user-visible error. What evidence would confirm the likely cause?
38. **D8.** A user can attach a problem to a folder they cannot list. Which layers do you inspect?
39. **D9.** API latency grows with library size. Which queries and indexes do you examine?
40. **D10.** A direct LeetCode request fails but proxy fallback succeeds. What should be logged?

## Architecture

41. **AR1.** Which current architectural decisions should be preserved for the next stage?
42. **AR2.** Where is an explicit use-case/service layer justified first?
43. **AR3.** Should frontend and backend types be generated from one schema? Defend a choice.
44. **AR4.** Is a separate worker process warranted today?
45. **AR5.** How would you draw AlgoMind's trust boundaries?
46. **AR6.** What evidence is missing before evaluating production topology?
47. **AR7.** How should ADRs be introduced without rewriting history?
48. **AR8.** What are the costs of the client-heavy frontend architecture?
49. **AR9.** How would you evolve extension authentication without breaking installed clients?
50. **AR10.** What would make a microservice extraction a regression?

## What-if and tradeoff

51. **W1.** What if active users grow 100× but hint usage remains low?
52. **W2.** What if Kimi is unavailable for 24 hours?
53. **W3.** What if Clerk changes token claims or its SDK behavior?
54. **W4.** What if a migration must add a non-null column to a large table?
55. **W5.** What if LeetCode changes its markup and GraphQL behavior simultaneously?
56. **W6.** What if users need offline review in the extension?
57. **W7.** What if product wants shared folders between users?
58. **W8.** What if review history must become auditable and reversible?
59. **W9.** What if the team wants zero-downtime deployments?
60. **W10.** What if a security fix requires revoking every extension session?

## Code and data

61. **C1.** What properties make scheduling logic suitable for a pure function?
62. **C2.** Where should clock injection be used?
63. **C3.** What does a transaction boundary for capture import include?
64. **C4.** How would you prevent folder cycles?
65. **C5.** How should delete behavior differ for user-created and system concepts?
66. **C6.** What query-plan evidence justifies a new index?
67. **C7.** How would cursor pagination improve a large problem library?
68. **C8.** How should API errors be represented for both users and operators?
69. **C9.** What does idempotency mean for `POST` in this product?
70. **C10.** Which generated or built files should be reviewed differently from source?

## Security and privacy

71. **S1.** Rank the repository's top three evidenced security risks and justify the order.
72. **S2.** How can `strings.Contains` produce unsafe hostname validation?
73. **S3.** What controls should protect a pairing-code endpoint?
74. **S4.** Which JWT properties must be checked beyond signature validity?
75. **S5.** Where should HTML sanitization occur?
76. **S6.** Why is a development authentication bypass operationally dangerous?
77. **S7.** What limits should apply to request bodies and user-controlled strings?
78. **S8.** How should logs balance incident utility and privacy?
79. **S9.** What security headers are relevant to the frontend and API?
80. **S10.** How do you regression-test an insecure direct object reference?

## Deployment and operations

81. **O1.** Define separate liveness and readiness checks for the backend.
82. **O2.** What should a minimum CI pipeline gate?
83. **O3.** How should secrets be rotated without a prolonged outage?
84. **O4.** What is the difference between backup existence and recoverability?
85. **O5.** Which signals belong in an initial service-level objective?
86. **O6.** How would you roll back after an additive migration?
87. **O7.** How would you respond to a compromised extension refresh token?
88. **O8.** What should a release smoke test cover?
89. **O9.** Why must the final deployed artifact be traceable to a commit?
90. **O10.** What operational facts remain unknown from this repository?
