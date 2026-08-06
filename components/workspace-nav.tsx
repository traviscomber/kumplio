'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, FolderKanban, ListTodo, Settings, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { UniversalSearch } from '@/components/universal-search'

const areas = [
  {
    href: '/advisor',
    label: 'Hoy',
    icon: Sparkles,
    routes: ['/advisor', '/dashboard'],
  },
  {
    href: '/cases',
    label: 'Casos',
    icon: FolderKanban,
    routes: ['/cases', '/dashboard/agents', '/agents'],
  },
  {
    href: '/my-work',
    label: 'Seguimiento',
    icon: ListTodo,
    routes: ['/my-work', '/missions', '/decisions', '/review-center', '/operations', '/accountability'],
  },
  {
    href: '/context',
    label: 'Organización',
    icon: Building2,
    routes: [
      '/context',
      '/team',
      '/libraries',
      '/digital-twin',
      '/documents',
      '/obligations',
      '/risks',
      '/controls',
      '/evidence',
      '/settings',
    ],
  },
] as const

export function WorkspaceNav() {
  const pathname = usePathname()
  const activeArea = areas.find(({ routes }) =>
    routes.some((route) => pathname === route || pathname.startsWith(`${route}/`)),
  )?.href

  return (
    <nav aria-label="Áreas principales de Kumplio" className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <div className="container mx-auto flex items-center gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {areas.map(({ href, label, icon: Icon }) => {
            const active = href === activeArea
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
        <Link href="/settings" aria-label="Configuración" className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
          <Settings className="h-4 w-4" />
        </Link>
      </div>
    </nav>
  )
}
