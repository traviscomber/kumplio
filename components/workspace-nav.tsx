'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Activity, BarChart3, Bot, BriefcaseBusiness, Building2, Gauge, Library, Network, Radar, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { UniversalSearch } from '@/components/universal-search'

const items = [
  { href: '/roc', label: 'ROC', icon: Radar },
  { href: '/executive', label: 'Ejecutivo', icon: Gauge },
  { href: '/digital-twin', label: 'Gemelo', icon: Network },
  { href: '/libraries', label: 'Bibliotecas', icon: Library },
  { href: '/copilot', label: 'Copilot', icon: Bot },
  { href: '/ai-platform', label: 'IA', icon: Activity },
  { href: '/dashboard', label: 'Empresa', icon: Building2 },
  { href: '/missions', label: 'Trabajo', icon: BriefcaseBusiness },
  { href: '/analytics', label: 'Análisis', icon: BarChart3 },
] as const

export function WorkspaceNav() {
  const pathname = usePathname()
  const activeHref = [...items]
    .filter(({ href }) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((left, right) => right.href.length - left.href.length)[0]?.href

  return (
    <nav aria-label="Navegación principal de Kumplio" className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <div className="container mx-auto flex items-center gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {items.map(({ href, label, icon: Icon }) => {
            const active = href === activeHref
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
                  active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </Link>
            )
          })}
        </div>
        <UniversalSearch />
        <Link href="/settings" aria-label="Configuración" className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><Settings className="h-4 w-4" /></Link>
      </div>
    </nav>
  )
}
