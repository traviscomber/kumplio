import { redirect } from 'next/navigation'
import { Link2, Pencil } from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createTwinRelationAction, updateTwinEntityAction } from '@/app/actions/advanced-experience'

export const dynamic = 'force-dynamic'
type Entity = { id:string; name:string; type:'process'|'asset'|'dataset'|'vendor'; level:string }
type Relation = { id:string; source_type:string; source_id:string; relation_type:string; target_type:string; target_id:string; status:string }

export default async function TwinRelationsPage() {
  const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user) redirect('/sign-in?next=/digital-twin/relations')
  const admin=createAdminClient(); const {data:membership}=await admin.from('organization_members').select('organization_id').eq('user_id',user.id).limit(1).maybeSingle(); if(!membership?.organization_id) redirect('/onboarding')
  const org=membership.organization_id
  const [p,a,d,v,r]=await Promise.all([
    admin.from('organization_processes').select('id,name,criticality').eq('organization_id',org).limit(50),
    admin.from('organization_assets').select('id,name,criticality').eq('organization_id',org).limit(50),
    admin.from('organization_datasets').select('id,name,sensitivity').eq('organization_id',org).limit(50),
    admin.from('organization_vendors').select('id,name,risk_tier').eq('organization_id',org).limit(50),
    admin.from('digital_twin_relations').select('id,source_type,source_id,relation_type,target_type,target_id,status').eq('organization_id',org).order('created_at',{ascending:false}).limit(100),
  ])
  const entities:Entity[]=[...(p.data||[]).map(x=>({id:x.id,name:x.name,type:'process' as const,level:x.criticality})),...(a.data||[]).map(x=>({id:x.id,name:x.name,type:'asset' as const,level:x.criticality})),...(d.data||[]).map(x=>({id:x.id,name:x.name,type:'dataset' as const,level:x.sensitivity})),...(v.data||[]).map(x=>({id:x.id,name:x.name,type:'vendor' as const,level:x.risk_tier}))]
  const names=new Map(entities.map(e=>[e.id,e.name])); const relations=(r.data||[]) as Relation[]
  return <><WorkspaceNav/><main className="container mx-auto space-y-8 px-4 py-8 sm:px-6">
    <header className="rounded-3xl border bg-card p-6 sm:p-8"><div className="flex items-center gap-2 text-primary"><Link2 className="h-5 w-5"/><p className="text-sm font-bold">Gemelo Digital Operativo</p></div><h1 className="mt-3 text-3xl font-extrabold">Editar y relacionar</h1><p className="mt-3 text-muted-foreground">Conecta procesos, sistemas, datasets y proveedores. Las relaciones nacen en borrador.</p></header>
    <section className="grid gap-6 xl:grid-cols-2"><div className="rounded-2xl border bg-card"><div className="border-b p-5"><h2 className="font-bold">Entidades</h2></div><div className="divide-y">{entities.map(e=><form key={`${e.type}-${e.id}`} action={updateTwinEntityAction} className="grid gap-3 p-4 sm:grid-cols-[110px_1fr_130px_auto]"><input type="hidden" name="id" value={e.id}/><input type="hidden" name="type" value={e.type}/><span className="text-xs font-bold uppercase text-primary">{e.type}</span><input name="name" defaultValue={e.name} className="rounded-lg border bg-background px-3 py-2 text-sm"/><input name="criticality" defaultValue={e.level} className="rounded-lg border bg-background px-3 py-2 text-sm"/><button aria-label="Guardar" className="rounded-lg border p-2"><Pencil className="h-4 w-4"/></button></form>)}</div></div>
    <div className="rounded-2xl border bg-card p-5"><h2 className="font-bold">Nueva relación</h2><form action={createTwinRelationAction} className="mt-4 space-y-3"><EntitySelect name="source" entities={entities}/><select name="relationType" className="w-full rounded-lg border bg-background px-3 py-2"><option value="uses">usa</option><option value="processes">trata</option><option value="stores">almacena</option><option value="supports">soporta</option><option value="provided_by">es provisto por</option><option value="depends_on">depende de</option></select><EntitySelect name="target" entities={entities}/><button className="w-full rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground">Crear relación en borrador</button></form></div></section>
    <section className="rounded-2xl border bg-card"><div className="border-b p-5"><h2 className="font-bold">Mapa de relaciones</h2></div><div className="divide-y">{relations.map(rel=><div key={rel.id} className="flex flex-wrap items-center gap-2 p-4 text-sm"><strong>{names.get(rel.source_id)||rel.source_type}</strong><span className="text-primary">{rel.relation_type}</span><strong>{names.get(rel.target_id)||rel.target_type}</strong><span className="ml-auto rounded-full border px-2 py-1 text-xs">{rel.status}</span></div>)}{!relations.length&&<p className="p-5 text-sm text-muted-foreground">Sin relaciones todavía.</p>}</div></section>
  </main></>
}
function EntitySelect({name,entities}:{name:'source'|'target';entities:Entity[]}) { return <div className="grid grid-cols-[120px_1fr] gap-2"><select name={`${name}Type`} className="rounded-lg border bg-background px-3 py-2"><option value="process">Proceso</option><option value="asset">Activo</option><option value="dataset">Dataset</option><option value="vendor">Proveedor</option></select><select name={`${name}Id`} required className="rounded-lg border bg-background px-3 py-2"><option value="">Seleccionar...</option>{entities.map(e=><option key={`${name}-${e.id}`} value={e.id}>{e.name} ({e.type})</option>)}</select></div> }
