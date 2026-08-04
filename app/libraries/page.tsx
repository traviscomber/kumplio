import { redirect } from 'next/navigation'
import { BookOpen, FileText, Library, ShieldCheck } from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

type ControlItem = { id: string; code: string; canonical_name: string; domain: string; lifecycle_status: string; current_version: number }
type ControlVersion = { control_catalog_id: string; description: string | null; objective: string | null; control_type: string; execution_mode: string; expected_evidence_types: string[]; status: string }
type PolicyItem = { id: string; code: string; canonical_name: string; document_type: string; domain: string; lifecycle_status: string; current_version: number }
type PolicyVersion = { policy_catalog_id: string; purpose: string | null; scope: string | null; required_placeholders: string[]; status: string }

export default async function LibrariesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/libraries')

  const admin = createAdminClient()
  const [controlsResult, controlVersionsResult, policiesResult, policyVersionsResult] = await Promise.all([
    admin.from('control_catalog').select('id,code,canonical_name,domain,lifecycle_status,current_version').order('canonical_name'),
    admin.from('control_catalog_versions').select('control_catalog_id,description,objective,control_type,execution_mode,expected_evidence_types,status'),
    admin.from('policy_catalog').select('id,code,canonical_name,document_type,domain,lifecycle_status,current_version').order('canonical_name'),
    admin.from('policy_catalog_versions').select('policy_catalog_id,purpose,scope,required_placeholders,status'),
  ])

  const controls = (controlsResult.data || []) as ControlItem[]
  const controlVersions = new Map(((controlVersionsResult.data || []) as ControlVersion[]).map((item) => [item.control_catalog_id, item]))
  const policies = (policiesResult.data || []) as PolicyItem[]
  const policyVersions = new Map(((policyVersionsResult.data || []) as PolicyVersion[]).map((item) => [item.policy_catalog_id, item]))
  const draftCount = [...controlVersions.values(), ...policyVersions.values()].filter((item) => item.status === 'draft').length

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto space-y-8 px-4 py-8 sm:px-6">
        <header className="rounded-3xl border bg-card p-6 sm:p-8">
          <div className="flex items-center gap-2 text-primary"><Library className="h-5 w-5" /><p className="text-sm font-bold">Bibliotecas Kumplio</p></div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Conocimiento reutilizable y versionado</h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">Controles y documentos canónicos listos para revisión, adaptación e instalación en una organización.</p>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <Metric icon={<ShieldCheck className="h-5 w-5" />} label="Controles" value={controls.length} />
          <Metric icon={<FileText className="h-5 w-5" />} label="Políticas y procedimientos" value={policies.length} />
          <Metric icon={<BookOpen className="h-5 w-5" />} label="Versiones en borrador" value={draftCount} />
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border bg-card">
            <div className="border-b px-5 py-4"><p className="text-sm font-semibold text-primary">Control Library</p><h2 className="mt-1 text-xl font-bold">Controles canónicos</h2></div>
            <div className="divide-y">
              {controls.map((control) => {
                const version = controlVersions.get(control.id)
                return <article key={control.id} className="p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold text-primary">{control.code} · v{control.current_version}</p><h3 className="mt-1 font-bold">{control.canonical_name}</h3><p className="mt-2 text-sm text-muted-foreground">{version?.objective || version?.description || 'Objetivo pendiente de completar.'}</p></div><span className="rounded-full border px-2.5 py-1 text-[11px] font-semibold">{version?.status || control.lifecycle_status}</span></div><div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground"><span className="rounded bg-muted px-2 py-1">{control.domain}</span>{version && <span className="rounded bg-muted px-2 py-1">{version.control_type}</span>}{version && <span className="rounded bg-muted px-2 py-1">{version.execution_mode}</span>}</div>{version?.expected_evidence_types?.length ? <p className="mt-3 text-xs text-muted-foreground">Evidencia esperada: {version.expected_evidence_types.join(', ')}</p> : null}</article>
              })}
              {!controls.length && <p className="p-5 text-sm text-muted-foreground">No hay controles disponibles.</p>}
            </div>
          </div>

          <div className="rounded-2xl border bg-card">
            <div className="border-b px-5 py-4"><p className="text-sm font-semibold text-primary">Policy Library</p><h2 className="mt-1 text-xl font-bold">Políticas y documentos</h2></div>
            <div className="divide-y">
              {policies.map((policy) => {
                const version = policyVersions.get(policy.id)
                return <article key={policy.id} className="p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold text-primary">{policy.code} · v{policy.current_version}</p><h3 className="mt-1 font-bold">{policy.canonical_name}</h3><p className="mt-2 text-sm text-muted-foreground">{version?.purpose || version?.scope || 'Propósito pendiente de completar.'}</p></div><span className="rounded-full border px-2.5 py-1 text-[11px] font-semibold">{version?.status || policy.lifecycle_status}</span></div><div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground"><span className="rounded bg-muted px-2 py-1">{policy.domain}</span><span className="rounded bg-muted px-2 py-1">{policy.document_type}</span></div>{version?.required_placeholders?.length ? <p className="mt-3 text-xs text-muted-foreground">Variables requeridas: {version.required_placeholders.join(', ')}</p> : null}</article>
              })}
              {!policies.length && <p className="p-5 text-sm text-muted-foreground">No hay documentos disponibles.</p>}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5"><h2 className="font-bold">Instalación controlada</h2><p className="mt-2 text-sm text-muted-foreground">Las versiones visibles siguen siendo artefactos canónicos. Adaptarlas a una empresa requiere una instalación revisada; ninguna plantilla se publica o convierte en control operativo automáticamente.</p></section>
      </main>
    </>
  )
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return <article className="rounded-2xl border bg-card p-5"><div className="flex items-center justify-between text-primary"><p className="text-sm font-semibold text-muted-foreground">{label}</p>{icon}</div><p className="mt-4 text-3xl font-extrabold">{value}</p></article>
}
