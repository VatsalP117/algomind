# Risk Classification

Classify both the product and every production change. When categories conflict,
use the highest applicable tier.

## Product Tracks

### Experiment

Purpose: validate demand or interaction quickly.

Requirements:

- low-risk domain only;
- no sensitive personal data;
- no irreplaceable user-generated data;
- no production payment handling;
- analytics and crash reporting;
- explicit owner, hypothesis, success metric, and expiry date;
- distribution limited to internal or controlled test audiences unless a
  founder approves wider release.

An experiment expires after 90 days by default. Promote it through a production
readiness review or retire it.

### Production

Purpose: serve external users over an expected ongoing lifetime.

Requires all governance documents, protected branches, CI gates, observability,
data inventory, staged release, support ownership, and rollback capability.

## Excluded Product Domains

Do not launch under this baseline when the product's primary purpose involves:

- medical diagnosis, treatment, or health advice;
- financial, credit, insurance, tax, or investment decisions;
- children as a target audience;
- gambling, wagering, or real-money games;
- highly sensitive identity, biometric, precise-location, or communications
  data.

Exploration requires qualified legal and security review before coding.

## Change Tiers

### Tier 1: Routine

Low blast radius and no trust-boundary change.

Examples:

- copy and static visual adjustments;
- isolated UI behavior without persistence;
- tests and internal tooling;
- refactoring with equivalent observable behavior;
- asset or level-content changes without economy impact.

Required approval: automated gates plus independent agent review. Eligible for
auto-merge when the repository has earned it.

### Tier 2: Significant

User-visible or operational behavior with bounded recoverable impact.

Examples:

- persisted state or save-game changes;
- API integration;
- notifications, deep links, background tasks, or offline synchronization;
- new analytics events or non-sensitive data collection;
- gameplay progression, virtual economy, or scoring changes;
- performance-sensitive rendering or resource loading;
- new third-party dependency without sensitive access.

Required approval: automated gates, independent strong-model review, staged
release, and a named human approver unless a founder has explicitly delegated a
narrow recurring class.

### Tier 3: Sensitive

Could expose data, cause irreversible loss, cross a security boundary, create
financial impact, or materially affect platform compliance.

Examples:

- authentication or authorization;
- payments, subscriptions, ads targeting, or purchase restoration;
- schema migrations, deletion, export, backup, or account recovery;
- cryptography, secrets, signing, release infrastructure, or CI permissions;
- new device permissions or SDKs that collect or share user data;
- user-generated content, moderation, or public sharing;
- remote configuration capable of bypassing review;
- public API compatibility or major architecture changes.

Required approval:

- threat or abuse-case review;
- automated gates and independent strong-model review;
- founder review of evidence and critical code paths;
- explicit rollback or forward-recovery procedure;
- staged release with active monitoring.

Tier 3 changes are never auto-merged or autonomously released.

## Risk Escalators

Raise a change by at least one tier when:

- requirements or ownership are ambiguous;
- the change is unusually broad or crosses multiple architectural boundaries;
- tests are flaky, absent, or cannot model the risk;
- rollback is difficult;
- a dependency is unmaintained or behavior is opaque;
- the agent cannot explain a security-sensitive code path;
- production data is required for verification;
- the change follows an incident or active exploitation.

## Classification Record

Every PR records:

- product track;
- risk tier and rationale;
- affected data, permissions, trust boundaries, and dependencies;
- required approvers and release strategy.

Reviewers may only raise risk. Lowering risk requires a human approver and
written rationale.

