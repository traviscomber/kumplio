import Link from 'next/link'
import { ArrowLeft, CalendarDays, CheckCircle2, Target, Users } from 'lucide-react'
import { redirect } from 'next/navigation'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'
import { createMissionAction } from './actions'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{
  playbook?: string
  playbookId?: string
  error?: string
}>

const errorMessages: Record<string, string> = {
  missing_fields: 'Completa el nombre de la misión y selecciona un playbook.',
  organization_missing: 'Tu cuenta todavía no está vinculada a una organización.',
  create_failed: 'No fue posible crear la misión. Revisa los datos e inténtalo nuevamente.',
}

export default async function NewMissionPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/sign-in')

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  const [{ data: playbooks }, { data: members }] = await Promise.all([
    supabase
      .from('mission_playbooks')
      .select('id,slug,name,description,objective,vertical,closing_criteria')
      .eq('status', 'published')
      .order('name'),
    membership?.organization_id
      ? supabase
          .from('organization_members')
          .select('user_id,role,profile:profiles(first_name,last_name,email)')
          .eq('organization_id', membership.organization_id)
      : Promise.resolve({ data: [] }),
  ])

  const selected = (playbooks || []).find(
    (playbook) => playbook.id === query.playbookId || playbook.slug === query.playbook,
  ) || playbooks?.[0]

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <Link href="/missions" className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a la Biblioteca de Misiones
          </Link>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
              <p className="text-sm font-semibold text-primary">Nueva misión</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">Prepara el trabajo antes de comenzar</h1>
              <p className="mt-3 max-w-2xl text-muted-foreground">
                Define el resultado que necesita tu organización. Kumplio copiará las capacidades del playbook y dejará la misión lista para iniciar.
              </p>

              {query.error && (
                <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
                  {errorMessages[query.error] || 'Ocurrió un error inesperado.'}
                </div>
              )}

              {!playbooks?.length ? (
                <div className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center">
                  <Target className="mx-auto h-7 w-7 text-primary" />
                  <h2 className="mt-3 font-bold">Todavía no hay playbooks publicados</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Publica un playbook antes de crear una misión.</p>
                </div>
              ) : (
                <form action={createMissionAction} className="mt-8 space-y-6">
                  <div>
                    <label htmlFor="playbook_id" className="text-sm font-semibold">Resultado que quieres lograr</label>
                    <select
                      id="playbook_id"
                      name="playbook_id"
                      defaultValue={selected?.id}
                      className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      {(playbooks || []).map((playbook) => (
                        <option key={playbook.id} value={playbook.id}>{playbook.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="title" className="text-sm font-semibold">Nombre de la misión</label>
                    <input
                      id="title"
                      name="title"
                      required
                      maxLength={160}
                      defaultValue={selected?.name}
                      placeholder="Ej.: Preparar cumplimiento de la Ley 21.719"
                      className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label htmlFor="objective" className="text-sm font-semibold">Objetivo específico de tu organización</label>
                    <textarea
                      id="objective"
                      name="objective"
                      rows={4}
                      defaultValue={selected?.objective}
                      placeholder="Describe qué debe quedar preparado, revisado o demostrado."
                      className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <p className="mt-2 text-xs text-muted-foreground">Crear la misión no certifica cumplimiento. El resultado requerirá evidencia y revisión.</p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-3">
                    <div>
                      <label htmlFor="priority" className="text-sm font-semibold">Prioridad</label>
                      <select id="priority" name="priority" defaultValue="medium" className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm">
                        <option value="low">Baja</option>
                        <option value="medium">Media</option>
                        <option value="high">Alta</option>
                        <option value="critical">Crítica</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="owner_id" className="text-sm font-semibold">Responsable</label>
                      <select id="owner_id" name="owner_id" defaultValue={user.id} className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm">
                        {(members || []).map((member: any) => {
                          const profile = Array.isArray(member.profile) ? member.profile[0] : member.profile
                          const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || profile?.email || 'Integrante'
                          return <option key={member.user_id} value={member.user_id}>{name}</option>
                        })}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="due_at" className="text-sm font-semibold">Fecha objetivo</label>
                      <input id="due_at" name="due_at" type="date" className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm" />
                    </div>
                  </div>

                  <button type="submit" className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:bg-primary/85 sm:w-auto">
                    Crear misión y abrir workspace
                    <CheckCircle2 className="ml-2 h-4 w-4" />
                  </button>
                </form>
              )}
            </section>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-border bg-card p-5">
                <Target className="h-5 w-5 text-primary" />
                <h2 className="mt-3 font-bold">Objetivo primero</h2>
                <p className="mt-2 text-sm text-muted-foreground">La misión organiza capacidades, trabajo y resultados alrededor de un outcome verificable.</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <Users className="h-5 w-5 text-primary" />
                <h2 className="mt-3 font-bold">Equipo coordinado</h2>
                <p className="mt-2 text-sm text-muted-foreground">El motor asignará especialistas por capacidad. La interfaz no elige ni ejecuta agentes.</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <CalendarDays className="h-5 w-5 text-primary" />
                <h2 className="mt-3 font-bold">Trazabilidad desde el inicio</h2>
                <p className="mt-2 text-sm text-muted-foreground">La creación, los cambios, las revisiones y los resultados quedarán registrados como eventos.</p>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  )
}
