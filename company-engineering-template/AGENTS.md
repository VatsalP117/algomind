# AGENTS.md

These instructions bind all coding agents operating in this repository.
Project-specific instructions may add constraints but may not weaken security,
risk, review, or release requirements without an approved architecture decision
record.

## Before Changing Code

1. Read the feature specification, task, relevant architecture decisions, and
   local instructions.
2. Inspect existing code and tests before proposing an implementation.
3. Confirm the product track and change-risk tier.
4. State assumptions. Stop and escalate if an assumption could alter user data,
   permissions, security boundaries, payments, or public behavior.
5. Work only within the assigned task. Do not perform opportunistic rewrites.

## Implementation Rules

- Follow existing architecture and approved dependencies.
- Keep changes small, cohesive, and reversible.
- Treat all external, persisted, and user-controlled data as untrusted.
- Never place secrets, credentials, private user data, or production dumps in
  prompts, logs, fixtures, screenshots, commits, or generated artifacts.
- Never disable or weaken tests, type checks, security checks, telemetry, or
  validation to make a task pass.
- Never change acceptance tests solely to match an implementation. Explain and
  request separate review when the specification or test is wrong.
- Never invent a custom cryptographic, authentication, authorization, payment,
  or update mechanism.
- Do not add a dependency without documenting purpose, maintenance status,
  license, permissions, data behavior, and available built-in alternatives.
- Do not access production systems or release credentials unless the task
  explicitly authorizes a constrained release operation.

## Required Verification

Run the repository-defined checks relevant to the change:

- formatter and linter
- type or compiler checks
- unit and integration tests
- production build
- security and dependency scans
- UI or gameplay evidence for visible behavior

Report commands run, results, skipped checks, and remaining uncertainty. A check
that could not run is not equivalent to a passing check.

## Stop Conditions

Stop implementation and escalate when:

- the plan conflicts with the repository or specification;
- a change crosses an undocumented architecture boundary;
- sensitive data, authentication, authorization, payments, deletion,
  migrations, cryptography, or new platform permissions are discovered;
- the same failure survives two materially different implementation attempts;
- passing requires weakening a guardrail;
- the task is likely to exceed its stated scope or change budget;
- generated or third-party code cannot be understood well enough to verify.

## Review Behavior

When acting as reviewer:

- review the specification and diff, not the implementer's confidence;
- identify concrete bugs, regressions, missing tests, and security risks first;
- check error paths, lifecycle transitions, offline behavior, concurrency,
  retries, cancellation, and partial failure where applicable;
- distinguish blocking findings from suggestions;
- do not approve code you authored in the same agent context.

## Completion

A task is complete only when behavior, tests, documentation, observability, and
rollback requirements in its contract are satisfied. Leave the repository in a
buildable state and produce the evidence required by the PR template.

