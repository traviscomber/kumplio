import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Box, Database, Network, Server, ShieldAlert, UsersRound } from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

type ProcessRow = { id: string; name: string; process_type: string; criticality: string; lifecycle_status: string }
type AssetRow = { id: string; name: string; asset_type: string; criticality: string; contains_personal_data: boolean; contains_sensitive_data: boolean }
type DatasetRow = { id: string; name: string; sensitivity: string; cross_border_transfer: boolean; data_subjects: string[] }
type VendorRow = { id: string; name: string; service_category: string | null; risk_tier: string; processes_personal_data: boolean }

export default async function DigitalTwinPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/digital-twin')

  const admin = createAdminClient()
  const { data: membership } = await admin.from('organization_members').select('organization_id').eq('user_id', user.id).limit(1).maybeSingle()
  if (!membership?.organization_id) redirect('/onboarding')

  const organizationId = membership.organization_id
  const [organizationResult, processesResult, assetsResult, datasetsResult, vendorsResult] = await Promise.all([
    admin.from('organizations').select('id,name,industry,size').eq('id', organizationId).maybeSingle(),
    admin.from('organization_processes').select('id,name,process_type,criticality,lifecycle_status').eq('organization_id', organizationId).order('criticality').limit(12),
    admin.from('organization_assets').select('id,name,asset_type,criticality,contains_personal_data,contains_sensitive_data').eq('organization_id', organizationId).order('criticality').limit(12),
    admin.from('organization_datasets').select('id,name,sensitivity,cross_border_transfer,data_subjects').eq('organization_id', organizationId).order('sensitivity').limit(12),
    admin.from('organization_vendors').select('id,name,service_category,risk_tier,processes_personal_data').eq('organization_id', organizationId).order('risk_tier').limit(12),
  ])

  const processes = (processesResult.data || []) as ProcessRow[]
  const assets = (assetsResult.data || []) as AssetRow[]
  const datasets = (datasetsResult.data || []) as DatasetRow[]
  const vendors = (vendorsResult.data || []) as VendorRow[]
  const sensitiveAssets = assets.filter((asset) => asset.contains_sensitive_data).length
  const internationalDatasets = datasets.filter((dataset) => dataset.cross_border_transfer).length
  const highRiskVendors = vendors.filter((vendor) => ['high', 'critical'].includes(vendor.risk_tier)).length
  const hasData = processes.length + assets.length + datasets.length + vendors.length > 0

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto space-y-8 px-4 py-8 sm:px-6">
        <header className="overflow-hidden rounded-3xl border bg-card p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-primary"><Network className="h-5 w-5" /><p className="text-sm font-bold">Gemelo Digital</p></div>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{organizationResult.data?.name || 'Tu empresa'}</h1>
              <p className="mt-3 max-w-2xl text-muted-foreground">Mapa operacional de procesos, sistemas, datos y proveedores que sustentan el cumplimiento.</p>
            </div>
            <Link href="/onboarding" className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">Completar descubrimiento</Link>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric icon={<Network className="h-5 w-5" />} label="Procesos" value={processes.length} helper="Operaciones materializadas" />
          <Metric icon={<Server className="h-5 w-5" />} label="Activos" value={assets.length} helper={`${sensitiveAssets} con datos sensibles`} />
          <Metric icon={<Database className="h-5 w-5" />} label="Datasets" value={datasets.length} helper={`${internationalDatasets} con transferencia internacional`} />
          <Metric icon={<UsersRound className="h-5 w-5" />} label="Proveedores" value={vendors.length} helper={`${highRiskVendors} de riesgo alto`} />
        </section>

        {!hasData ? (
          <section className="rounded-3xl border border-dashed bg-card p-10 text-center">
            <Box className="mx-auto h-10 w-10 text-primary" />
            <h2 className="mt-4 text-xl font-bold">Tu gemelo digital está listo para poblarse</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">Usa el onboarding o conecta una fuente empresarial para descubrir procesos, sistemas, datasets y proveedores. Nada se incorporará sin revisión.</p>
            <Link href="/onboarding" className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">Iniciar onboarding</Link>
          </section>
        ) : (
          <section className="grid gap-6 xl:grid-cols-2">
            <EntityPanel title="Procesos" rows={processes.map((item) => ({ title: item.name, meta: `${item.process_type} · ${item.criticality}`, badge: item.lifecycle_status }))} />
            <EntityPanel title="Activos y sistemas" rows={assets.map((item) => ({ title: item.name, meta: `${item.asset_type} · ${item.criticality}`, badge: item.contains_sensitive_data ? 'Datos sensibles' : item.contains_personal_data ? 'Datos personales' : 'Sin datos personales' }))} />
            <EntityPanel title="Datasets" rows={datasets.map((item) => ({ title: item.name, meta: `${item.sensitivity} · ${item.data_subjects.join(', ') || 'sin titulares definidos'}`, badge: item.cross_border_transfer ? 'Transferencia internacional' : 'Local' }))} />
            <EntityPanel title="Proveedores" rows={vendors.map((item) => ({ title: item.name, meta: item.service_category || 'Servicio sin clasificar', badge: item.risk_tier }))} />
          </section>
        )}

        <section className="rounded-2xl border bg-card p-5">
          <div className="flex items-start gap-3"><ShieldAlert className="mt-0.5 h-5 w-5 text-primary" /><div><h2 className="font-bold">Lectura de riesgo contextual</h2><p className="mt-1 text-sm text-muted-foreground">Los colores y relaciones de riesgo se activarán a medida que existan controles, evidencia e incidentes vinculados. Esta vista no infiere cumplimiento a partir de inventarios incompletos.</p></div></div>
        </section>
      </main>
    </>
  )
}

function Metric({ icon, label, value, helper }: { icon: React.ReactNode; label: string; value: number; helper: string }) {
  return <article className="rounded-2xl border bg-card p-5"><div className="flex items-center justify-between text-primary"><p className="text-sm font-semibold text-muted-foreground">{label}</p>{icon}</div><p className="mt-4 text-3xl font-extrabold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{helper}</p></article>
}

function EntityPanel({ title, rows }: { title: string; rows: { title: string; meta: string; badge: string }[] }) {
  return <section className="rounded-2xl border bg-card"><div className="border-b px-5 py-4"><h2 className="font-bold">{title}</h2></div><div className="divide-y">{rows.length ? rows.map((row, index) => <article key={`${row.title}-${index}`} className="flex items-start justify-between gap-4 p-5"><div><h3 className="font-semibold">{row.title}</h3><p className="mt-1 text-xs text-muted-foreground">{row.meta}</p></div><span className="rounded-full border px-2.5 py-1 text-[11px] font-semibold">{row.badge}</span></article>) : <p className="p-5 text-sm text-muted-foreground">Sin registros todavía.</p>}</div></section>
}
