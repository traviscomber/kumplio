import { redirect } from 'next/navigation'
import { ClipboardCheck, FileText, Gauge, ShieldCheck } from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { reviewItemAction } from '@/app/actions/experience'

export const dynamic = 'force-dynamic'
type ReviewItem = { id:string; type:'control'|'policy'|'snapshot'; title:string; meta:string; status:string }

export default async function ReviewCenterPage() {
  const supabase = await createClient(); const { data:{ user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/review-center')
  const admin = createAdminClient(); const { data: membership } = await admin.from('organization_members').select('organization_id').eq('user_id',user.id).limit(1).maybeSingle()
  if (!membership?.organization_id) redirect('/onboarding')
  const org = membership.organization_id
  const [controlsResult, policiesResult, snapshotsResult] = await Promise.all([
    admin.from('controls').select('id,name,status,lifecycle_status,created_at').eq('organization_id',org).or('lifecycle_status.eq.draft,status.eq.pending').order('created_at',{ascending:false}).limit(30),
    admin.from('organization_policy_instances').select('id,title,status,created_at').eq('organization_id',org).in('status',['draft','in_review']).order('created_at',{ascending:false}).limit(30),
    admin.from('executive_intelligence_snapshots').select('id,status,period_start,period_end,generated_at').eq('organization_id',org).eq('status','review_required').order('generated_at',{ascending:false}).limit(20),
  ])
  const items: ReviewItem[] = [
    ...(controlsResult.data||[]).map(item=>({id:item.id,type:'control' as const,title:item.name,meta:'Control empresarial instalado desde biblioteca',status:item.lifecycle_status})),
    ...(policiesResult.data||[]).map(item=>({id:item.id,type:'policy' as const,title:item.title,meta:'Documento empresarial pendiente de revisión',status:item.status})),
    ...(snapshotsResult.data||[]).map(item=>({id:item.id,type:'snapshot' as const,title:`Snapshot ${item.period_start} – ${item.period_end}`,meta:'Resumen ejecutivo generado desde métricas observadas',status:item.status})),
  ]
  return <><WorkspaceNav/><main className="container mx-auto space-y-8 px-4 py-8 sm:px-6">
    <header className="rounded-3xl border bg-card p-6 sm:p-8"><div className="flex items-center gap-2 text-primary"><ClipboardCheck className="h-5 w-5"/><p className="text-sm font-bold">Review Center</p></div><h1 className="mt-3 text-3xl font-extrabold">Decisiones pendientes</h1><p className="mt-3 max-w-3xl text-muted-foreground">Una sola bandeja para revisar controles, políticas y snapshots. Aprobar cambia el estado oficial; rechazar conserva trazabilidad.</p></header>
    <section className="grid gap-4 sm:grid-cols-3"><Metric icon={<ShieldCheck className="h-5 w-5"/>} label="Controles" value={items.filter(i=>i.type==='control').length}/><Metric icon={<FileText className="h-5 w-5"/>} label="Políticas" value={items.filter(i=>i.type==='policy').length}/><Metric icon={<Gauge className="h-5 w-5"/>} label="Snapshots" value={items.filter(i=>i.type==='snapshot').length}/></section>
    <section className="rounded-2xl border bg-card divide-y">{items.length ? items.map(item=><article key={`${item.type}-${item.id}`} className="p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-xs font-bold uppercase text-primary">{item.type}</p><h2 className="mt-1 font-bold">{item.title}</h2><p className="mt-2 text-sm text-muted-foreground">{item.meta} · {item.status}</p></div><div className="flex gap-2"><ReviewForm item={item} decision="reject" label="Rechazar"/><ReviewForm item={item} decision="approve" label="Aprobar" primary/></div></div></article>) : <p className="p-8 text-center text-sm text-muted-foreground">No hay decisiones pendientes.</p>}</section>
  </main></>
}
function ReviewForm({item,decision,label,primary=false}:{item:ReviewItem;decision:string;label:string;primary?:boolean}) { return <form action={reviewItemAction}><input type="hidden" name="type" value={item.type}/><input type="hidden" name="id" value={item.id}/><input type="hidden" name="decision" value={decision}/><button className={primary?'rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground':'rounded-xl border px-4 py-2 text-sm font-bold'}>{label}</button></form> }
function Metric({icon,label,value}:{icon:React.ReactNode;label:string;value:number}) { return <article className="rounded-2xl border bg-card p-5"><div className="flex items-center justify-between text-primary"><p className="text-sm font-semibold text-muted-foreground">{label}</p>{icon}</div><p className="mt-4 text-3xl font-extrabold">{value}</p></article> }
