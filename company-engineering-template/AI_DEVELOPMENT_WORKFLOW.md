# AI Development Workflow

## Purpose

This workflow separates product intent, implementation, and verification so
that model errors are less likely to reinforce one another.

For the exact ordered procedure, required artifacts, gates, and failure loops,
follow [Task Delivery Runbook](TASK_DELIVERY_RUNBOOK.md). This document explains
the role design and reasoning behind that procedure.

## Roles

One strong model may perform multiple non-conflicting roles, but the implementer
must not be the sole verifier.

| Role | Responsibility | Default model tier |
| --- | --- | --- |
| Product author | Defines outcome, constraints, and acceptance criteria | Founder with strong model |
| Risk classifier | Assigns product track and change-risk tier | Strong model; human confirms high risk |
| Test designer | Derives acceptance and adversarial tests from the spec | Strong model, separate context |
| Planner | Creates small vertical tasks and dependency order | Strong model |
| Executor | Implements one bounded task and runs local checks | Cost-efficient model |
| Reviewer | Reviews spec, diff, tests, and risk independently | Strong model, separate context |
| Release operator | Executes approved staged release and verifies health | Automation or authorized human |

Use the best available model for ambiguous product reasoning, architecture,
security, debugging after failed attempts, and final review. Use cost-efficient
models for well-specified implementation, mechanical updates, and routine test
execution.

## Workflow

### 1. Classify the Product

Choose `experiment` or `production`. Complete an experiment charter or feature
specification. Products in excluded high-risk domains do not proceed under this
baseline.

### 2. Specify the Outcome

Create `templates/feature-spec.md`. A founder approves user outcome, non-goals,
data use, monetization, and acceptance criteria. Avoid prescribing code unless
the architecture requires it.

### 3. Classify Change Risk

Apply `RISK_CLASSIFICATION.md`. Risk is based on impact, not diff size. Unknown
risk is classified one tier higher until resolved.

### 4. Design Verification

A test-designer context derives acceptance scenarios from the approved
specification before implementation. It identifies happy paths, boundary
conditions, denied permissions, offline behavior, recovery, and abuse cases.

Acceptance tests are protected requirements. Any correction requires a reason
and review independent of the executor.

### 5. Plan Vertical Tasks

The planner produces tasks using `templates/task.md`. A normal task should:

- have one measurable outcome;
- affect one coherent area;
- be reviewable in roughly 100-400 changed lines, excluding generated files;
- specify checks and stop conditions;
- be independently mergeable or explicitly depend on one prior task.

Line count is a warning signal, not a target. Generated migrations, lockfiles,
and snapshots are reviewed separately.

### 6. Execute Within Bounds

Give the executor only the approved spec, current task, repository instructions,
and relevant code context. The executor implements, runs checks, and reports
evidence.

The default retry budget is two materially different implementation attempts.
After that, escalate the failure and artifacts to a stronger model. Do not spend
unbounded tokens repeating the same approach.

### 7. Review Independently

The reviewer receives the approved spec, risk tier, diff, and test evidence.
Where tooling allows, it reviews before reading the executor's narrative.

The reviewer must:

- map acceptance criteria to implementation and tests;
- inspect changed trust boundaries and data flows;
- seek missing failure and lifecycle cases;
- flag unnecessary dependencies and architecture drift;
- run or request additional tests when evidence is weak;
- issue `approve`, `request changes`, or `escalate to human`.

### 8. Merge by Policy

Apply `REVIEW_AND_MERGE_POLICY.md`. All required checks must report success.
Skipped checks require an approved exception; silence is not approval.

### 9. Release and Observe

Apply `RELEASE_POLICY.md`. Production behavior is verified through staged
rollout, smoke tests, telemetry, and rollback readiness.

### 10. Learn

For escaped defects and expensive agent failures, record:

- why the specification, tests, review, or telemetry missed the issue;
- the smallest reusable guardrail that would catch it next time;
- whether the starter repository or templates need updating.

## Context and Access Boundaries

- Start each independent role in a fresh agent context.
- Provide the minimum repository and secret access required.
- Do not expose production user data to general-purpose models.
- Preserve prompts, model identity, tool actions, and evidence for high-risk
  changes where the platform permits.
- Treat model-generated summaries as navigation aids, never substitutes for the
  source specification or diff.

## Measuring the System

Track monthly:

- escaped defects and severity;
- rollback and crash-free release rate;
- PR lead time by risk tier;
- agent retries and escalation rate;
- flaky-test rate;
- vulnerabilities and patch time;
- percentage of production changes with complete evidence;
- review findings missed by earlier roles.

Do not optimize for tokens, lines generated, test count, or code coverage alone.
