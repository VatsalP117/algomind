# Testing Strategy

## Goal

Tests provide evidence about user outcomes and failure behavior. They do not
prove correctness, replace review, or justify poorly understood code.

## Test from Contracts

Acceptance tests derive from the approved feature specification. Include:

- intended user outcome;
- boundaries and invalid inputs;
- failure, retry, cancellation, and recovery;
- offline and interrupted lifecycle behavior where relevant;
- denied or revoked permissions;
- compatibility with existing persisted data;
- security and abuse cases for changed trust boundaries.

Prefer observable behavior over implementation details.

## Where Test-First Is Required

Write a failing test or executable reproduction before implementation for:

- bug fixes;
- business rules and calculations;
- state machines and progression logic;
- parsers, serializers, validators, and protocol adapters;
- persistence, migrations, and synchronization;
- API contracts;
- authorization and security controls.

For exploratory UI and game feel, prototypes may precede automated tests. Before
production merge, encode stable behavior with appropriate tests and evidence.

## Test Layers

### Unit

Use for deterministic domain behavior. Keep tests fast, isolated, and readable.
Property-based tests are encouraged for parsers, calculations, economies, and
invariants.

### Integration

Use real boundaries when practical: database, filesystem, platform adapter,
network client, serialization, authentication provider sandbox, or store
sandbox. Avoid mocks that merely restate implementation.

### End-to-End

Cover a small set of critical journeys on supported devices or emulators:
installation or first launch, core loop, persistence, recovery, and account or
purchase flows when present.

### Visual and Interaction

For user-interface changes, attach screenshots or recordings for relevant
states, sizes, themes, accessibility settings, loading, empty, and error states.
Use deterministic visual regression checks where stable.

### Game-Specific

Test:

- save/load round trips and version upgrades;
- progression and economy invariants;
- deterministic simulations where possible;
- pause, background, resume, interruption, and low-memory recovery;
- frame-time, memory, startup, and asset budgets;
- long-running or accelerated sessions for leaks and state corruption.

## Requirements by Risk

| Evidence | Tier 1 | Tier 2 | Tier 3 |
| --- | --- | --- | --- |
| Relevant unit tests | As applicable | Required | Required |
| Integration tests | As applicable | Required for changed boundary | Required |
| Critical journey smoke test | As applicable | Required | Required |
| UI/gameplay evidence | For visible changes | Required | Required |
| Adversarial/security tests | No | As applicable | Required |
| Migration/rollback test | No | If applicable | Required if applicable |
| Real device or platform sandbox | Optional | As applicable | Required when platform behavior is material |

## Coverage and Quality

- Do not set a company-wide total coverage target.
- CI may enforce changed-code coverage as a warning or minimum for testable
  domain logic.
- Never add assertions solely to raise coverage.
- Mutation testing may be used periodically on critical pure logic.
- Snapshot tests require focused scope and meaningful review.
- A flaky test is a defect. Quarantine only with an owner and expiry date.

## Test Ownership

The executor may add implementation-level tests but may not silently weaken
acceptance tests. Test changes in the same PR must be explicitly explained.
Reviewers inspect whether tests would fail for plausible wrong implementations.

## Evidence Record

The PR includes:

- tests added or changed;
- commands and environments used;
- results;
- checks not run and why;
- remaining scenarios that rely on post-release monitoring.

