'use client'

import { useMemo, useState, useTransition } from 'react'
import { CheckCircle2, ChevronRight, CircleAlert, FileText, PencilLine, Scale, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { submitReviewDecision, type ReviewDecision } from './actions'

type ReviewCase = {
  id: string
  status: string
  current_revision: number
  claim_text: string
  claim_type: string | null
  reference_label: string | null
  source_title: string | null
  rule_title: string | null
  rule_key: string | null
  rule_conditions: Record<string, unknown> | null
  rule_outcome: Record<string, unknown> | null
  catalog_code: string | null
  catalog_title: string | null
  created_at: string
}

const statusLabel: Record<string, string> = {
  new: 'Nuevo',
  pending: 'Pendiente',
  in_review: 'En revisión',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  superseded: 'Reemplazado',
}

export function ReviewWorkbench({ cases }: { cases: ReviewCase[] }) {
  const [selectedId, setSelectedId] = useState(cases[0]?.id || '')
  const [rationale, setRationale] = useState('')
  const [editedRule, setEditedRule] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const selected = useMemo(
    () => cases.find((item) => item.id === selectedId) || cases[0],
    [cases, selectedId],
  )

  if (!selected) {
    return (
      <div className="rounded-2xl border border-white/10 bg-card p-10 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
        <h2 className="mt-4 text-xl font-bold">No hay casos pendientes</h2>
        <p className="mt-2 text-sm text-white/50">La bandeja jurídica está al día.</p>
      </div>
    )
  }

  const initialRule = JSON.stringify({
    conditions: selected.rule_conditions || {},
    outcome: selected.rule_outcome || {},
  }, null, 2)

  function decide(decision: ReviewDecision) {
    setMessage(null)
    const data = new FormData()
    data.set('caseId', selected.id)
    data.set('decision', decision)
    data.set('rationale', rationale)
    data.set('editedRule', editedRule || initialRule)

    startTransition(async () => {
      try {
        await submitReviewDecision(data)
        setMessage('Decisión registrada correctamente.')
        setRationale('')
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'No fue posible registrar la decisión.')
      }
    })
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="overflow-hidden rounded-2xl border border-white/10 bg-card">
        <div className="border-b border-white/10 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Bandeja jurídica</p>
          <h2 className="mt-2 text-xl font-bold">{cases.length} casos por revisar</h2>
        </div>
        <div className="max-h-[760px] overflow-y-auto">
          {cases.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setSelectedId(item.id)
                setEditedRule('')
                setRationale('')
                setMessage(null)
              }}
              className={`flex w-full gap-3 border-b border-white/10 p-4 text-left transition-colors ${selected.id === item.id ? 'bg-primary/10' : 'hover:bg-white/[0.035]'}`}
            >
              <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-primary">
                <Scale className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-primary">{item.reference_label || 'Referencia pendiente'}</span>
                  <ChevronRight className="h-4 w-4 text-white/25" />
                </div>
                <p className="mt-1 line-clamp-2 text-sm font-semibold text-white">{item.rule_title || item.claim_text}</p>
                <p className="mt-2 text-xs text-white/40">{statusLabel[item.status] || item.status} · revisión {item.current_revision}</p>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <section className="space-y-5">
        <div className="rounded-2xl border border-white/10 bg-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Caso regulatorio</p>
              <h1 className="mt-2 text-2xl font-extrabold">{selected.rule_title || 'Revisión de claim'}</h1>
              <p className="mt-2 text-sm text-white/45">{selected.source_title || 'Ley 21.719'} · {selected.reference_label || 'Referencia por confirmar'}</p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-xs font-semibold text-white/65">
              {statusLabel[selected.status] || selected.status}
            </span>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <article className="rounded-2xl border border-white/10 bg-card p-6">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <FileText className="h-4 w-4 text-primary" /> Texto legal
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-white/65">{selected.claim_text}</p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs text-white/45">
              <span className="rounded-full bg-white/[0.04] px-3 py-1.5">Tipo: {selected.claim_type || 'sin clasificar'}</span>
              <span className="rounded-full bg-white/[0.04] px-3 py-1.5">Revisión: {selected.current_revision}</span>
            </div>
          </article>

          <article className="rounded-2xl border border-white/10 bg-card p-6">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <PencilLine className="h-4 w-4 text-primary" /> Propuesta operativa
            </div>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-white/40">Regla</dt>
                <dd className="mt-1 font-semibold text-white">{selected.rule_key || 'Sin regla asociada'}</dd>
              </div>
              <div>
                <dt className="text-white/40">Catálogo</dt>
                <dd className="mt-1 font-semibold text-white">{selected.catalog_code ? `${selected.catalog_code} · ${selected.catalog_title}` : 'Pendiente de vinculación'}</dd>
              </div>
            </dl>
            <textarea
              value={editedRule || initialRule}
              onChange={(event) => setEditedRule(event.target.value)}
              className="mt-5 min-h-64 w-full rounded-xl border border-white/10 bg-black/20 p-4 font-mono text-xs leading-6 text-white/70 outline-none focus:border-primary/50"
              spellCheck={false}
              aria-label="Propuesta de regla en JSON"
            />
          </article>
        </div>

        <div className="rounded-2xl border border-white/10 bg-card p-6">
          <label htmlFor="rationale" className="text-sm font-bold text-white">Justificación del revisor</label>
          <textarea
            id="rationale"
            value={rationale}
            onChange={(event) => setRationale(event.target.value)}
            placeholder="Explica la decisión, los cambios requeridos o el fundamento del rechazo."
            className="mt-3 min-h-28 w-full rounded-xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white outline-none placeholder:text-white/25 focus:border-primary/50"
          />

          {message && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white/70">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {message}
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <Button disabled={isPending} onClick={() => decide('approve')} className="font-bold">
              <CheckCircle2 className="mr-2 h-4 w-4" /> Aprobar
            </Button>
            <Button disabled={isPending} variant="outline" onClick={() => decide('request_changes')} className="border-white/15 bg-transparent font-semibold">
              <PencilLine className="mr-2 h-4 w-4" /> Solicitar cambios
            </Button>
            <Button disabled={isPending} variant="destructive" onClick={() => decide('reject')} className="font-semibold">
              <XCircle className="mr-2 h-4 w-4" /> Rechazar
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
