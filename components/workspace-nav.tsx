'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Bot, BookOpen, Home, Settings, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { href: '/dashboard', label: 'Centro de Operaciones', icon: Home },
  { href: '/missions', label: 'Misiones', icon: Target },
  { href: '/regulatory', label: 'Conocimiento', icon: BookOpen },
  { href: '/agents', label: 'IA', icon: Bot },
  { href: '/analytics', label: 'Reportes', icon: BarChart3 },
  { href: '/settings', label: 'Configuración', icon: Settings },
] as const

export function WorkspaceNav() {
  const pathname = usePathname()
  const activeHref = [...items]
    .filter(({ href }) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((left, right) => right.href.length - left.href.length)[0]?.href

  return (
    <nav
      aria-label="Navegación principal de Kumplio"
      className="sticky top-0 z-40 overflow-x-auto border-b border-border/70 bg-background/90 backdrop-blur-xl"
    >
      <div className="container mx-auto flex min-w-max items-center gap-1 px-4 py-3 sm:px-6">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === activeHref
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
