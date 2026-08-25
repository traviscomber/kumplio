export type AuthenticatedAppAccessDecision =
  | { kind: 'redirect'; href: string }
  | { kind: 'ready'; userId: string; organizationId: string }

type AccessDependencies = {
  nextPath: string
  getUser: () => Promise<{ userId: string | null; failed: boolean }>
  getWorkspace: (userId: string) => Promise<{ organizationId: string } | null>
}

export async function resolveAuthenticatedAppAccess({
  nextPath,
  getUser,
  getWorkspace,
}: AccessDependencies): Promise<AuthenticatedAppAccessDecision> {
  const user = await getUser()
  if (user.failed || !user.userId) {
    return { kind: 'redirect', href: `/sign-in?next=${encodeURIComponent(nextPath)}` }
  }

  const workspace = await getWorkspace(user.userId)
  if (!workspace) return { kind: 'redirect', href: '/onboarding' }

  return {
    kind: 'ready',
    userId: user.userId,
    organizationId: workspace.organizationId,
  }
}
