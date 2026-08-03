'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, FileCheck2, FileText, Search, ShieldAlert, Target, X } from 'lucide-react'

type SearchResult = {
  id: string
  type: string
  title: string
  subtitle: string
  href: string
}

const labels: Record<string, string> = {
  mission: 'Misiones',
  control: 'Controles',
  evidence: 'Evidencias',
  risk: 'Riesgos',
  document: 'Documentos',
  playbook: 'Playbooks',
}

const icons = {
  mission: Target,
  control: FileCheck2,
  evidence: BookOpen,
  risk: ShieldAlert,
  document: FileText,
  playbook: BookOpen,
} as const

export function UniversalSearch() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(true)
      }
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30)
  }, [open])

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/universal-search?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal })
        const payload = await response.json()
        setResults(payload.results || [])
      } catch (error) {
        if ((error as Error).name !== 'AbortError') setResults([])
      } finally {
        setLoading(false)
      }
    }, 180)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  const grouped = useMemo(() => {
    return results.reduce<Record<string, SearchResult[]>>((acc, item) => {
      ;(acc[item.type] ||= []).push(item)
      return acc
    }, {})
  }, [results])

  const navigate = (href: string) => {
    setOpen(false)
    setQuery('')
    router.push(href)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-w-[210px] items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground shadow-sm transition hover:border-primary/40 hover:text-foreground"
        aria-label="Buscar en Kumplio"
      >
        <span className="inline-flex items-center gap-2"><Search className="h-4 w-4" />Buscar o preguntar</span>
        <kbd className="rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold">⌘ K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/45 px-4 pt-[10vh] backdrop-blur-sm" onMouseDown={() => setOpen(false)}>
          <section className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-background shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <Search className="h-5 w-5 text-primary" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Busca una misión, control, evidencia, riesgo o documento…"
                className="min-w-0 flex-1 bg-transparent py-2 text-base outline-none placeholder:text-muted-foreground"
              />
              <button onClick={() => setOpen(false)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Cerrar búsqueda"><X className="h-4 w-4" /></button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-3">
              {query.trim().length < 2 && (
                <div className="p-6 text-center">
                  <p className="font-semibold">Encuentra cualquier parte de tu organización</p>
                  <p className="mt-2 text-sm text-muted-foreground">Escribe al menos dos caracteres. Los resultados respetan los permisos de tu organización.</p>
                </div>
              )}
              {loading && <p className="p-6 text-center text-sm text-muted-foreground">Buscando en tu organización…</p>}
              {!loading && query.trim().length >= 2 && !results.length && <p className="p-6 text-center text-sm text-muted-foreground">No encontramos resultados relacionados.</p>}
              {!loading && Object.entries(grouped).map(([type, items]) => (
                <div key={type} className="mb-4 last:mb-0">
                  <p className="px-2 pb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">{labels[type] || type}</p>
                  <div className="space-y-1">
                    {items.map((item) => {
                      const Icon = icons[item.type as keyof typeof icons] || Search
                      return (
                        <button key={`${item.type}-${item.id}`} onClick={() => navigate(item.href)} className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-muted">
                          <span className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary"><Icon className="h-4 w-4" /></span>
                          <span className="min-w-0"><span className="block truncate font-semibold">{item.title}</span><span className="mt-0.5 block truncate text-sm text-muted-foreground">{item.subtitle}</span></span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  )
}
