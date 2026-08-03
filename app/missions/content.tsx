'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, CircleDot, Search, Sparkles, Target } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

type Mission = {
  id: string
  title: string
  objective: string
  status: string
  priority: string
  updated_at: string
  playbook_id: string
}

type Playbook = {
  id: string
  slug: string
  name: string
  description: string | null
  objective: string
  vertical: string
  closing_criteria: unknown
}

type PlaybookCapability = {
  playbook_id: string
  sequence: number
  capability: { name: string; customer_outcome: string } | null
}

export function MissionsContent() {
  const [missions, setMissions] = useState<Mission[]>([])
  const [playbooks, setPlaybooks] = useState<Playbook[]>([])
  const [steps, setSteps] = useState<PlaybookCapability[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [warning, setWarning] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      try {
        const { data: auth } = await supabase.auth.getUser()
        if (!auth.user) {
          window.location.href = '/sign-in'
          return
        }

        const { data: membership } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', auth.user.id)
          .limit(1)
          .maybeSingle()

        const [playbooksResult, stepsResult] = await Promise.all([
          supabase
            .from('mission_playbooks')
            .select('id,slug,name,description,objective,vertical,closing_criteria')
            .eq('status', 'published')
            .order('name'),
          supabase
            .from('mission_playbook_capabilities')
            .select('playbook_id,sequence,capability:mission_capabilities(name,customer_outcome)')
            .order('sequence'),
        ])

        if (playbooksResult.error || stepsResult.error) {
          setWarning('No fue posible cargar toda la biblioteca de misiones.')
        }

        setPlaybooks((playbooksResult.data || []) as Playbook[])
        setSteps((stepsResult.data || []) as unknown as PlaybookCapability[])

        if (membership?.organization_id) {
          const { data: missionData } = await supabase
            .from('missions')
            .select('id,title,objective,status,priority,updated_at,playbook_id')
            .eq('organization_id', membership.organization_id)
            .order('updated_at', { ascending: false })
          setMissions((missionData || []) as Mission[])
        }
      } catch (error) {
        console.error('[missions] Load error:', error)
        setWarning('Ocurrió un error al cargar las misiones.')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  const filteredPlaybooks = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es-CL')
    if (!normalized) return playbooks
    return playbooks.filter((playbook) =>
      [playbook.name, playbook.description, playbook.objective, playbook.vertical]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase('es-CL').includes(normalized)),
    )
  }, [playbooks, query])

  const activeMissions = missions.filter((mission) => !['completed', 'cancelled'].includes(mission.status))

  if (loading) return <div className="py-20 text-center text-muted-foreground">Cargando la Biblioteca de Misiones…</div>

  return (
    <div className="space-y-8 pb-12">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-8">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative max-w-3xl">
          <p className="text-sm font-semibold text-primary">Misiones</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">¿Qué quieres lograr?</h1>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            Elige un resultado. Kumplio prepara el playbook, organiza las capacidades necesarias y mantiene la trazabilidad.
          </p>
          <div className="relative mt-6 max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por objetivo, industria o resultado"
              className="h-12 w-full rounded-xl border border-border bg-background pl-11 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </section>

      {warning && <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">{warning}</div>}

      {activeMissions.length > 0 && (
        <section>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-primary">En curso</p>
              <h2 className="mt-1 text-2xl font-bold">Tus misiones activas</h2>
            </div>
            <Link href="/dashboard" className="text-sm font-semibold text-primary hover:underline">Volver al Centro de Operaciones</Link>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {activeMissions.slice(0, 6).map((mission) => (
              <Link key={mission.id} href={`/missions/${mission.id}`} className="rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40 hover:-translate-y-0.5">
                <div className="flex items-center justify-between gap-3">
                  <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', mission.status === 'blocked' ? 'bg-red-500/10 text-red-600' : 'bg-primary/10 text-primary')}>
                    {mission.status === 'blocked' ? 'Bloqueada' : mission.status === 'in_review' ? 'En revisión' : 'En ejecución'}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-bold">{mission.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{mission.objective}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <div>
          <p className="text-sm font-semibold text-primary">Biblioteca</p>
          <h2 className="mt-1 text-2xl font-bold">Playbooks disponibles</h2>
          <p className="mt-2 text-sm text-muted-foreground">Procesos reutilizables construidos para transformar conocimiento regulatorio en resultados verificables.</p>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredPlaybooks.map((playbook) => {
            const capabilities = steps.filter((step) => step.playbook_id === playbook.id)
            return (
              <article key={playbook.id} className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/40">
                <div className="flex items-start justify-between gap-4">
                  <div className="rounded-xl bg-primary/10 p-3 text-primary"><Target className="h-5 w-5" /></div>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold capitalize text-muted-foreground">{playbook.vertical}</span>
                </div>
                <h3 className="mt-5 text-xl font-bold">{playbook.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{playbook.description || playbook.objective}</p>

                <div className="mt-5 space-y-3">
                  {capabilities.slice(0, 4).map((step) => (
                    <div key={`${step.playbook_id}-${step.sequence}`} className="flex gap-3">
                      <CircleDot className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div>
                        <p className="text-sm font-semibold">{step.capability?.name || 'Capacidad especializada'}</p>
                        {step.capability?.customer_outcome && <p className="mt-0.5 text-xs text-muted-foreground">{step.capability.customer_outcome}</p>}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-auto pt-6">
                  <Link href={`/missions/new?playbook=${playbook.slug}`} className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary/85">
                    Preparar esta misión
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </article>
            )
          })}
        </div>

        {!filteredPlaybooks.length && (
          <div className="mt-6 rounded-2xl border border-dashed border-border p-10 text-center">
            <Sparkles className="mx-auto h-6 w-6 text-primary" />
            <h3 className="mt-3 font-bold">No encontramos un playbook con ese criterio</h3>
            <p className="mt-2 text-sm text-muted-foreground">Prueba con Ley 21.719, protección de datos, auditoría o proveedor.</p>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4">
            <div className="rounded-xl bg-primary/10 p-3 text-primary"><CheckCircle2 className="h-5 w-5" /></div>
            <div>
              <h2 className="font-bold">Una misión termina con evidencia, no con un porcentaje</h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Cada playbook define resultados, criterios de cierre y revisión humana antes de declarar el trabajo completado.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
