# LeyChile controlled capture

The connector is intentionally disabled by default.

## Activation requirements

A controlled capture may run only when all of the following are true:

1. `KUMPLIO_LEYCHILE_CAPTURE_ENABLED=true` exists in the server environment.
2. The caller provides `termsApproved: true`.
3. The approved method is exactly `controlled_html`.
4. A non-empty approval reference is recorded.
5. The URL uses HTTPS, an allowed BCN host, the `/leychile/Navegar` path and a numeric `idNorma`.

The connector is not exposed through a public or customer API and no scheduler is installed.

## Network limits

- Maximum two redirects, each revalidated against the allowlist.
- 20 second default timeout.
- 5 MB maximum response body.
- Accepted MIME types: HTML, XHTML or plain text.
- Explicit KUMPLIO user-agent.
- No cache and no automatic credential forwarding.

## Processing order

1. Validate and canonicalize URL.
2. Fetch with strict redirect and size limits.
3. Hash the original response.
4. Parse articles and incisos deterministically.
5. Persist capture, document version and parsed sections in one database transaction.
6. Create claims only later, with an exact quote and human review.

## Offline validation

`node scripts/check-leychile-fixtures.mjs`

The fixture check uses synthetic documents and performs no network requests. It verifies article/inciso parsing, section hashes, deterministic change hashes, additions, removals and modifications.

## Current gate

The connector code may be deployed while capture remains disabled. The first official capture is a separate operational approval and validation event for Sprint 7.
