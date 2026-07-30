# Algomind Project-Understanding Handbook

> Investigation baseline: repository `main` at `04fb2b2` (`2026-06-05`), inspected
> 2026-07-30. Production state was not probed. Runtime and deployment claims are
> therefore bounded by repository and GitHub evidence.

## Why this format

This handbook is a set of linked Markdown documents rather than one giant file.
That keeps architectural explanations close to their detailed catalogues, makes
evidence searchable in the same repository as the code, allows Mermaid diagrams
to render in GitHub/Codex, and lets future changes update one topic without
rewriting the whole book. Every diagram is followed by a prose explanation.

## Confidence vocabulary

- **Confirmed** — directly established by current code, configuration, migration,
  test output, or Git history.
- **Strong inference** — multiple pieces of evidence point to the conclusion, but
  the repository does not explicitly state it.
- **Possible interpretation** — plausible, but weakly evidenced.
- **Unknown** — not recoverable from the repository or connected GitHub records.
- **Contradictory evidence** — authoritative-looking sources disagree.

Unless a paragraph is explicitly labeled otherwise, factual descriptions of
current behavior are **Confirmed**.

## Read in this order

| Priority | Document | What it gives you |
|---|---|---|
| **Read first** | [01 — Product, architecture, and repository](01-architecture-and-repository.md) | Two-minute explanation, system boundaries, startup, guided code tour |
| **Essential** | [02 — Runtime journeys and domain](02-runtime-journeys-and-domain.md) | End-to-end traces for login, problem creation, review, extension capture, concepts |
| **Essential** | [03 — Database, APIs, auth, and configuration](03-data-api-auth-config.md) | ER model, schema evolution, full route catalogue, both auth systems, all env vars |
| **Important** | [04 — Delivery, dependencies, testing, and operations](04-delivery-dependencies-operations.md) | Dependencies, local setup, Docker/deployment, CI gaps, tests, resilience, debugging |
| **Important** | [05 — Security, scale, quality, debt, and unknowns](05-security-performance-debt.md) | Ranked findings, performance/scaling assessment, technical-debt register, contradictions |
| **Practical** | [06 — Safe-change guides and runbook](06-safe-change-and-runbook.md) | Repository-specific change recipes, deployment/rollback templates, incident operations |
| **Deep dive** | [07 — ADR catalogue](07-adr-catalogue.md) | Recorded/reconstructed decisions, evidence, alternatives, trade-offs, revisit triggers |
| **Learn** | [08 — Learning path, interview explanations, question bank](08-learning-interviews-questions.md) | Curriculum, exercises, interview narratives, questions |
| **Self-test** | [09 — Answer key](09-question-bank-answers.md) | Answers kept separate from the questions |
| **Finish** | [10 — Ownership checklist](10-ownership-checklist.md) | A concrete standard for independently owning the system |

## Suggested study schedules

### One-hour orientation

Read the two-minute explanation and first-ten-concepts sections in [01](01-architecture-and-repository.md), then the journey summaries in [02](02-runtime-journeys-and-domain.md), the highest-ranked findings in [05](05-security-performance-debt.md), and the critical ownership gates in [10](10-ownership-checklist.md). The goal is to draw the boundaries and name the immediate risks, not to memorize implementation.

### One-day understanding

Read [01](01-architecture-and-repository.md) through [05](05-security-performance-debt.md) in order. Reproduce one web request and the extension capture/import path in the code, then answer B1–B10 and I1–I10 in [08](08-learning-interviews-questions.md) before checking [09](09-question-bank-answers.md).

### One-week deep study

Complete modules 1–9 in [08](08-learning-interviews-questions.md), perform each code-tracing exercise, inspect every migration and route catalogue entry in [03](03-data-api-auth-config.md), rehearse two debugging playbooks from [04](04-delivery-dependencies-operations.md), and review the safe-change/runbook procedures in [06](06-safe-change-and-runbook.md). End by defending three reconstructed decisions from [07](07-adr-catalogue.md).

### Full project mastery

Complete all curriculum exercises and the 90-question self-test, implement at least one safe vertical slice in a controlled branch, rehearse deployment/rollback/restore and a security incident in a production-like environment, resolve production unknowns with the actual operator, and obtain evidence-backed scores in every section of [10](10-ownership-checklist.md).

## Coverage map to the original brief

| Required section | Primary location |
|---|---|
| 1–4. Overview, repository, architecture, entry points | [01](01-architecture-and-repository.md) |
| 5–8. Journeys, frontend, backend, domain | [02](02-runtime-journeys-and-domain.md) |
| 9–12. Data, APIs, auth, configuration | [03](03-data-api-auth-config.md) |
| 13–18. Dependencies, delivery, testing, resilience, observability | [04](04-delivery-dependencies-operations.md) |
| 19–23. Security, performance, quality, debt, unknowns | [05](05-security-performance-debt.md) |
| 24–26. Safe changes, local handbook, operations | [06](06-safe-change-and-runbook.md) |
| Historical decisions and section 30 | [07](07-adr-catalogue.md) |
| 27–29. Learning, questions, interview explanations | [08](08-learning-interviews-questions.md), [09](09-question-bank-answers.md) |
| 31. Ownership checklist | [10](10-ownership-checklist.md) |

## What was actually inspected

- All tracked application entry points, handlers, services, repositories, models,
  DTOs, migrations, runtime configuration, Dockerfiles, build scripts, manifests,
  feature hooks, pages, state stores, and security/observability code.
- Package manifests and lockfiles; generated extension `dist/` was distinguished
  from source.
- Full local Git log (2025-11-02 through 2026-06-05), relevant diffs, and GitHub
  pull requests [#1](https://github.com/VatsalP117/algomind/pull/1),
  [#2](https://github.com/VatsalP117/algomind/pull/2),
  [#3](https://github.com/VatsalP117/algomind/pull/3), and
  [#4](https://github.com/VatsalP117/algomind/pull/4).
- Existing READMEs and agent guidance, including contradictions with implementation.
- Verification performed on 2026-07-30:
  - `go test ./...` — pass.
  - `go vet ./...` — pass.
  - frontend `npm run build` — pass, with stale browser-data and metadata warnings.
  - frontend `npm run lint` — fail: two errors and one warning.
  - extension `npm run typecheck` — pass.
  - frontend `npm audit --json` — 19 package findings: 3 critical, 13 high,
    2 moderate, 1 low.
  - extension `npm audit --json` — 1 high transitive finding.

## Investigation limits

The repository contains no CI workflow, infrastructure-as-code for Dokploy,
production environment export, database dump, seed mechanism, dashboards/alerts,
backup policy, Clerk dashboard configuration, analytics server source, or DNS/TLS
configuration. Consequently, actual production topology, region, secrets delivery,
backup/restore, branch protection, live schema state, traffic, costs, and incident
history remain **Unknown**. The handbook never substitutes a plausible production
command for missing evidence.
