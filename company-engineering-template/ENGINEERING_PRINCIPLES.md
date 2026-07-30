# Engineering Principles

## 1. Humans Own Outcomes

AI agents may propose, implement, test, review, and release within defined
permissions. Founders remain accountable for product behavior, user harm,
security, privacy, platform compliance, and business risk.

## 2. Evidence Beats Confidence

An agent's explanation is not proof. Changes are accepted based on executable
tests, static checks, screenshots or recordings, reproducible commands,
observability, and independent review.

## 3. Independent Verification

No agent may be the sole author of the specification, acceptance tests,
implementation, and approval for the same production change. At minimum, the
implementation must be reviewed by a separate agent context.

## 4. Small Vertical Slices

Work should deliver a narrow user-visible or operational outcome. Prefer changes
that are independently testable and reversible. Split work when a reviewer
cannot understand its behavior and risk from the PR evidence.

## 5. One Paved Road per Product Class

The company maintains one default architecture for mobile apps and one for
simple games. Agents reuse approved components, libraries, CI, telemetry, and
release mechanisms. Deviations require an architecture decision record.

## 6. Production Is a Separate Standard

Experiments optimize for learning. Production products optimize for dependable
user outcomes. An experiment cannot become production without completing the
production promotion checklist.

## 7. Minimize Data and Privilege

Collect the least data, request the fewest permissions, expose the smallest API
surface, and grant agents the least access needed. Client applications are
untrusted; authorization is enforced by trusted services.

## 8. Prefer Boring Technology

Use mature, supported tools and built-in platform capabilities. A dependency or
custom abstraction must remove more risk or complexity than it introduces.

## 9. Design for Failure

Networks fail, devices go offline, processes terminate, data becomes stale, and
releases regress. Features define failure behavior, telemetry, recovery, and
rollback before implementation.

## 10. Automate Repeated Judgment Carefully

Automate deterministic checks aggressively. Use agents for contextual review,
but preserve human approval for high-impact decisions. Auto-merge is earned by
risk classification and evidence, not by speed.

## 11. Improve the System After Failures

Fix the immediate defect, add a regression test, and ask which missing
guardrail allowed it. Prefer improving templates, CI, or architecture over
adding reminders that agents can ignore.

