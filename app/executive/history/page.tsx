import { redirect } from 'next/navigation'
import { History, Send, Archive, CheckCircle2, type LucideIcon } from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { transitionSnapshotAction } from '@/app/actions/experience'

export const dynamic = 'force-dynamic'
type Snapshot = { id:string; status:string; period_start:string; period_end:string; generated_at:string; reviewed_at:string|null; published_at:string|null }
type Event = { id:string; snapshot_id:string; event_type:string; from_status:string|null; to_status:string; notes:string|null; created_at:string }
type SnapshotAction = { action:'submit'|'approve'|'publish'|'archive'|'reject'; label:string; icon:LucideIcon }

export default async function ExecutiveHistoryPage() {
  const supabase = await createClient(); const {data:{user}}=await supabase.auth.getUser()
  if(!user) redirect('/sign-in?next=/executive/history')
  const admin=createAdminClient(); const {data:membership}=await admin.from('organization_members').select('organization_id').eq('user_id',user.id).limit(1).maybeSingle()
  if(!membership?.organization_id) redirect('/onboarding')
  const {data:snapshotData}=await admin.from('executive_intelligence_snapshots').select('id,status,period_start,period_end,generated_at,reviewed_at,published_at').eq('organization_id',membership.organization_id).order('generated_at',{ascending:false}).limit(24)
  const snapshots=(snapshotData||[]) as Snapshot[]; const ids=snapshots.map(item=>item.id)
  let events:Event[]=[]
  if(ids.length){const {data}=await admin.from('executive_snapshot_events').select('id,snapshot_id,event_type,from_status,to_status,notes,created_at').in('snapshot_id',ids).order('created_at',{ascending:false});events=(data||[]) as Event[]}
  return <><WorkspaceNav/><main className="container mx-auto space-y-8 px-4 py-8 sm:px-6">
    <header className="rounded-3xl border bg-card p-6 sm:p-8"><div className="flex items-center gap-2 text-primary"><History className="h-5 w-5"/><p className="text-sm font-bold">Gobernanza ejecutiva</p></div><h1 className="mt-3 text-3xl font-extrabold">Historial y publicación</h1><p className="mt-3 max-w-3xl text-muted-foreground">Cada transición queda registrada. Publicar requiere aprobación previa y archivar requiere que el snapshot ya haya sido publicado.</p></header>
    <section className="space-y-5">{snapshots.length?snapshots.map(snapshot=>{const snapshotEvents=events.filter(event=>event.snapshot_id===snapshot.id);return <article key={snapshot.id} className="rounded-2xl border bg-card p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><p className="text-xs font-bold text-primary">{snapshot.period_start} – {snapshot.period_end}</p><h2 className="mt-1 text-xl font-bold">Estado: {snapshot.status}</h2><p className="mt-2 text-sm text-muted-foreground">Generado {new Date(snapshot.generated_at).toLocaleString('es-CL')}</p></div><Actions snapshot={snapshot}/></div><div className="mt-5 border-t pt-4"><h3 className="text-sm font-bold">Trazabilidad</h3><div className="mt-3 space-y-2">{snapshotEvents.length?snapshotEvents.map(event=><div key={event.id} className="rounded-xl bg-muted/50 px-3 py-2 text-sm"><span className="font-semibold">{event.event_type}</span> · {event.from_status||'inicio'} → {event.to_status}<span className="text-muted-foreground"> · {new Date(event.created_at).toLocaleString('es-CL')}</span>{event.notes&&<p className="mt-1 text-xs text-muted-foreground">{event.notes}</p>}</div>):<p className="text-sm text-muted-foreground">Sin transiciones registradas todavía.</p>}</div></div></article>}):<p className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">Aún no existen snapshots.</p>}</section>
  </main></>
}
function Actions({snapshot}:{snapshot:Snapshot}) {
  let actions: SnapshotAction[] = []
  if (snapshot.status==='draft') actions=[{action:'submit',label:'Enviar a revisión',icon:Send}]
  if (snapshot.status==='review_required') actions=[{action:'approve',label:'Aprobar',icon:CheckCircle2},{action:'reject',label:'Devolver',icon:Archive}]
  if (snapshot.status==='approved') actions=[{action:'publish',label:'Publicar',icon:Send}]
  if (snapshot.status==='published') actions=[{action:'archive',label:'Archivar',icon:Archive}]
  return <div className="flex flex-wrap gap-2">{actions.map(({action,label,icon:Icon})=><form key={action} action={transitionSnapshotAction}><input type="hidden" name="id" value={snapshot.id}/><input type="hidden" name="action" value={action}/><button className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold"><Icon className="h-4 w-4"/>{label}</button></form>)}</div>
}
