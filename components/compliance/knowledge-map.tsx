'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowRight, BookOpenCheck, FileCheck2, FolderKanban, Landmark, Network, Scale, ShieldCheck, UserRound, Workflow } from 'lucide-react'
import type { KnowledgeGraph, KnowledgeNode, KnowledgeNodeType } from '@/lib/compliance/knowledge-graph/types'

const labels: Record<KnowledgeNodeType, string> = {
  obligation: 'Obligaciones',
  control: 'Controles',
  evidence: 'Evidencias',
  case: 'Casos',
  mission: 'Misiones',
  document: 'Documentos',
  member: 'Responsables',
  project: 'Ámbitos',
  regulatory_source: 'Fuentes oficiales',
  regulatory_document: 'Documentos regulatorios',
}

const icons: Record<KnowledgeNodeType, typeof Network> = {
  obligation: BookOpenCheck,
  control: ShieldCheck,
  evidence: FileCheck2,
  case: FolderKanban,
  mission: Workflow,
  document: FileCheck2,
  member: UserRound,
  project: Network,
  regulatory_source: Landmark,
  regulatory_document: Scale,
}

const nodeKey = (node: KnowledgeNode) => `${node.type}:${node.id}`

export function KnowledgeMap({ graph, initialSelected = null }: { graph: KnowledgeGraph; initialSelected?: string | null }) {
  const validInitial = initialSelected && graph.nodes.some((node) => nodeKey(node) === initialSelected) ? initialSelected : null
  const [selected, setSelected] = useState<string | null>(validInitial)
  const selectedNode = graph.nodes.find((node) => nodeKey(node) === selected) || null

  const related = useMemo(() => {
    if (!selected) return []
    return graph.edges.flatMap((edge) => {
      if (edge.from !== selected && edge.to !== selected) return []
      const otherKey = edge.from === selected ? edge.to : edge.from
      const node = graph.nodes.find((candidate) => nodeKey(candidate) === otherKey)
      return node ? [{ node, label: edge.label, direction: edge.from === selected ? 'out' : 'in' as const }] : []
    })
  }, [graph, selected])

  const groups = useMemo(() => {
    const result = new Map<KnowledgeNodeType, KnowledgeNode[]>()
    for (const node of graph.nodes) {
      const list = result.get(node.type) || []
      list.push(node)
      result.set(node.type, list)
    }
    return [...result.entries()].filter(([, nodes]) => nodes.length)
  }, [graph.nodes])

  if (!graph.nodes.length) {
    return <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">El mapa se irá formando cuando existan obligaciones, controles, evidencias y casos en este espacio de trabajo.</div>
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-5">
        {groups.map(([type, nodes]) => {
          const Icon = icons[type]
          return (
            <div key={type} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />
                <h2 className="font-bold">{labels[type]}</h2>
                <span className="text-xs text-muted-foreground">{nodes.length}</span>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                {nodes.map((node) => {
                  const key = nodeKey(node)
                  const active = key === selected
                  const relationshipCount = graph.edges.filter((edge) => edge.from === key || edge.to === key).length
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelected(key)}
                      className={`rounded-xl border p-4 text-left transition ${active ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/40 hover:bg-muted/40'}`}
                    >
                      <p className="line-clamp-3 text-sm font-semibold">{node.label}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{relationshipCount} relaciones</p>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </section>

      <aside className="xl:sticky xl:top-24 xl:self-start">
        <div className="rounded-2xl border border-border bg-card p-5">
          {!selectedNode ? (
            <div className="py-8 text-center">
              <Network className="mx-auto h-8 w-8 text-primary" />
              <h2 className="mt-4 font-bold">Explora una relación</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Selecciona cualquier nodo para ver qué depende de él y qué lo respalda.</p>
            </div>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">{labels[selectedNode.type]}</p>
              <h2 className="mt-2 text-lg font-bold">{selectedNode.label}</h2>
              {selectedNode.href && <Link href={selectedNode.href} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">Abrir detalle <ArrowRight className="h-4 w-4" /></Link>}
              <div className="mt-6 border-t border-border pt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Relaciones</p>
                {!related.length ? <p className="mt-3 text-sm text-muted-foreground">Este nodo todavía no tiene relaciones registradas.</p> : (
                  <div className="mt-3 space-y-2">
                    {related.map(({ node, label }, index) => (
                      <button key={`${nodeKey(node)}-${index}`} type="button" onClick={() => setSelected(nodeKey(node))} className="w-full rounded-lg border border-border p-3 text-left hover:border-primary/40 hover:bg-muted/40">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                        <p className="mt-1 text-sm font-semibold">{node.label}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  )
}
