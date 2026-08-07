import 'server-only'

import { createPublicKey, verify as verifySignature } from 'node:crypto'

const ISSUER = 'https://token.actions.githubusercontent.com'
const JWKS_URL = `${ISSUER}/.well-known/jwks`
const AUDIENCE = 'kumplio-golden-path-e2e'
const REPOSITORY = 'traviscomber/kumplio'
const REF = 'refs/heads/main'
const WORKFLOW_REF = `${REPOSITORY}/.github/workflows/golden-path-e2e.yml@${REF}`
const MARKER = 'block02-golden-path'
const CLOCK_SKEW_SECONDS = 30

type JwtHeader = { alg?: string; kid?: string; typ?: string }
type GithubOidcClaims = {
  iss?: string
  aud?: string | string[]
  exp?: number
  nbf?: number
  iat?: number
  repository?: string
  ref?: string
  workflow_ref?: string
  sha?: string
  sub?: string
  event_name?: string
  [key: string]: unknown
}
type JsonWebKeyWithKid = JsonWebKey & { kid?: string; alg?: string; use?: string }

function decodeBase64Url(value: string) { return Buffer.from(value, 'base64url') }
function parseJsonPart<T>(value: string): T { return JSON.parse(decodeBase64Url(value).toString('utf8')) as T }
function audienceMatches(audience: GithubOidcClaims['aud']) {
  if (typeof audience === 'string') return audience === AUDIENCE
  return Array.isArray(audience) && audience.includes(AUDIENCE)
}

async function loadSigningKey(kid: string) {
  const response = await fetch(JWKS_URL, { cache: 'no-store', headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error('github_oidc_jwks_unavailable')
  const payload = await response.json() as { keys?: JsonWebKeyWithKid[] }
  const jwk = payload.keys?.find((candidate) => candidate.kid === kid && candidate.kty === 'RSA')
  if (!jwk) throw new Error('github_oidc_signing_key_not_found')
  return createPublicKey({ key: jwk, format: 'jwk' })
}

export async function verifyGithubActionsE2ERequest(request: Request) {
  if (request.headers.get('x-kumplio-e2e') !== MARKER) throw new Error('e2e_marker_required')
  const authorization = request.headers.get('authorization') || ''
  const match = authorization.match(/^Bearer\s+(.+)$/i)
  if (!match) throw new Error('github_oidc_token_required')

  const parts = match[1].split('.')
  if (parts.length !== 3) throw new Error('github_oidc_token_invalid')
  const [encodedHeader, encodedPayload, encodedSignature] = parts
  const header = parseJsonPart<JwtHeader>(encodedHeader)
  const claims = parseJsonPart<GithubOidcClaims>(encodedPayload)
  if (header.alg !== 'RS256' || !header.kid) throw new Error('github_oidc_algorithm_invalid')

  const publicKey = await loadSigningKey(header.kid)
  const signatureValid = verifySignature(
    'RSA-SHA256',
    Buffer.from(`${encodedHeader}.${encodedPayload}`),
    publicKey,
    decodeBase64Url(encodedSignature),
  )
  if (!signatureValid) throw new Error('github_oidc_signature_invalid')

  const now = Math.floor(Date.now() / 1000)
  if (claims.iss !== ISSUER) throw new Error('github_oidc_issuer_invalid')
  if (!audienceMatches(claims.aud)) throw new Error('github_oidc_audience_invalid')
  if (!claims.exp || claims.exp < now - CLOCK_SKEW_SECONDS) throw new Error('github_oidc_token_expired')
  if (claims.nbf && claims.nbf > now + CLOCK_SKEW_SECONDS) throw new Error('github_oidc_token_not_active')
  if (claims.repository !== REPOSITORY) throw new Error('github_oidc_repository_invalid')
  if (claims.ref !== REF) throw new Error('github_oidc_ref_invalid')
  if (claims.workflow_ref !== WORKFLOW_REF) throw new Error('github_oidc_workflow_invalid')
  if (!claims.sha || !/^[0-9a-f]{40}$/i.test(claims.sha)) throw new Error('github_oidc_sha_invalid')

  return {
    repository: claims.repository,
    ref: claims.ref,
    workflowRef: claims.workflow_ref,
    sha: claims.sha,
    subject: claims.sub || null,
    eventName: claims.event_name || null,
  }
}

export const GITHUB_ACTIONS_E2E_POLICY = {
  issuer: ISSUER,
  audience: AUDIENCE,
  repository: REPOSITORY,
  ref: REF,
  workflowRef: WORKFLOW_REF,
  marker: MARKER,
} as const
