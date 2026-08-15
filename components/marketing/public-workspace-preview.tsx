'use client'

import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FolderKanban,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react'
import type { PublicLocale } from '@/lib/i18n/public-routing'

type PreviewMode = 'compact' | 'full'
type ScenarioId = 'law' | 'client' | 'vendor'
type TabId = 'summary' | 'specialists' | 'evidence' | 'plan'

type Scenario = {
  label: string
  title: string
  objective: string
  priority: string
  reservation: string
  evidence: string[]
  actions: string[]
}

const scenarioOrder: ScenarioId[] = ['law', 'client', 'vendor']
const tabOrder: TabId[] = ['summary', 'specialists', 'evidence', 'plan']

const COPY = {
  es: {
    fictional: 'Demo ficticia · Empresa Demo SpA',
    liveCase: 'Expediente vivo',
    open: 'En revisión',
    lastUpdate: 'Actualizado hace 2 min',
    choose: 'Prueba otro escenario',
    tabs: {
      summary: 'Resumen',
      specialists: 'Especialistas',
      evidence: 'Evidencia',
      plan: 'Plan',
    },
    labels: {
      objective: 'Objetivo',
      priority: 'Prioridad detectada',
      reservation: 'Reserva abierta',
      evidence: 'Evidencia vinculada',
      actions: 'Siguientes acciones',
      human: 'Revisión humana requerida',
      sources: 'Fuentes oficiales + contexto autorizado',
    },
    scenarios: {
      law: {
        label: 'Ley 21.719',
        title: 'Preparar inventario y brechas antes de la entrada en vigencia',
        objective: 'Ordenar tratamientos, responsables, terceros y evidencia disponible para priorizar lo que falta implementar.',
        priority: 'Tres tratamientos aún requieren completar retención, destinatarios y base jurídica.',
        reservation: 'No declarar cumplimiento mientras existan campos críticos sin evidencia suficiente.',
        evidence: ['Inventario de tratamientos v3', 'Contrato proveedor CRM', 'Aviso de privacidad vigente'],
        actions: ['Completar retención y destinatarios', 'Revisar contrato de encargado', 'Solicitar evidencia de eliminación'],
      },
      client: {
        label: 'Requerimiento de cliente',
        title: 'Demostrar cómo se protegen datos personales antes de firmar',
        objective: 'Responder con evidencia trazable, controles observados y reservas explícitas en vez de enviar documentos sueltos.',
        priority: 'El cliente pide respaldo de acceso, retención y manejo de incidentes.',
        reservation: 'La política existente describe el control, pero todavía falta acreditar operación efectiva.',
        evidence: ['Matriz de accesos', 'Política de seguridad', 'Registro de revisión trimestral'],
        actions: ['Validar operación del control', 'Adjuntar evidencia vigente', 'Preparar respuesta revisable'],
      },
      vendor: {
        label: 'Proveedor crítico',
        title: 'Revisar un proveedor que procesa datos personales',
        objective: 'Conectar contrato, finalidad, categorías de datos, transferencias y controles para decidir qué debe corregirse.',
        priority: 'Falta evidencia suficiente sobre subencargados y retención efectiva.',
        reservation: 'No inferir configuración tenant específica desde políticas públicas del proveedor.',
        evidence: ['Contrato y DPA', 'Ficha de tratamiento', 'Assurance público del proveedor'],
        actions: ['Solicitar configuración tenant', 'Revisar subencargados', 'Definir criterio de cierre'],
      },
    } satisfies Record<ScenarioId, Scenario>,
    specialists: [
      ['Isidora', 'Obligaciones y aplicabilidad', 'Completado'],
      ['Rodrigo', 'Riesgo y urgencia', 'Completado'],
      ['Verónica', 'Controles y evidencia', 'En revisión'],
      ['Javier', 'Plan de acción', 'Pendiente'],
      ['Julieta', 'Calidad y reservas', 'Pendiente'],
    ],
  },
  en: {
    fictional: 'Fictional demo · Demo Company SpA',
    liveCase: 'Living case file',
    open: 'Under review',
    lastUpdate: 'Updated 2 min ago',
    choose: 'Try another scenario',
    tabs: {
      summary: 'Summary',
      specialists: 'Specialists',
      evidence: 'Evidence',
      plan: 'Plan',
    },
    labels: {
      objective: 'Objective',
      priority: 'Detected priority',
      reservation: 'Open reservation',
      evidence: 'Linked evidence',
      actions: 'Next actions',
      human: 'Human review required',
      sources: 'Official sources + authorized context',
    },
    scenarios: {
      law: {
        label: 'Chilean Law 21.719',
        title: 'Prepare the processing inventory and gaps before the law takes effect',
        objective: 'Organize processing activities, owners, third parties and available evidence to prioritize what still needs implementation.',
        priority: 'Three processing activities still need retention, recipients and legal-basis details completed.',
        reservation: 'Do not declare compliance while critical fields remain unsupported by sufficient evidence.',
        evidence: ['Processing inventory v3', 'CRM vendor contract', 'Current privacy notice'],
        actions: ['Complete retention and recipient details', 'Review processor contract', 'Request deletion evidence'],
      },
      client: {
        label: 'Client request',
        title: 'Demonstrate how personal data is protected before signing',
        objective: 'Respond with traceable evidence, observed controls and explicit reservations instead of sending disconnected documents.',
        priority: 'The client requests support for access, retention and incident handling.',
        reservation: 'The policy describes the control, but operating effectiveness still needs evidence.',
        evidence: ['Access matrix', 'Security policy', 'Quarterly review record'],
        actions: ['Validate control operation', 'Attach current evidence', 'Prepare a reviewable response'],
      },
      vendor: {
        label: 'Critical vendor',
        title: 'Review a vendor that processes personal data',
        objective: 'Connect contract, purpose, data categories, transfers and controls to decide what needs remediation.',
        priority: 'Evidence remains insufficient for subprocessors and effective retention.',
        reservation: 'Do not infer tenant-specific configuration from public provider policies.',
        evidence: ['Contract and DPA', 'Processing record', 'Public provider assurance'],
        actions: ['Request tenant configuration', 'Review subprocessors', 'Define closure criteria'],
      },
    } satisfies Record<ScenarioId, Scenario>,
    specialists: [
      ['Isidora', 'Obligations and applicability', 'Completed'],
      ['Rodrigo', 'Risk and urgency', 'Completed'],
      ['Verónica', 'Controls and evidence', 'In review'],
      ['Javier', 'Action plan', 'Pending'],
      ['Julieta', 'Quality and reservations', 'Pending'],
    ],
  },
} as const

