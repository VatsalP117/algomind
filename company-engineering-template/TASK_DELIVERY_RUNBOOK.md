# Task Delivery Runbook

This is the canonical step-by-step process for taking production work from an
idea to a monitored release. Start here for every feature, bug fix, refactor, or
operational change.

Detailed rules live in the linked policies. This runbook defines the order,
owners, required artifacts, gates, and failure paths.

## Workflow States

Every production task moves through these states:

`intake` -> `specified` -> `risk-classified` -> `verification-designed` ->
`planned` -> `implementing` -> `locally-verified` -> `in-review` ->
`approved` -> `merged` -> `release-candidate` -> `rolling-out` ->
`monitoring` -> `complete`

A task may move backward when a gate fails. It must not skip a state unless an
emergency exception is approved under
[Review and Merge Policy](REVIEW_AND_MERGE_POLICY.md#exceptions).

## Roles Used Below

- **Founder:** owns product intent, risk acceptance, and sensitive approvals.
- **Planner:** strong model working from approved product intent.
- **Test designer:** strong model in a fresh context.
- **Executor:** cost-efficient model for bounded implementation.
- **Reviewer:** strong model in a fresh context that did not implement the task.
- **Release operator:** authorized human or constrained automation.

See [AI Development Workflow](AI_DEVELOPMENT_WORKFLOW.md#roles) for model
routing and role-separation rules.

## Step 1: Create the Work Item

**Owner:** Founder with a strong model

1. State the user or operational problem in one paragraph.
2. Choose `experiment` or `production`.
3. Link related incidents, feedback, designs, and prior decisions.
4. Name one accountable human owner.

**Required artifact:**

- Experiment: [Experiment Charter](templates/experiment-charter.md)
- Production: draft [Feature Specification](templates/feature-spec.md)

**Gate:** The problem, owner, track, and desired outcome are identifiable.

**If the gate fails:** Keep the item in `intake`; do not ask an executor to
start coding.

## Step 2: Approve the Specification

**Owner:** Founder with a strong model

1. Complete the [Feature Specification](templates/feature-spec.md).
2. Define observable acceptance criteria and explicit non-goals.
3. Define failure, offline, interruption, and recovery behavior where relevant.
4. Record data, permissions, third parties, accessibility, performance,
   telemetry, rollout, and recovery expectations.
5. Resolve product questions or record an owner for each remaining question.

Follow [Engineering Principles](ENGINEERING_PRINCIPLES.md), especially evidence,
small vertical slices, minimal privilege, and design for failure.

**Gate:** The founder approves the user outcome, acceptance criteria, non-goals,
data use, monetization, and product tradeoffs.

**If the gate fails:** Revise the specification. Code is not an acceptable way
to discover an unresolved product decision for production work.

## Step 3: Classify Risk

**Owner:** Planner; founder confirms Tier 2 and Tier 3

1. Apply [Risk Classification](RISK_CLASSIFICATION.md).
2. Record the product track, change tier, rationale, affected data, permissions,
   trust boundaries, dependencies, and rollback difficulty.
3. Raise the tier when uncertainty or a risk escalator applies.
4. Stop if the product is in an excluded domain.

**Required artifact:** Approved specification containing risk tier and approval.

**Gate:**

- Tier 1: classification recorded.
- Tier 2: named human approver recorded.
- Tier 3: founder accepts the classification and required sensitive-review path.

**If the gate fails:** Treat the task as one tier higher or obtain human
clarification.

## Step 4: Design Verification Before Implementation

**Owner:** Test designer in a fresh context

1. Read the approved specification without relying on an implementation plan.
2. Map every acceptance criterion to a test or another concrete form of
   evidence.
3. Add boundary, invalid-input, lifecycle, offline, retry, cancellation,
   compatibility, and abuse scenarios as applicable.
4. Identify which tests must fail before implementation.
5. Identify required screenshots, recordings, device checks, performance
   measurements, and release telemetry.

Use [Testing Strategy](TESTING_STRATEGY.md) for required layers and
risk-specific evidence.

**Required artifact:** Verification section in the specification or linked test
design containing:

- acceptance-criterion-to-evidence mapping;
- tests to add or change;
- manual or device evidence;
- security and adversarial cases;
- checks that will run in CI.

**Gate:** Each acceptance criterion is verifiable, and the evidence matches the
risk tier.

**If the gate fails:** Improve the specification or test design before
implementation.

## Step 5: Create the Implementation Plan

**Owner:** Planner using a strong model

1. Inspect the current repository, tests, architecture decisions, and local
   [Agent Instructions](AGENTS.md).
2. Divide the feature into small vertical tasks using the
   [Task Template](templates/task.md).
3. Give each task one measurable outcome, scope boundary, dependencies,
   verification commands, and stop conditions.
4. Order tasks so the default branch remains buildable and secure.
5. Create an [Architecture Decision](templates/architecture-decision.md) when
   deviating from the paved road or making a consequential hard-to-reverse
   choice.

**Gate:** Each task can be implemented and reviewed independently, or has an
explicit dependency on one prior task. Broad or ambiguous tasks are split.

**If the gate fails:** Re-plan. Do not compensate for a vague task by giving an
executor unrestricted autonomy.

## Step 6: Prepare the Branch and Executor Context

**Owner:** Planner or automation

1. Update the local default branch from the protected remote.
2. Create a short-lived task branch.
3. Give the executor only:
   - repository instructions;
   - approved specification;
   - current task;
   - verification design;
   - relevant architecture decisions and code context.
4. Confirm the executor has no production secrets, user data, signing keys, or
   unrestricted deployment credentials.

Follow the access boundaries in
[Security Baseline](SECURITY_BASELINE.md#repository-and-agent-controls).

**Gate:** The branch starts from an approved revision, context is complete, and
access is least-privileged.

**If the gate fails:** Correct the branch or access before implementation.

## Step 7: Establish the Failing Check

**Owner:** Executor

For test-first work required by
[Testing Strategy](TESTING_STRATEGY.md#where-test-first-is-required):

1. Add or run the smallest test or reproduction that demonstrates missing or
   incorrect behavior.
2. Confirm it fails for the expected reason.
3. Record the command and relevant failure.

For visual or exploratory work where a failing automated test is not practical,
record the before-state and the exact evidence that will prove completion.

**Gate:** The executor can distinguish the current incorrect state from the
required state.

**If the gate fails:** Stop and ask the planner or test designer to clarify the
contract. Do not implement against an unverifiable interpretation.

## Step 8: Implement the Bounded Task

**Owner:** Executor

1. Make the smallest coherent change satisfying the current task.
2. Follow existing architecture and [Agent Instructions](AGENTS.md).
3. Add implementation-level tests without weakening protected acceptance tests.
4. Keep unrelated refactors and formatting churn out of the diff.
5. Update documentation, telemetry, migrations, or generated artifacts required
   by the task.
6. Re-run focused checks while iterating.

The executor has two materially different implementation attempts. Repeating
minor variations does not reset the budget.

**Gate:** The task outcome is implemented within scope.

**If the gate fails:**

- Stop immediately when an `AGENTS.md` stop condition is reached.
- After two failed approaches, preserve evidence and escalate to a strong model.
- Return to Step 2, 4, or 5 when the failure reveals a specification, test, or
  plan defect.

## Step 9: Complete Local Verification

**Owner:** Executor

1. Run focused tests.
2. Run the repository's formatter, linter, compiler or type checker, complete
   relevant test suite, production build, and security checks.
3. Produce screenshots, recordings, performance output, or device evidence for
   changed behavior.
4. Inspect the final diff for secrets, accidental files, unrelated changes, and
   unexplained generated output.
5. Complete the task's completion report.

Required evidence is defined by
[Testing Strategy](TESTING_STRATEGY.md#requirements-by-risk) and
[Security Baseline](SECURITY_BASELINE.md#minimum-security-gates).

**Gate:** All applicable local checks pass. Every skipped or unavailable check
is documented with its reason and risk.

**If the gate fails:** Return to Step 8. A check that did not run is never
reported as passing.

## Step 10: Open the Pull Request

**Owner:** Executor or automation

1. Rebase or update the branch according to repository policy.
2. Push the branch and open a PR using the
   [Pull Request Template](templates/pull-request.md).
3. Link the approved specification, task, architecture decisions, and related
   issue.
4. Include risk rationale, test results, visible evidence, data and permission
   changes, rollout metrics, and recovery steps.
5. Request required automated checks and reviewers.

Follow [Review and Merge Policy](REVIEW_AND_MERGE_POLICY.md#required-pr-evidence).

**Gate:** The PR is reviewable without reconstructing intent from the code, and
CI is running against the current revision.

**If the gate fails:** Complete the evidence or split the PR before review.

## Step 11: Run Automated Gates

**Owner:** CI

Run all applicable gates listed in
[Review and Merge Policy](REVIEW_AND_MERGE_POLICY.md#automated-gates), including
the production build and release-artifact smoke tests where configured.

**Gate:** Every required check passes against the current commit. Required
checks are not stale, skipped, neutral, or manually bypassed.

**If the gate fails:** The executor fixes implementation failures. Escalate
flaky or infrastructure failures to their owner; do not weaken the gate inside
the feature PR.

## Step 12: Perform Independent Agent Review

**Owner:** Reviewer using a strong model in a fresh context

1. Read the specification, task, risk tier, diff, and test evidence.
2. Prefer reviewing the diff before reading the executor's explanatory
   narrative when tooling permits.
3. Map acceptance criteria to code and evidence.
4. Inspect error paths, trust boundaries, data flow, compatibility, lifecycle,
   concurrency, offline behavior, dependencies, and architecture fit.
5. Add or request adversarial tests when passing evidence is insufficient.
6. Issue one verdict: `approve`, `request changes`, or `escalate to human`.

Use the complete checklist in
[Review and Merge Policy](REVIEW_AND_MERGE_POLICY.md#independent-agent-review).

**Gate:** No unresolved blocking finding remains, and the reviewer is
independent from the executor.

**If the gate fails:** Return findings to Step 8. Re-run Steps 9-12 after every
code change. Return to an earlier design step if the finding exposes a contract
or architecture problem.

## Step 13: Obtain Human Approval

**Owner:** Required human approver

Apply [Review and Merge Policy](REVIEW_AND_MERGE_POLICY.md#human-approval):

- Tier 1 may auto-merge only after the repository has earned that privilege.
- Tier 2 requires a named human approver unless a narrow class is explicitly
  delegated.
- Tier 3 always requires founder approval of the sensitive evidence and critical
  code paths.

The human reviews unresolved uncertainty and risk evidence, not every line by
default.

**Gate:** Required approval is recorded on the current revision.

**If the gate fails:** Address the concern and repeat Steps 9-13. Approval on an
older revision does not carry forward when the change invalidates it.

## Step 14: Merge

**Owner:** Authorized human or merge automation

1. Confirm all conditions in
   [Merge Blocks](REVIEW_AND_MERGE_POLICY.md#merge-blocks) are clear.
2. Confirm checks and approvals apply to the current revision.
3. Merge using the repository's standard strategy.
4. Delete the task branch when policy and tooling allow.
5. Keep the linked specification and evidence discoverable from the merged PR.

**Gate:** The protected default branch contains the approved change and its CI
passes.

**If the gate fails after merge:** Stop promotion, open a corrective task, and
revert or fix forward according to impact. Do not release a known-bad default
branch.

## Step 15: Create and Verify the Release Candidate

**Owner:** Release operator

1. Select an approved default-branch revision.
2. Build the release artifact in controlled CI.
3. Record source revision, dependency lockfiles, build logs, artifact hashes,
   release notes, and provenance where available.
4. Run release-build smoke tests on supported emulators, devices, or platform
   sandboxes.
5. Confirm production configuration, privacy disclosures, telemetry, feature
   flags, and rollback controls.

Follow [Release Policy](RELEASE_POLICY.md#artifact-integrity).

**Gate:** The exact release artifact is traceable to the reviewed revision and
passes release verification.

**If the gate fails:** Do not patch the artifact manually. Fix through a new PR
and repeat the required workflow.

## Step 16: Approve Production Promotion

**Owner:** Release approver

Apply [Release Authority](RELEASE_POLICY.md#release-authority):

- Tier 1 may use approved release automation.
- Tier 2 requires named human approval.
- Tier 3 requires founder approval and active monitoring.

Before approval, confirm rollout stages, numeric health thresholds, observation
window, previous known-good version, containment, and recovery ownership.

**Gate:** Promotion approval and release criteria are recorded.

**If the gate fails:** Keep the artifact in the internal or beta channel.

## Step 17: Roll Out in Stages

**Owner:** Release operator

Follow [Staged Rollout](RELEASE_POLICY.md#staged-rollout):

1. Internal distribution.
2. Closed beta or small production percentage.
3. Expanded percentage after the observation gate passes.
4. Full rollout after all health gates pass.

At each stage:

1. Verify installation, launch, core journey, persistence, and recovery.
2. Compare health metrics with predefined thresholds and the previous version.
3. Record the decision to expand, hold, or roll back.

**Gate:** Required health metrics remain within threshold for the observation
window.

**If the gate fails:** Halt expansion. Contain, roll back, or fix forward using
[Rollback and Recovery](RELEASE_POLICY.md#rollback-and-recovery).

## Step 18: Monitor and Close

**Owner:** Release operator and task owner

1. Monitor the signals in
   [Required Health Signals](RELEASE_POLICY.md#required-health-signals).
2. Confirm acceptance criteria in production or the approved release
   environment.
3. Confirm no material crash, support, data, performance, progression, or
   economy regression.
4. Close the task only after its observation window ends.
5. Record follow-up work without hiding known release defects.

**Gate:** The change is fully rolled out, healthy, supportable, and has no open
blocking follow-up.

**If the gate fails:** Enter incident handling or create a prioritized
corrective task.

## Step 19: Handle Incidents and Improve the System

**Owner:** Founder or incident owner

When material harm, data risk, or severe regression occurs:

1. Follow [Incident Response](RELEASE_POLICY.md#incident-response).
2. Complete the [Incident Report](templates/incident-report.md).
3. Add a regression test or reproducible monitor.
4. Identify which specification, test, CI, review, access, or release guardrail
   failed.
5. Improve the reusable starter or policy rather than relying on memory.

**Gate:** Recovery is verified, corrective actions have owners and dates, and at
least one reusable prevention or detection improvement is considered.

## Pull Request Loop

Any code change after review begins invalidates affected evidence:

`change requested` -> `implement` -> `local verification` -> `CI` ->
`independent review` -> `human approval if required`

Never merge merely because an earlier revision passed.

## Bug-Fix Shortcut

A bug fix still follows the complete workflow, but one artifact may serve as
both intake and specification when it includes:

- observed and expected behavior;
- reproducible failing test;
- impact and risk tier;
- scope and non-goals;
- release and recovery expectations.

Do not use the shortcut for Tier 3 changes or incidents with unresolved user or
data impact.

## Completion Definition

A production task is complete only when:

- the approved outcome is present;
- required tests and checks pass;
- independent review and human approval requirements are satisfied;
- the reviewed revision was merged and built through controlled CI;
- staged rollout and monitoring gates pass;
- evidence is linked and follow-up risks are owned.

