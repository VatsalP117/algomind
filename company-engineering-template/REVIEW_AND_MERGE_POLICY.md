# Review and Merge Policy

## Objective

Human attention is scarce. Pull requests must present enough structured evidence
for reviewers to focus on risk, behavior, and exceptions instead of reconstructing
the change from raw code.

## Branch Rules

- The default branch is protected.
- Direct pushes and force pushes are prohibited.
- Required checks cannot be bypassed by routine agent credentials.
- The authoring agent cannot be the sole approving reviewer.
- Merge commits, squash merges, or rebase merges must be standardized per
  repository.

## Pull Request Size

Prefer one vertical task per PR and roughly 100-400 changed lines excluding
generated files. Split a PR when it mixes unrelated outcomes, crosses several
boundaries, or cannot be reviewed confidently. Do not split changes in a way
that leaves the default branch broken or insecure.

## Required PR Evidence

Every production PR uses `templates/pull-request.md` and includes:

- linked approved specification and task;
- product track and risk tier;
- user-visible behavior and non-goals;
- data, permissions, dependencies, and trust-boundary changes;
- test commands and results;
- screenshots or recordings for visible behavior;
- rollout, monitoring, and rollback plan;
- known limitations and reviewer-agent findings.

Generated summaries must be checked against the diff.

## Automated Gates

Repositories configure relevant required checks:

- formatting and linting;
- compiler or type checking;
- unit and integration tests;
- production build;
- security, secret, dependency, and license checks;
- architecture boundary checks;
- migration validation;
- UI or game performance budgets;
- smoke tests against release artifacts.

A skipped or unavailable check is a visible exception, not a pass.

## Independent Agent Review

The reviewer uses a fresh context and a strong model. It must review:

- acceptance-criterion coverage;
- plausible incorrect behavior despite passing tests;
- error and recovery paths;
- security, privacy, and permission changes;
- concurrency, lifecycle, offline, and compatibility risks;
- unnecessary complexity, duplication, and dependencies;
- consistency with architecture decisions and repository instructions.

The review report lists findings by severity and references concrete files or
behavior. Approval means no known blocking finding, not a guarantee of safety.

## Human Approval

### Tier 1

May auto-merge after all gates and independent review pass. Enable auto-merge
only after the repository has at least 20 successful human-reviewed production
PRs and no unresolved severe process failure.

### Tier 2

Requires a named human approver by default. A founder may delegate a narrow,
repeatable class after the controls have demonstrated reliability. Delegation
must be documented and reversible.

### Tier 3

Always requires founder approval. The human reviews:

- specification and risk rationale;
- threat or abuse cases;
- critical trust-boundary code;
- data and permission changes;
- migration, rollout, monitoring, and recovery;
- unresolved disagreement between agents.

## Merge Blocks

Do not merge when:

- required checks fail, are stale, or were run against a different revision;
- acceptance criteria are ambiguous or unverified;
- tests were weakened without independent approval;
- the risk tier appears understated;
- a blocking review finding is unresolved;
- rollback or forward recovery is absent for consequential changes;
- the PR contains unrelated generated or reformatted churn;
- a new dependency or permission lacks justification.

## Exceptions

Emergency exceptions require a founder, written rationale, compensating
controls, and an expiry or follow-up issue. After the emergency, restore normal
gates and conduct a short incident review.

