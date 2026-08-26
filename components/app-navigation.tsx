'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, BriefcaseBusiness, FileCheck2, FolderKanban, History, Home, Settings, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const primaryItems = [
  { href: '/app/inicio', label: 'Inicio', icon: Home },
  { href: '/app/casos', label: 'Casos', icon: FolderKanban },
  { href: '/app/documentos', label: 'Documentos', icon: FileCheck2 },
] as const

const secondaryItems = [
  { href: '/app/evidencia', label: 'Evidencia', icon: BriefcaseBusiness },
  { href: '/app/alertas', label: 'Alertas', icon: Bell },
  { href: '/app/actividad', label: 'Actividad', icon: History },
  { href: '/app/personas', label: 'Personas', icon: Users },
  { href: '/app/configuracion', label: 'Configuración', icon: Settings },
] as const

export function AppNavigation() {
  const pathname = usePathname()

  return (
    <nav aria-label="Navegación de producto" className="sticky top-20 z-40 border-b border-border/70 bg-background/95 backdrop-blur-xl">
      <div className="container mx-auto flex max-w-7xl items-center justify-between gap-3 overflow-x-auto px-4 py-3 sm:gap-4 sm:px-6">
        <div className="flex items-center gap-1">
          {primaryItems.map((item) => <NavigationLink key={item.href} item={item} pathname={pathname} />)}
        </div>
        <div className="flex items-center gap-1 border-l border-border pl-3">
          {secondaryItems.map((item) => <NavigationLink key={item.href} item={item} pathname={pathname} />)}
        </div>
      </div>
    </nav>
  )
}

function NavigationLink({ item, pathname }: {
  item: { href: string; label: string; icon: typeof Home }
  pathname: string
}) {
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {item.label}
    </Link>
  )
}
