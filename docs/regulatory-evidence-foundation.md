# Regulatory Evidence Engine Foundation

Apply this increment in the following order:

1. `scripts/32-regulatory-evidence-core.sql`
2. `scripts/33-regulatory-evidence-security.sql`
3. `scripts/34-regulatory-evidence-services.sql`
4. `scripts/36-regulatory-source-registry-seed.sql`
5. `scripts/35-verify-regulatory-evidence-foundation.sql`

## Trust boundaries

- Global official-source records are shared read-only metadata for authenticated users.
- Raw source payloads, response headers, provider errors and review decisions remain server-only.
- Tenant applicability assessments are isolated by organization and validated against project/case ownership.
- Captures, versions, sections, diffs, citations and review decisions are append-only.
- Claims are proposals until an exact citation and human review support them.
- No scraper, scheduler, OCR pipeline or external alert is enabled by this foundation.

## First operational target

The initial registry contains LeyChile and Diario Oficial. Both remain `terms_review_status = pending` and `health_status = unknown` until the access method, limits and connector behavior are validated.