export function PublicWorkspacePreview({ locale = 'es', mode = 'compact' }: { locale?: PublicLocale; mode?: PreviewMode }) {
  const copy = COPY[locale]
  const [scenarioId, setScenarioId] = useState<ScenarioId>('client')
  const [tab, setTab] = useState<TabId>('summary')
  const scenario = copy.scenarios[scenarioId]

  const metrics = useMemo(() => [
    [locale === 'es' ? 'Fuentes' : 'Sources', '9'],
    [locale === 'es' ? 'Evidencias' : 'Evidence', String(scenario.evidence.length)],
    [locale === 'es' ? 'Acciones' : 'Actions', String(scenario.actions.length)],
    [locale === 'es' ? 'Reservas' : 'Reservations', '1'],
  ], [locale, scenario.actions.length, scenario.evidence.length])

  return (
    <div className={`overflow-hidden rounded-[28px] border border-white/12 bg-[#121925] shadow-[0_32px_100px_rgba(0,0,0,0.38)] ${mode === 'full' ? 'min-h-[620px]' : ''}`}>
      <div className="flex flex-col gap-4 border-b border-white/10 bg-[#0f1520] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FolderKanban className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-black uppercase tracking-[0.14em] text-primary">{copy.fictional}</p>
            <p className="mt-1 truncate text-sm font-bold text-white/80">{copy.liveCase}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/45">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/[0.06] px-3 py-1.5 font-bold text-primary">
            <Clock3 className="h-3.5 w-3.5" /> {copy.open}
          </span>
          <span className="hidden sm:inline">{copy.lastUpdate}</span>
        </div>
      </div>

      <div className="border-b border-white/10 px-5 py-4">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-white/30">{copy.choose}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {scenarioOrder.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => { setScenarioId(id); setTab('summary') }}
              className={`rounded-full border px-3 py-2 text-xs font-bold transition ${scenarioId === id ? 'border-primary/40 bg-primary/10 text-primary' : 'border-white/10 text-white/48 hover:border-white/25 hover:text-white/75'}`}
            >
              {copy.scenarios[id].label}
            </button>
          ))}
        </div>
      </div>

      {mode === 'full' && (
        <div className="flex gap-1 overflow-x-auto border-b border-white/10 px-4 py-2">
          {tabOrder.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition ${tab === id ? 'bg-white/[0.07] text-white' : 'text-white/42 hover:text-white/75'}`}
            >
              {copy.tabs[id]}
            </button>
          ))}
        </div>
      )}

      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[1.4fr_0.8fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">{scenario.label}</p>
            <h3 className="mt-3 text-2xl font-black leading-tight sm:text-3xl">{scenario.title}</h3>

            {(mode === 'compact' || tab === 'summary') && (
              <div className="mt-6 space-y-3">
                <PreviewRow icon={Sparkles} label={copy.labels.objective} text={scenario.objective} />
                <PreviewRow icon={AlertTriangle} label={copy.labels.priority} text={scenario.priority} tone="warning" />
                <PreviewRow icon={ShieldCheck} label={copy.labels.reservation} text={scenario.reservation} />
              </div>
            )}

            {mode === 'full' && tab === 'specialists' && (
              <div className="mt-6 space-y-2">
                {copy.specialists.map(([name, role, status], index) => (
                  <div key={name} className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:grid-cols-[38px_1fr_auto] sm:items-center">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-xs font-black text-primary">0{index + 1}</div>
                    <div><p className="font-black">{name}</p><p className="mt-1 text-xs text-white/42">{role}</p></div>
                    <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${index < 2 ? 'bg-primary/10 text-primary' : index === 2 ? 'bg-amber-400/10 text-amber-300' : 'bg-white/[0.05] text-white/35'}`}>{status}</span>
                  </div>
                ))}
              </div>
            )}

            {mode === 'full' && tab === 'evidence' && (
              <div className="mt-6 space-y-3">
                {scenario.evidence.map((item, index) => (
                  <div key={item} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                    <FileCheck2 className="h-5 w-5 shrink-0 text-primary" />
                    <div className="min-w-0"><p className="font-bold">{item}</p><p className="mt-1 text-xs text-white/36">SHA-256 · {locale === 'es' ? 'vigencia revisable' : 'reviewable validity'} · ref 0{index + 1}</p></div>
                    <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-primary" />
                  </div>
                ))}
              </div>
            )}

            {mode === 'full' && tab === 'plan' && (
              <div className="mt-6 space-y-3">
                {scenario.actions.map((item, index) => (
                  <div key={item} className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:grid-cols-[34px_1fr_auto] sm:items-center">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-black text-primary">{index + 1}</span>
                    <div><p className="font-bold">{item}</p><p className="mt-1 text-xs text-white/36">{locale === 'es' ? 'Responsable sugerido · criterio de cierre pendiente' : 'Suggested owner · closure criterion pending'}</p></div>
                    <span className="w-fit rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-white/42">{locale === 'es' ? 'Abierto' : 'Open'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <aside className="rounded-[22px] border border-white/10 bg-[#0d131e] p-5">
            <div className="grid grid-cols-2 gap-3">
              {metrics.map(([label, value]) => (
                <div key={label} className="rounded-xl border border-white/8 bg-white/[0.025] p-3">
                  <p className="text-2xl font-black">{value}</p>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white/30">{label}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-primary/15 bg-primary/[0.045] p-4">
              <div className="flex items-center gap-2 text-primary"><UserCheck className="h-4 w-4" /><p className="text-xs font-black uppercase tracking-[0.12em]">{copy.labels.human}</p></div>
              <p className="mt-2 text-xs leading-5 text-white/45">{copy.labels.sources}</p>
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 p-4">
              <Users className="h-5 w-5 text-primary" />
              <div><p className="text-sm font-black">Julieta</p><p className="text-xs text-white/38">{locale === 'es' ? 'Revisa consistencia, reservas y claims' : 'Reviews consistency, reservations and claims'}</p></div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function PreviewRow({ icon: Icon, label, text, tone = 'default' }: { icon: typeof Sparkles; label: string; text: string; tone?: 'default' | 'warning' }) {
  return (
    <div className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone === 'warning' ? 'bg-amber-400/10 text-amber-300' : 'bg-primary/10 text-primary'}`}><Icon className="h-4 w-4" /></div>
      <div><p className="text-xs font-black uppercase tracking-[0.12em] text-white/35">{label}</p><p className="mt-2 text-sm leading-6 text-white/68">{text}</p></div>
    </div>
  )
}
