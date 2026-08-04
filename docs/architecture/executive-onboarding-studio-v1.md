# Executive Intelligence, Onboarding and Kumplio Studio v1

## Executive Intelligence

`executive_intelligence_snapshots` stores reviewed, period-based management summaries. `executive_priorities` keeps the ranked actions behind each summary. A snapshot cannot be approved or published without reviewer metadata, and a published snapshot requires `published_at`.

The model is designed to aggregate risk, regulatory impacts, overdue work, evidence confidence, control coverage, benchmark position and estimated exposure without replacing the underlying source records.

## Accelerated onboarding

`onboarding_sessions` and `onboarding_steps` provide a resumable onboarding flow across organization, processes, assets, datasets, vendors, controls, policies and connectors.

`discovery_candidates` separates machine proposals from accepted enterprise truth. Candidates remain `proposed` until a reviewer accepts, rejects, merges or supersedes them. Fingerprints avoid duplicate discoveries.

## Kumplio Studio

`studio_definitions` and `studio_definition_versions` provide versioned definitions for rules, agents, workflows, playbooks, policy generators and risk models.

`studio_validation_runs` records schema, policy, permissions, tests and simulations. `studio_deployments` separates preview, sandbox and production and requires recorded approval before deployment or activation.

Initial private drafts:

- Privacy impact rule builder.
- Evidence review workflow.
- Executive risk agent.

All initial definitions prohibit automatic compliance approval, policy publication, official evidence validation and external messaging.

## Security

All tables use RLS, revoke direct access from public/anon/authenticated roles and are restricted to server-side service-role operations. No onboarding sessions, discoveries, executive snapshots or deployments are seeded for real organizations.