'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut, Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const productLinks = [
  { href: '/app/inicio', label: 'Inicio' },
  { href: '/app/casos', label: 'Casos' },
  { href: '/app/documentos', label: 'Documentos' },
] as const

export function TopNav({ compact = false }: { compact?: boolean }) {
  const router = useRouter()
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setSupabase(createClient())
  }, [])

  const handleLogout = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    router.push('/sign-in')
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-card/95 backdrop-blur-xl">
      <div className="container mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/app/inicio" className="flex-shrink-0" aria-label="Ir al inicio de Kumplio">
          <Image 
            src="/logo-kumplio.svg" 
            alt="KUMPLIO" 
            width={100} 
            height={100}
            className="h-12 w-auto"
            priority
          />
        </Link>

        {!compact && <nav aria-label="Acceso al producto" className="hidden items-center gap-1 md:flex">
          {productLinks.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </nav>}

        <div className="hidden items-center md:flex">
          <button onClick={handleLogout} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground">
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>

        <button
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
          aria-label={mobileMenuOpen ? 'Cerrar menú de cuenta' : 'Abrir menú de cuenta'}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-border px-4 py-3 md:hidden">
          {!compact && productLinks.map((item) => (
            <Link key={item.href} href={item.href} className="block min-h-11 rounded-lg px-3 py-3 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground">
              {item.label}
            </Link>
          ))}
          <button onClick={handleLogout} className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground">
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      )}
    </header>
  )
}
