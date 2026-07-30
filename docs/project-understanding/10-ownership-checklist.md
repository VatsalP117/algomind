# Ownership Checklist and Competency Rubric

This checklist defines what it means to safely own AlgoMind rather than merely navigate it. It is suitable for onboarding, handoff, or a staff-level readiness review. Evidence should be demonstrated against the repository or a controlled environment; verbal confidence alone is not completion.

## Suggested evidence scale

| Score | Meaning | Required evidence |
|---|---|---|
| 0 — Unfamiliar | Cannot yet locate or explain the area | None |
| 1 — Guided | Can follow an existing path with help | File trace or supervised run |
| 2 — Independent | Can diagnose and make a contained safe change | Tested branch/change and explanation |
| 3 — Owner | Can anticipate failure, review others, and operate it | Design review, incident exercise, or production-equivalent evidence |

Recommended ownership threshold: no critical item below 2, all security/data/release critical items at 3, and an overall average of at least 2.5. This threshold is a proposed rubric, not a repository policy.

## 1. Product and domain

- [ ] Explain the user value of problems, reviews, concepts, folders, captures, and hints.
- [ ] Trace the add-problem, review, extension-pairing, capture, and import journeys.
- [ ] State the review scheduling fields and identify the UI/server interval inconsistency.
- [ ] Explain concept mastery and identify why the current `problem_count` query is suspect.
- [ ] Enumerate documented domain invariants and currently reachable invalid states.
- [ ] Explain deletion consequences for folders, problems, captures, and custom concepts.
- [ ] Identify which product behaviors remain ambiguous and obtain a product decision before changing them.

**Owner demonstration.** Given a proposed review or library feature, produce an impact map covering UI, API, schema, authorization, analytics, migration, and rollback.

## 2. Repository and frontend

- [ ] Build a mental map of all three projects and their entry points.
- [ ] Explain root and authenticated Next.js layouts and provider composition.
- [ ] Distinguish server components from client components in the current architecture.
- [ ] Trace feature hooks through the shared API client and query keys.
- [ ] Apply TanStack Query invalidation without duplicating server truth in Zustand.
- [ ] Implement loading, empty, error, and success states accessibly.
- [ ] Explain the risk of `dangerouslySetInnerHTML` for captured content.
- [ ] Run and interpret frontend lint and production build results.
- [ ] Explain current build warnings and lint failures without dismissing them.

**Owner demonstration.** Deliver a frontend vertical slice with typed contracts, accessible states, cache correctness, build/lint evidence, and a security review of rendered data.

## 3. Backend and API

- [ ] Trace process startup, configuration, middleware order, routes, handlers, and shutdown behavior.
- [ ] Explain the boundaries among DTOs, models, handlers, repositories, and integrations.
- [ ] Add validation and stable error behavior to an endpoint.
- [ ] Distinguish repository errors from HTTP response policy.
- [ ] Identify flows whose orchestration has outgrown handler sequencing.
- [ ] Apply contexts, deadlines, and cancellation to database/provider work.
- [ ] Explain request size, rate, and concurrency controls that are currently absent.
- [ ] Run and interpret `go test ./...` and `go vet ./...`.

**Owner demonstration.** Implement or review an endpoint with positive, validation, not-found, provider-failure, and cross-tenant tests plus observable failure behavior.

## 4. Data and migrations

- [ ] Name all schema tables and their purpose.
- [ ] Draw the principal foreign-key and deletion relationships.
- [ ] Explain why foreign keys do not establish tenant ownership.
- [ ] Identify the transaction boundary for review submission and capture import.
- [ ] Write forward and rollback migrations that tolerate real existing data.
- [ ] Use expand/backfill/contract for incompatible changes.
- [ ] Inspect query plans with representative cardinality before adding indexes.
- [ ] Verify migrations against a clean database and an upgrade fixture.
- [ ] Explain recovery implications before approving destructive schema changes.

**Owner demonstration.** Plan and rehearse a backward-compatible schema change, including data validation, application rollout order, rollback, and post-deploy observation.

## 5. Authentication, authorization, and security

- [ ] Explain Clerk web authentication and extension pairing/access/refresh authentication.
- [ ] Build and maintain an endpoint authorization matrix.
- [ ] Test every identifier-bearing operation across two tenants.
- [ ] Validate JWT algorithm, issuer, audience, expiry, purpose, and revocation/session state.
- [ ] Explain refresh rotation and replay containment.
- [ ] Secure pairing codes with entropy, expiry, single use, binding, rate limits, and audit.
- [ ] Parse and validate URLs/hosts without substring checks.
- [ ] Sanitize third-party HTML and render it with defense in depth.
- [ ] Bound bodies, fields, pages, provider requests, and costly concurrency.
- [ ] Ensure development authentication shortcuts cannot be enabled in production.
- [ ] Prioritize and remediate the currently evidenced critical/high dependency advisories.
- [ ] Define secret storage, rotation, redaction, and incident handling.

**Owner demonstration.** Complete a threat model and remediate one high-risk finding with exploit regression tests, rollout safeguards, and monitoring.

## 6. Extension

- [ ] Explain MV3 background worker lifecycle and why memory is non-durable.
- [ ] Justify every requested permission and host permission.
- [ ] Trace popup/content/background messages and validate message boundaries.
- [ ] Explain credential persistence, refresh, revoke, and browser-restart behavior.
- [ ] Trace direct LeetCode access and API proxy fallback.
- [ ] Handle markup/provider changes without persisting corrupt content silently.
- [ ] Build the extension reproducibly and distinguish `src` from `dist`.
- [ ] Test pairing, capture, import, refresh, revoke, restart, and unsupported-host cases.

