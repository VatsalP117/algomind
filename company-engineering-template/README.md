# AI-Native Engineering Governance Starter

This repository is the company baseline for building low-risk mobile apps and
simple games with AI coding agents. Copy it into each product repository, then
replace bracketed placeholders and add stack-specific commands.

The system is designed for a small team that cannot review every changed line.
It shifts review toward explicit contracts, independent verification, automated
gates, small changes, and staged releases.

## Start Here

For any feature, bug fix, refactor, or operational change, follow the
[Task Delivery Runbook](TASK_DELIVERY_RUNBOOK.md). It is the canonical ordered
process from intake through specification, implementation, PR review, merge,
staged release, monitoring, and closure.

The other documents define the detailed rules linked from each runbook step.

## Adopt This Baseline

1. Choose one supported mobile stack and one supported game stack.
2. Create separate production-ready starter repositories for those stacks.
3. Copy these governance files into each starter.
4. Fill in commands, owners, metrics, environments, and release channels.
5. Configure protected branches and required CI checks.
6. Run one low-risk pilot product and revise the rules from observed failures.
7. Review this baseline every quarter and after every serious incident.

## Document Map

| Document | Purpose |
| --- | --- |
| `AGENTS.md` | Binding instructions for coding agents |
| `ENGINEERING_PRINCIPLES.md` | Durable company engineering values |
| `TASK_DELIVERY_RUNBOOK.md` | Exact task-to-release operating procedure |
| `AI_DEVELOPMENT_WORKFLOW.md` | Roles, model routing, and delivery loop |
| `RISK_CLASSIFICATION.md` | Product and change risk classification |
| `TESTING_STRATEGY.md` | Required test evidence by change type |
| `SECURITY_BASELINE.md` | Minimum mobile, privacy, and supply-chain controls |
| `REVIEW_AND_MERGE_POLICY.md` | Automated, agent, and human review rules |
| `RELEASE_POLICY.md` | Staged rollout, monitoring, rollback, and incidents |
| `templates/` | Required work artifacts |

## Precedence

When rules conflict, use this order:

1. Applicable law and platform policy
2. `SECURITY_BASELINE.md`
3. `RISK_CLASSIFICATION.md`
4. `REVIEW_AND_MERGE_POLICY.md`
5. Project-specific `AGENTS.md`
6. Feature specifications and task plans

An exception never silently overrides a higher-level rule. Record approved
exceptions in an architecture decision record.

## Deliberate Scope

This baseline excludes products whose primary purpose involves health advice,
financial decisions, children, real-money gaming, or highly sensitive personal
data. Entering one of those domains requires qualified legal and security
review and a revised governance baseline.

## Maintained References

- [NIST Secure Software Development Framework](https://csrc.nist.gov/pubs/sp/800/218/final)
- [OWASP Mobile Application Security Verification Standard](https://mas.owasp.org/MASVS/)
- [SLSA supply-chain specification](https://slsa.dev/spec/)
- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Data safety guidance](https://support.google.com/googleplay/android-developer/answer/10787469)
