import assert from 'node:assert/strict'
import fs from 'node:fs'
import { resolveAuthenticatedAppAccess } from '../lib/product/authenticated-app-access.ts'

const unauthenticated = await resolveAuthenticatedAppAccess({
  nextPath: '/app/casos',
  getUser: async () => ({ userId: null, failed: false }),
  getWorkspace: async () => { throw new Error('workspace lookup must not run') },
})
assert.deepEqual(unauthenticated, { kind: 'redirect', href: '/sign-in?next=%2Fapp%2Fcasos' })

const authenticationFailure = await resolveAuthenticatedAppAccess({
  nextPath: '/app',
  getUser: async () => ({ userId: null, failed: true }),
  getWorkspace: async () => { throw new Error('workspace lookup must not run') },
})
assert.deepEqual(authenticationFailure, { kind: 'redirect', href: '/sign-in?next=%2Fapp' })

const queryContext = await resolveAuthenticatedAppAccess({
  nextPath: '/app/inicio?case=case-123',
  getUser: async () => ({ userId: null, failed: false }),
  getWorkspace: async () => { throw new Error('workspace lookup must not run') },
})
assert.deepEqual(queryContext, { kind: 'redirect', href: '/sign-in?next=%2Fapp%2Finicio%3Fcase%3Dcase-123' })

const missingWorkspace = await resolveAuthenticatedAppAccess({
  nextPath: '/app/inicio',
  getUser: async () => ({ userId: 'user-1', failed: false }),
  getWorkspace: async () => null,
})
assert.deepEqual(missingWorkspace, { kind: 'redirect', href: '/onboarding' })

const activeWorkspace = await resolveAuthenticatedAppAccess({
  nextPath: '/app/inicio',
  getUser: async () => ({ userId: 'user-1', failed: false }),
  getWorkspace: async (userId) => {
    assert.equal(userId, 'user-1')
    return { organizationId: 'active-org' }
  },
})
assert.deepEqual(activeWorkspace, { kind: 'ready', userId: 'user-1', organizationId: 'active-org' })

const appLayout = fs.readFileSync('app/app/layout.tsx', 'utf8')
assert.ok(
  !appLayout.includes("nextPath: '/app'"),
  'the authenticated layout must not collapse every requested route to /app before sign-in',
)
assert.ok(
  appLayout.includes("x-kumplio-authenticated-path"),
  'the authenticated layout must consume the request-scoped canonical app path',
)

const proxy = fs.readFileSync('proxy.ts', 'utf8')
assert.ok(proxy.includes("x-kumplio-authenticated-path"), 'proxy must preserve the requested /app path for the auth guard')
assert.ok(
  proxy.includes("pathname === '/app' || pathname.startsWith('/app/')"),
  'proxy must scope return-context forwarding to /app and its descendants only',
)
assert.ok(proxy.includes('request.nextUrl.search'), 'proxy must preserve query-string context such as the active case')

console.log('Authenticated app access behavior: PASS')
