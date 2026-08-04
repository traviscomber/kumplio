import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FileText, PackagePlus, ShieldCheck } from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { installLibraryItemAction } from '@/app/actions/experience'

export const dynamic = 'force-dynamic'

type ControlVersion = { id: string; title: string; description: string | null; objective: string | null; status: string; control_catalog: { code: string; canonical_name: string } | null }
type PolicyVersion = { id: string; title: string; purpose: string | null; scope: string | null; status: string; policy_catalog: { code: string; canonical_name: string } | null }

export default async function LibraryInstallPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/libraries/install')

  const admin = createAdminClient()
  const { data: membership } = await admin.from('organization_members').select('organization_id').eq('user_id', user.id).limit(1).maybeSingle()
  if (!membership?.organization_id) redirect('/onboarding')

  const [controlsResult, policiesResult] = await Promise.all([
    admin.from('control_catalog_versions').select('id,title,description,objective,status,control_catalog(code,canonical_name)').order('created_at'),
    admin.from('policy_catalog_versions').select('id,title,purpose,scope,status,policy_catalog(code,canonical_name)').order('created_at'),
  ])

  const controls = (controlsResult.data || []) as unknown as ControlVersion[]
  const policies = (policiesResult.data || []) as unknown as PolicyVersion[]

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto space-y-8 px-4 py-8 sm:px-6">
        <header className="rounded-3xl border bg-card p-6 sm:p-8">
          <div className="flex items-center gap-2 text-primary"><PackagePlus className="h-5 w-5" /><p className="text-sm font-bold">Centro de instalación</p></div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Crear borradores desde las bibliotecas</h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">Cada instalación crea una instancia empresarial en borrador. No activa controles ni publica documentos.</p>
          <Link href="/libraries" className="mt-5 inline-flex text-sm font-semibold text-primary hover:underline">Volver a las bibliotecas</Link>
        </header>

        <section className="grid gap-6 xl:grid-cols-2">
          <LibraryColumn title="Controles" icon={<ShieldCheck className="h-5 w-5" />}>
            {controls.map((item) => <InstallCard key={item.id} id={item.id} type="control" code={item.control_catalog?.code || 'CTRL'} title={item.title || item.control_catalog?.canonical_name || 'Control'} description={item.objective || item.description} status={item.status} />)}
          </LibraryColumn>
          <LibraryColumn title="Políticas" icon={<FileText className="h-5 w-5" />}>
            {policies.map((item) => <InstallCard key={item.id} id={item.id} type="policy" code={item.policy_catalog?.code || 'POL'} title={item.title || item.policy_catalog?.canonical_name || 'Política'} description={item.purpose || item.scope} status={item.status} />)}
          </LibraryColumn>
        </section>
      </main>
    </>
  )
}

function LibraryColumn({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <section className="rounded-2xl border bg-card"><div className="flex items-center gap-3 border-b px-5 py-4 text-primary">{icon}<h2 className="text-xl font-bold text-foreground">{title}</h2></div><div className="divide-y">{children}</div></section>
}

function InstallCard({ id, type, code, title, description, status }: { id: string; type: 'control' | 'policy'; code: string; title: string; description: string | null; status: string }) {
  return <article className="p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold text-primary">{code}</p><h3 className="mt-1 font-bold">{title}</h3><p className="mt-2 text-sm text-muted-foreground">{description || 'Sin descripción adicional.'}</p></div><span className="rounded-full border px-2.5 py-1 text-[11px] font-semibold">{status}</span></div><form action={installLibraryItemAction} className="mt-4"><input type="hidden" name="itemType" value={type} /><input type="hidden" name="versionId" value={id} /><button className="rounded-xl border border-primary/30 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/5">Crear borrador empresarial</button></form></article>
}
