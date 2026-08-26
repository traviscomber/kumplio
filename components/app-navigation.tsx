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
    <nav aria-label="Navegación de producto" className="sticky top-20 z-40 border-b border-[rgba(194,168,135,0.14)] bg-[#171715]/96">
      <div className="container mx-auto flex max-w-7xl items-center justify-between gap-3 overflow-x-auto px-4 sm:gap-4 sm:px-6">
        <div className="flex items-center gap-1">
          {primaryItems.map((item) => <NavigationLink key={item.href} item={item} pathname={pathname} />)}
        </div>
        <div className="flex items-center gap-1 border-l border-[rgba(194,168,135,0.14)] pl-3">
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
        'inline-flex min-h-12 shrink-0 items-center gap-2 rounded-[3px] border-b-2 border-transparent px-3.5 py-3 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#171715]',
        active ? 'border-b-2 border-primary text-[#C2A887]' : 'text-[#746D62] hover:text-[#C2A887]',
      )}
    >
      <Icon className={cn('h-4 w-4', active ? 'text-primary' : 'text-[#A36C42]')} aria-hidden="true" />
      {item.label}
    </Link>
  )
}
