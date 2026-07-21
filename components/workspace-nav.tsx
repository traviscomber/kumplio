'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const items = [
  ['/dashboard', 'Resumen'],
  ['/obligations', 'Obligaciones'],
  ['/controls', 'Controles'],
  ['/evidence', 'Evidencias'],
  ['/findings', 'Hallazgos'],
  ['/risks', 'Riesgos'],
  ['/roadmaps', 'Acciones'],
  ['/documents', 'Documentos'],
] as const

export function WorkspaceNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Navegación del workspace" className="overflow-x-auto border-b border-border bg-background/95">
      <div className="container mx-auto flex min-w-max gap-1 px-6 py-3">
        {items.map(([href, label]) => {
          const active = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