**Owner demonstration.** Ship an extension-compatible server change across an explicit version window, including old-client behavior and a revocation/rollback plan.

## 7. External services and background work

- [ ] List every external provider, its credentials, timeouts, and failure semantics.
- [ ] Distinguish retryable, permanent, authentication, quota, and malformed-response errors.
- [ ] Explain why acknowledged goroutine work can be lost.
- [ ] Design a durable, bounded, observable hint job lifecycle.
- [ ] Define idempotency and deduplication for provider-triggering actions.
- [ ] Implement graceful claim stopping and job draining/recovery.
- [ ] Test provider timeout, 429, invalid payload, outage, and process termination.

**Owner demonstration.** Run a provider-outage game day and show that core study flows remain available while queued/failed work is visible and recoverable.

## 8. Delivery and supply chain

- [ ] Reproduce frontend, backend, and extension builds from pinned dependencies.
- [ ] Explain Docker build stages and artifact/runtime boundaries.
- [ ] Design CI gates for formatting, lint, type checking, tests, builds, migrations, vulnerabilities, and secrets.
- [ ] Triage dependency advisories by reachability and upgrade compatibility.
- [ ] Trace a deployed artifact to its commit and lockfiles.
- [ ] Separate application, schema, and configuration rollout ordering.
- [ ] Define smoke tests and promotion criteria.
- [ ] Explain when application rollback is safe and when data rollback is not.
- [ ] Label the Dokploy/Traefik production model as unverified until operational evidence is supplied.

**Owner demonstration.** Produce an immutable release candidate, pass all gates, deploy it to a production-like environment, smoke test it, and rehearse rollback.

## 9. Reliability and observability

- [ ] Separate liveness, readiness, and dependency/provider degradation.
- [ ] Add/request correlation without logging credentials or problem content.
- [ ] Define latency, error, saturation, and domain-correctness metrics.
- [ ] Set initial SLOs and actionable burn-rate alerts.
- [ ] Diagnose database pool exhaustion, provider latency, and slow queries.
- [ ] Explain behavior during SIGTERM and implement graceful HTTP shutdown.
- [ ] Bound in-memory caches and account for multi-replica consistency.
- [ ] Write dashboards and alerts for review, capture, and hint journeys.

**Owner demonstration.** Diagnose an injected failure from telemetry alone, communicate impact, mitigate it, and identify the missing signal that would shorten recovery.

## 10. Operations and incident response

- [ ] Start the full system from a clean machine using placeholders and documented prerequisites.
- [ ] Validate configuration without exposing secrets.
- [ ] Identify the actual production topology, owners, environments, and access paths.
- [ ] Deploy, smoke test, restart, and roll back safely.
- [ ] Run migrations with a lock/coordination policy.
- [ ] Locate logs and correlate a user report across components.
- [ ] Prove backups by restoring and validating them.
- [ ] Rotate Clerk, database, extension, and provider credentials safely.
- [ ] Revoke a compromised extension session/token family.
- [ ] Declare, coordinate, document, and review an incident.
- [ ] Record recovery-time and recovery-point evidence.

**Owner demonstration.** Complete a tabletop incident involving a bad migration plus provider outage; choose between rollback, roll-forward, traffic isolation, and data restoration with explicit evidence.

## 11. Architecture and technical leadership

- [ ] Explain every reconstructed ADR and distinguish evidence from inference.
- [ ] Preserve decisions that remain proportionate to scale and team needs.
- [ ] Define measurable revisit criteria before introducing a new service or datastore.
- [ ] Add an ADR for consequential new decisions.
- [ ] Prioritize debt by user harm, exploitability, likelihood, reversibility, and effort.
- [ ] Translate architecture risks into staged, testable delivery slices.
- [ ] Review cross-project compatibility and deployment order.
- [ ] Keep documentation synchronized with behavior and remove known README drift.
- [ ] State unknowns plainly and identify the evidence needed to resolve them.

**Owner demonstration.** Lead a design review for one major improvement, explicitly covering alternatives, consequences, security, data, operability, rollout, metrics, rollback, and revisit triggers.

## Critical ownership gates

The following are stop-the-line capabilities for unsupervised ownership:

- [ ] Can prevent and regression-test cross-tenant access.
- [ ] Can make multi-write state transitions atomic and concurrency-safe.
- [ ] Can assess and remediate critical/high vulnerable dependencies.
- [ ] Can deploy a backward-compatible schema/application change and recover safely.
- [ ] Can revoke credentials and respond to a suspected compromise.
- [ ] Can prove restoration from backup in a controlled environment.
- [ ] Can diagnose a critical user journey through logs/metrics without exposing secrets.
- [ ] Can distinguish confirmed production facts from repository inference.

## Final sign-off record

| Area | Score 0–3 | Evidence link or artifact | Reviewer | Date | Follow-up |
|---|---:|---|---|---|---|
| Product/domain |  |  |  |  |  |
| Frontend |  |  |  |  |  |
| Backend/API |  |  |  |  |  |
| Data/migrations |  |  |  |  |  |
| Auth/security |  |  |  |  |  |
| Extension |  |  |  |  |  |
| Integrations/jobs |  |  |  |  |  |
| Delivery/supply chain |  |  |  |  |  |
| Reliability/observability |  |  |  |  |  |
| Operations/incidents |  |  |  |  |  |
| Architecture/leadership |  |  |  |  |  |

Sign-off should include links to concrete exercises, changes, runbooks, test evidence, or incident simulations. Any score of 0 or 1 needs a named mentor and a bounded follow-up plan before independent ownership.
