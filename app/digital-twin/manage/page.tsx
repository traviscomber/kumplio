import { redirect } from 'next/navigation'
import { Database, Network, Server, UsersRound } from 'lucide-react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { createClient } from '@/lib/supabase/server'
import { createTwinEntityAction } from '@/app/actions/experience'

export const dynamic = 'force-dynamic'

export default async function TwinManagePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/digital-twin/manage')
  return <><WorkspaceNav /><main className="container mx-auto space-y-8 px-4 py-8 sm:px-6">
    <header className="rounded-3xl border bg-card p-6 sm:p-8"><div className="flex items-center gap-2 text-primary"><Network className="h-5 w-5"/><p className="text-sm font-bold">Gemelo Digital Operativo</p></div><h1 className="mt-3 text-3xl font-extrabold">Materializa la empresa</h1><p className="mt-3 max-w-3xl text-muted-foreground">Cada registro nace en borrador. Las relaciones, obligaciones y controles sugeridos se incorporarán después de revisión.</p></header>
    <section className="grid gap-6 xl:grid-cols-2">
      <EntityForm title="Nuevo proceso" icon={<Network className="h-5 w-5"/>} type="process" fields={<><Input name="description" label="Objetivo o descripción"/><Select name="processType" label="Tipo" options={['operational','management','support']}/><Select name="criticality" label="Criticidad" options={['low','medium','high','critical']}/></>}/>
      <EntityForm title="Nuevo activo o sistema" icon={<Server className="h-5 w-5"/>} type="asset" fields={<><Input name="description" label="Descripción"/><Input name="assetType" label="Tipo de activo" placeholder="CRM, ERP, repositorio..."/><Input name="providerName" label="Proveedor"/><Input name="country" label="País de alojamiento"/><Select name="criticality" label="Criticidad" options={['low','medium','high','critical']}/><Checks personal sensitive/></>}/>
      <EntityForm title="Nuevo dataset" icon={<Database className="h-5 w-5"/>} type="dataset" fields={<><Input name="dataSubjects" label="Titulares separados por coma" placeholder="clientes, trabajadores"/><Input name="dataCategories" label="Categorías separadas por coma"/><Select name="sensitivity" label="Sensibilidad" options={['public','internal','confidential','restricted']}/><Input name="legalBasis" label="Base jurídica"/><Input name="retentionRule" label="Regla de retención"/><Checks cross/></>}/>
      <EntityForm title="Nuevo proveedor" icon={<UsersRound className="h-5 w-5"/>} type="vendor" fields={<><Input name="serviceCategory" label="Categoría de servicio"/><Input name="country" label="País"/><Select name="riskTier" label="Nivel de riesgo inicial" options={['low','medium','high','critical']}/><Checks personal cross/></>}/>
    </section>
  </main></>
}

function EntityForm({ title, icon, type, fields }: { title: string; icon: React.ReactNode; type: string; fields: React.ReactNode }) { return <form action={createTwinEntityAction} className="rounded-2xl border bg-card p-5"><input type="hidden" name="entityType" value={type}/><div className="flex items-center gap-2 text-primary">{icon}<h2 className="font-bold">{title}</h2></div><div className="mt-5 space-y-4"><Input name="name" label="Nombre" required/>{fields}</div><button className="mt-5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">Crear borrador</button></form> }
function Input({ name, label, placeholder, required=false }: { name:string; label:string; placeholder?:string; required?:boolean }) { return <label className="block text-sm font-semibold">{label}<input name={name} required={required} placeholder={placeholder} className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm"/></label> }
function Select({ name, label, options }: { name:string; label:string; options:string[] }) { return <label className="block text-sm font-semibold">{label}<select name={name} className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm">{options.map(option=><option key={option} value={option}>{option}</option>)}</select></label> }
function Checks({ personal=false, sensitive=false, cross=false }: { personal?:boolean; sensitive?:boolean; cross?:boolean }) { return <div className="flex flex-wrap gap-4 text-sm">{personal&&<label><input type="checkbox" name="personalData" className="mr-2"/>Trata datos personales</label>}{sensitive&&<label><input type="checkbox" name="sensitiveData" className="mr-2"/>Contiene datos sensibles</label>}{cross&&<label><input type="checkbox" name="crossBorder" className="mr-2"/>Transferencia internacional</label>}</div> }
