# Regulatory connector governance

KUMPLIO uses a manual-first policy for the Regulatory Evidence Engine.

## Priority of ingestion methods

1. Official API.
2. Official feed or structured JSON.
3. Stable official HTML.
4. Text-based PDF.
5. Scanned PDF only when no structured alternative exists.
6. OCR only as a documented last resort.

## Required controls before a connector is enabled

- Authority and canonical domain registered.
- Terms and access conditions reviewed.
- Rate limits and retry policy defined.
- Connector version recorded.
- Original response retained or placed in immutable storage.
- SHA-256 content hash calculated before parsing.
- Health and parser failure states visible.
- Previous captures and document versions preserved.
- No external client alert without human review.

## Trust rules

- A successful HTTP request does not prove legal applicability.
- A document version does not become verified merely because it was parsed.
- A claim cannot become supported without an exact citation tied to a captured version.
- An applicability assessment is tenant-specific and must state assumptions.
- Agent output is treated as a proposal until independently reviewed.

## Initial sources

The foundation registers LeyChile and Diario Oficial as official Chilean sources. Their terms remain `pending` and health remains `unknown` until a real connector or manual capture is validated.

No production scraper is enabled by this foundation.
