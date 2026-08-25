import assert from 'node:assert/strict'
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

console.log('Authenticated app access behavior: PASS')
