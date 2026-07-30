# Release Policy

## Principles

A passing build is a release candidate, not proof of production health.
Production releases are reproducible, staged, observable, and reversible.

## Release Readiness

Before the first production release, document:

- supported platforms and minimum versions;
- environments and configuration ownership;
- application identifiers and store accounts;
- signing and credential custody;
- data inventory, privacy policy, and store disclosures;
- dashboards, alerts, and support channel;
- backup, deletion, recovery, and incident procedures;
- rollback or forward-recovery path.

## Artifact Integrity

- Build store artifacts in controlled CI from reviewed commits.
- Keep source revision, dependency lockfiles, build logs, artifact hashes, and
  release notes.
- Separate development, test, and production configuration.
- Restrict signing and store publication credentials.
- Verify the submitted binary was produced by the approved workflow.

## Staged Rollout

Default production sequence:

1. Automated tests and release-build smoke tests.
2. Internal team distribution.
3. Closed beta or small production percentage.
4. Expanded rollout after a defined observation window.
5. Full rollout after health metrics remain within thresholds.

Tier 3 changes use feature flags or another tested containment mechanism where
practical. Kill switches must fail safely and must not create an unreviewed
remote-code path.

## Required Health Signals

Every production product tracks:

- crash-free sessions and affected users;
- startup failure and application-not-responding rate where available;
- core user journey completion;
- API error rate and latency;
- release adoption and version;
- support or feedback signals.

Games additionally track frame time, memory, startup duration, save failures,
progression anomalies, and economy invariants.

Define numeric release thresholds per product before launch. An agent may
summarize metrics, but rollback decisions for ambiguous or severe impact remain
human-owned.

## Rollback and Recovery

Each significant release identifies:

- previous known-good version;
- feature flags or server-side containment;
- schema compatibility window;
- rollback steps and owner;
- user-data recovery or reconciliation;
- communication needs.

Database and save-format changes should support mixed application versions and
prefer expand-migrate-contract sequencing. Never assume store rollback is
instant; design server compatibility and kill switches accordingly.

## Release Authority

- Tier 1: automation may release through an approved staged workflow.
- Tier 2: named human approval is required for production promotion.
- Tier 3: founder approval and active monitoring are required.
- Routine coding agents cannot access production consoles, signing keys, or
  unrestricted deployment credentials.

## Incident Response

When a release harms users or threatens data:

1. Contain: halt rollout, disable the feature, roll back, or restrict access.
2. Preserve evidence: versions, logs, timelines, actions, and affected scope.
3. Assess data, security, legal, platform, and communication impact.
4. Recover and verify the critical user journeys.
5. Complete `templates/incident-report.md`.
6. Add regression coverage and improve the failed guardrail.

Do not wait for root-cause certainty before containing material harm.

## Experiment Promotion

An experiment becomes production only after:

- ownership and support lifetime are accepted;
- production architecture and dependencies are reviewed;
- tests and CI meet the production baseline;
- security and data inventories are complete;
- privacy and store declarations are accurate;
- observability, release, and rollback are operational;
- temporary shortcuts are removed or recorded with owners and deadlines.

