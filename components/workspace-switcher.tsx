'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type WorkspaceOption = {
  organization_id: string
  organization_name: string
  role: string
  is_active: boolean
}

const roleLabels: Record<string, string> = {
  owner: 'Propietario',
  admin: 'Administrador',
  compliance: 'Cumplimiento',
  reviewer: 'Revisor',
  member: 'Miembro',
  viewer: 'Observador',
}

export function WorkspaceSwitcher() {
  const router = useRouter()
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadWorkspaces = useCallback(async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { data, error: loadError } = await supabase.rpc('list_my_workspaces')

    if (loadError) {
      setError('No fue posible cargar tus organizaciones.')
      setWorkspaces([])
    } else {
      setWorkspaces((data || []) as WorkspaceOption[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadWorkspaces()
  }, [loadWorkspaces])

  const active = useMemo(
    () => workspaces.find((workspace) => workspace.is_active) || workspaces[0] || null,
    [workspaces],
  )

  async function selectWorkspace(organizationId: string) {
    if (!organizationId || organizationId === active?.organization_id || switching) {
      setOpen(false)
      return
    }

    setSwitching(organizationId)
    setError(null)
    const supabase = createClient()
    const { error: switchError } = await supabase.rpc('set_active_workspace', {
      target_organization: organizationId,
    })

    if (switchError) {
      setError('No pudimos cambiar de organización. Verifica tu acceso.')
      setSwitching(null)
      return
    }

    setWorkspaces((current) => current.map((workspace) => ({
      ...workspace,
      is_active: workspace.organization_id === organizationId,
    })))
    setSwitching(null)
    setOpen(false)
    router.refresh()
  }

  if (loading) {
    return (
      <div className="hidden h-10 min-w-[150px] items-center gap-2 rounded-lg border border-border/70 px-3 text-xs text-muted-foreground md:flex">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Organización
      </div>
    )
  }

  if (!active) return null

  return (
    <div className="relative hidden md:block">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-10 max-w-[260px] items-center gap-2 rounded-lg border border-border/70 bg-card/60 px-3 text-left transition-colors hover:bg-muted"
      >
        <Building2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-bold text-foreground">{active.organization_name}</span>
          <span className="block truncate text-[10px] text-muted-foreground">
            {roleLabels[active.role] || 'Miembro'}
          </span>
        </span>
        {workspaces.length > 1 && <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
      </button>

      {open && workspaces.length > 1 && (
        <div
          role="listbox"
          aria-label="Cambiar organización activa"
          className="absolute right-0 top-12 z-50 w-[300px] overflow-hidden rounded-xl border border-border bg-popover p-2 shadow-xl"
        >
          <p className="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Organización activa
          </p>
          {workspaces.map((workspace) => {
            const selected = workspace.organization_id === active.organization_id
            const busy = switching === workspace.organization_id
            return (
              <button
                key={workspace.organization_id}
                type="button"
                role="option"
                aria-selected={selected}
                disabled={Boolean(switching)}
                onClick={() => void selectWorkspace(workspace.organization_id)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-muted disabled:cursor-wait disabled:opacity-60"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
                </div>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{workspace.organization_name}</span>
                  <span className="block text-xs text-muted-foreground">{roleLabels[workspace.role] || 'Miembro'}</span>
                </span>
                {selected && <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />}
              </button>
            )
          })}
          {error && <p className="px-3 pb-1 pt-2 text-xs text-destructive">{error}</p>}
        </div>
      )}

      {error && !open && (
        <span className="sr-only" role="status">{error}</span>
      )}
    </div>
  )
}
