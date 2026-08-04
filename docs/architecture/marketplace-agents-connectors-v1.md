# Marketplace, Multi-Agent Runtime and Enterprise Connectors v1

## Marketplace

The marketplace stores reusable, versioned resources without exposing organization data. Items and versions remain private drafts until reviewed and released. Organization installations start in `pending_review`; installed or approved states require a reviewer and timestamp.

Initial private drafts:

- Privacy controls starter pack
- Privacy policies starter pack
- Privacy agent team

## Multi-Agent Runtime

Canonical agents are versioned separately from organization installations. Initial draft specialists:

- Supervisor
- Legal
- Privacy
- Controls
- Evidence
- Risk

Every agent version defines allowed tools, denied actions, schemas and escalation policy. Runs preserve the execution plan and ordered steps. Agents cannot approve compliance, publish policies, validate evidence, grant permissions or send external messages.

## Enterprise Connectors

The connector catalog initially describes Microsoft 365, Google Workspace, SharePoint, Buk, Talana, HubSpot, Salesforce and GitHub.

Organization connections store only a credential reference, never a raw secret. Connections require approval before becoming connected or paused. Sync runs preserve mode, cursors, metrics and error codes. Discovered resources remain unclassified or proposed until human review.

## Security guarantees

- RLS enabled on every new table.
- `PUBLIC`, `anon` and `authenticated` privileges revoked.
- Backend access through `service_role` only.
- No automatic publication, installation, connection or agent activation.
- No organization records or synthetic sync results seeded.
- Human approval required for privileged lifecycle transitions.
