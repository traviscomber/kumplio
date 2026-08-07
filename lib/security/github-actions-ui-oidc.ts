import 'server-only'

import { createPublicKey, verify as verifySignature, type JsonWebKey } from 'node:crypto'

const ISSUER = 'https://token.actions.githubusercontent.com'
const JWKS_URL = `${ISSUER}/.well-known/jwks`
const AUDIENCE = 'kumplio-ui-golden-path'
const REPOSITORY = 'traviscomber/kumplio'
const REPOSITORY_ID = '1260929467'
const REPOSITORY_OWNER = 'traviscomber'
const REPOSITORY_OWNER_ID = '208325741'
const REF = 'refs/heads/main'
const WORKFLOW = 'UI Golden Path'
const WORKFLOW_REF = `${REPOSITORY}/.github/workflows/ui-golden-path.yml@${REF}`
const CLOCK_SKEW_SECONDS = 60

type JwtHeader = { alg?: string; kid?: string; typ?: string }
type GithubJwk = JsonWebKey & { kid?: string; alg?: string; use?: string }

export type GithubActionsUiClaims = {
  iss?: string
  aud?: string | string[]
  sub?: string
  exp?: number
  nbf?: number
  iat?: number
  repository?: string
  repository_id?: string
  repository_owner?: string
  repository_owner_id?: string
  repository_visibility?: string
  event_name?: string
  ref?: string
  ref_type?: string
  sha?: string
  workflow?: string
  workflow_ref?: string
  workflow_sha?: string
  run_id?: string
  run_number?: string
  run_attempt?: string
  runner_environment?: string
}

export async function verifyGithubActionsUiRequest(request: Request, expectedCommitSha: string) {
  const authorization = request.headers.get('authorization') || ''
  const match = authorization.match(/^Bearer\s+(.+)$/i)
  if (!match?.[1]) throw new Error('ui_oidc_token_required')

  const parts = match[1].split('.')
  if (parts.length !== 3) throw new Error('ui_oidc_token_invalid')
  const [encodedHeader, encodedPayload, encodedSignature] = parts
  const header = parseJsonPart<JwtHeader>(encodedHeader)
  const claims = parseJsonPart<GithubActionsUiClaims>(encodedPayload)
  if (header.alg !== 'RS256' || !header.kid) throw new Error('ui_oidc_algorithm_invalid')

  const publicKey = await loadSigningKey(header.kid)
  const signatureValid = verifySignature(
    'RSA-SHA256',
    Buffer.from(`${encodedHeader}.${encodedPayload}`),
    publicKey,
    decodeBase64Url(encodedSignature),
  )
  if (!signatureValid) throw new Error('ui_oidc_signature_invalid')

  validateClaims(claims, expectedCommitSha)
  return {
    commitSha: claims.sha as string,
    workflowSha: claims.workflow_sha as string,
    runId: claims.run_id as string,
    runAttempt: claims.run_attempt as string,
    actor: typeof claims.repository_owner === 'string' ? claims.repository_owner : null,
  }
}

function validateClaims(claims: GithubActionsUiClaims, expectedCommitSha: string) {
  const now = Math.floor(Date.now() / 1000)
  const audiences = typeof claims.aud === 'string' ? [claims.aud] : claims.aud || []
  const legacySubject = `repo:${REPOSITORY}:ref:${REF}`
  const immutableSubject = `repo:${REPOSITORY_OWNER}@${REPOSITORY_OWNER_ID}/kumplio@${REPOSITORY_ID}:ref:${REF}`

  if (claims.iss !== ISSUER) throw new Error('ui_oidc_issuer_invalid')
  if (!audiences.includes(AUDIENCE)) throw new Error('ui_oidc_audience_invalid')
  if (!claims.sub || ![legacySubject, immutableSubject].includes(claims.sub)) throw new Error('ui_oidc_subject_invalid')
  if (!claims.exp || claims.exp < now - CLOCK_SKEW_SECONDS) throw new Error('ui_oidc_token_expired')
  if (!claims.iat || claims.iat > now + CLOCK_SKEW_SECONDS) throw new Error('ui_oidc_issued_at_invalid')
  if (claims.nbf && claims.nbf > now + CLOCK_SKEW_SECONDS) throw new Error('ui_oidc_token_not_active')

  if (claims.repository !== REPOSITORY || claims.repository_id !== REPOSITORY_ID) throw new Error('ui_oidc_repository_invalid')
  if (claims.repository_owner !== REPOSITORY_OWNER || claims.repository_owner_id !== REPOSITORY_OWNER_ID) throw new Error('ui_oidc_owner_invalid')
  if (claims.repository_visibility && claims.repository_visibility !== 'public') throw new Error('ui_oidc_visibility_invalid')
  if (claims.event_name !== 'push' || claims.ref !== REF || (claims.ref_type && claims.ref_type !== 'branch')) throw new Error('ui_oidc_event_invalid')
  if (claims.workflow !== WORKFLOW || claims.workflow_ref !== WORKFLOW_REF) throw new Error('ui_oidc_workflow_invalid')
  if (claims.runner_environment && claims.runner_environment !== 'github-hosted') throw new Error('ui_oidc_runner_invalid')
  if (claims.sha !== expectedCommitSha || claims.workflow_sha !== expectedCommitSha) throw new Error('ui_oidc_commit_invalid')
  if (!claims.run_id || !/^\d+$/.test(claims.run_id) || !claims.run_attempt || !/^\d+$/.test(claims.run_attempt)) {
    throw new Error('ui_oidc_run_invalid')
  }
}

async function loadSigningKey(kid: string) {
  const response = await fetch(JWKS_URL, { cache: 'no-store', headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error('ui_oidc_jwks_unavailable')
  const payload = await response.json() as { keys?: GithubJwk[] }
  const jwk = payload.keys?.find((candidate) => candidate.kid === kid && candidate.kty === 'RSA')
  if (!jwk) throw new Error('ui_oidc_signing_key_not_found')
  return createPublicKey({ key: jwk, format: 'jwk' })
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, 'base64url')
}

function parseJsonPart<T>(value: string): T {
  try {
    return JSON.parse(decodeBase64Url(value).toString('utf8')) as T
  } catch {
    throw new Error('ui_oidc_payload_invalid')
  }
}

export const GITHUB_ACTIONS_UI_POLICY = {
  issuer: ISSUER,
  audience: AUDIENCE,
  repository: REPOSITORY,
  repositoryId: REPOSITORY_ID,
  ref: REF,
  workflow: WORKFLOW,
  workflowRef: WORKFLOW_REF,
} as const
