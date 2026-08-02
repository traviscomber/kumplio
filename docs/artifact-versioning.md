# Artifact Versioning Foundation

Apply and verify this increment in the following order:

1. `scripts/29-artifact-versioning.sql`
2. `scripts/30-artifact-lineage-hardening.sql`
3. `scripts/31-verify-artifact-versioning.sql`

The model preserves every generated artifact version, computes a SHA-256 content hash, infers workflow retry lineage, and locks approved versions. A later approved version supersedes the previous approved version without deleting or modifying its content.

Human review and artifact status changes are recorded atomically through `record_agent_artifact_review(...)`, which is executable only by the server `service_role`.
