'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut, Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

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
    <header data-compact={compact || undefined} className="fixed inset-x-0 top-0 z-50 border-b border-[rgba(194,168,135,0.14)] bg-[#171715]/96">
      <div className="container mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/app/inicio" className="flex-shrink-0 rounded-[3px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#171715]" aria-label="Ir al inicio de Kumplio">
          <Image
            src="/kumplio-logo.png"
            alt="Kumplio"
            width={160}
            height={60}
            className="h-10 w-auto sm:h-11"
            priority
          />
        </Link>

        <div className="hidden items-center md:flex">
          <button onClick={handleLogout} className="inline-flex min-h-10 items-center gap-2 rounded-[4px] px-3 text-sm font-medium text-[#AAA08F] transition-colors hover:bg-[#20201D] hover:text-[#C2A887] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#171715]">
            <LogOut className="h-4 w-4 text-[#A36C42]" />
            Cerrar sesión
          </button>
        </div>

        <button
          className="rounded-[4px] p-2 text-[#AAA08F] transition-colors hover:bg-[#20201D] hover:text-[#C2A887] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#171715] md:hidden"
          aria-label={mobileMenuOpen ? 'Cerrar menú de cuenta' : 'Abrir menú de cuenta'}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-[rgba(194,168,135,0.14)] bg-[#171715] px-4 py-3 md:hidden">
          <button onClick={handleLogout} className="flex min-h-11 w-full items-center gap-2 rounded-[4px] px-3 text-left text-sm font-medium text-[#AAA08F] transition-colors hover:bg-[#20201D] hover:text-[#C2A887] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#171715]">
            <LogOut className="h-4 w-4 text-[#A36C42]" />
            Cerrar sesión
          </button>
        </div>
      )}
    </header>
  )
}
