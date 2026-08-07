'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, FolderKanban, ListTodo, Settings, Sparkles, UserRoundCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { UniversalSearch } from '@/components/universal-search'
import { WorkspaceSwitcher } from '@/components/workspace-switcher'

const areas = [
  {
    href: '/advisor',
    label: 'Escritorio',
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
    href: '/follow-up',
    label: 'Seguimiento',
    icon: ListTodo,
    routes: ['/follow-up', '/insights', '/my-work', '/missions', '/decisions', '/review-center', '/operations', '/accountability'],
  },
  {
    href: '/context',
    label: 'Organización',
    icon: Building2,
    routes: [
      '/context',
      '/map',
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
  const accountabilityActive = pathname === '/accountability' || pathname.startsWith('/accountability/')
  const activeArea = areas.find(({ routes }) => routes.some((route) => pathname === route || pathname.startsWith(`${route}/`)))?.href

  return (
    <nav aria-label="Áreas principales de Kumplio" className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <div className="container mx-auto flex max-w-full items-center gap-1 px-3 py-3 sm:gap-3 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto overscroll-x-contain">
          {areas.map(({ href, label, icon: Icon }) => {
            const active = href === activeArea
            return (
              <Link
                key={href}
                href={href}
                aria-current={active && !accountabilityActive ? 'page' : undefined}
                className={cn(
                  'inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
                  active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className="hidden min-[390px]:inline">{label}</span>
              </Link>
            )
          })}
        </div>
        <WorkspaceSwitcher />
        <UniversalSearch />
        <Link
          href="/accountability"
          aria-label="Responsables y vencimientos"
          aria-current={accountabilityActive ? 'page' : undefined}
          title="Responsables y vencimientos"
          className={cn(
            'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors',
            accountabilityActive
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          <UserRoundCheck className="h-4 w-4" aria-hidden="true" />
        </Link>
        <Link
          href="/settings"
          aria-label="Configuración"
          title="Configuración"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Settings className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </nav>
  )
}
