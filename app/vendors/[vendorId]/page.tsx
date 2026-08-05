import { redirect } from 'next/navigation'
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getVendorDetail } from '@/lib/compliance/operations/vendor-audit-marketplace'

export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ vendorId: string }> }

export default async function VendorDetailPage({ params }: PageProps) {
  const { vendorId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/sign-in?next=/vendors/${vendorId}`)

  const admin = createAdminClient()
  const { data: membership } = await admin
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()
  if (!membership?.organization_id) redirect('/onboarding')

  const vendor = await getVendorDetail(admin, membership.organization_id, vendorId)
  if (!vendor) redirect('/vendors')

  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <section className="rounded-3xl border bg-card p-6 sm:p-8">
          <p className="text-sm font-semibold text-primary">Resolver proveedor</p>
          <div className="mt-4 flex items-start gap-4">
            <div className={tone(vendor.riskLevel)}>
              {vendor.riskLevel === 'critical' || vendor.riskLevel === 'high'
                ? <ShieldAlert className="h-6 w-6" />
                : <AlertTriangle className="h-6 w-6" />}
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{vendor.vendorName}</h1>
              <p className="mt-2 text-muted-foreground">Riesgo {label(vendor.riskLevel)} · score {vendor.riskScore}</p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border bg-card p-6">
          <h2 className="text-xl font-bold">Encontré</h2>
          <div className="mt-4 space-y-3">
            {vendor.findings.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" /> No hay hallazgos abiertos.
              </p>
            ) : vendor.findings.map((finding) => (
              <p key={finding.code} className="rounded-xl border p-4 text-sm">{finding.label}</p>
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <Info label="Categoría" value={vendor.serviceCategory || 'No registrada'} />
          <Info label="País" value={vendor.country || 'No registrado'} />
          <Info label="Procesa datos personales" value={vendor.processesPersonalData ? 'Sí' : 'No'} />
          <Info label="Transferencia internacional" value={vendor.crossBorderTransfer ? 'Sí' : 'No'} />
          <Info label="Vencimiento de contrato" value={vendor.contractExpiresAt ? new Date(vendor.contractExpiresAt).toLocaleDateString('es-CL') : 'No registrado'} />
          <Info label="Estado" value={vendor.lifecycleStatus} />
        </section>

        <section className="mt-6 rounded-2xl border bg-card p-6">
          <h2 className="text-xl font-bold">Siguiente decisión</h2>
          <p className="mt-3 leading-7 text-muted-foreground">{vendor.recommendedAction}</p>
          <a href="/vendors" className="mt-6 inline-flex rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">
            Volver a proveedores
          </a>
        </section>
      </main>
    </>
  )
}

function Info({ label: title, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-2 font-bold">{value}</p>
    </div>
  )
}

function tone(level: 'low' | 'medium' | 'high' | 'critical') {
  const base = 'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border'
  if (level === 'critical') return `${base} border-red-600/40 bg-red-600/10 text-red-700`
  if (level === 'high') return `${base} border-red-500/30 bg-red-500/10 text-red-600`
  if (level === 'medium') return `${base} border-amber-500/30 bg-amber-500/10 text-amber-600`
  return `${base} border-primary/30 bg-primary/10 text-primary`
}

function label(level: string) {
  if (level === 'critical') return 'crítico'
  if (level === 'high') return 'alto'
  if (level === 'medium') return 'medio'
  return 'bajo'
}
