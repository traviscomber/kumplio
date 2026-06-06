'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut, Settings, Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'

export function TopNav() {
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
    <header className="border-b border-border bg-card sticky top-0 z-40">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white text-sm font-bold">K</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">KUMPLIO</h1>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <a href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            Panel de Control
          </a>
          <a href="/dashboard/agents" className="text-sm text-muted-foreground hover:text-foreground">
            Agentes
          </a>
          <a href="/dashboard/workflows" className="text-sm text-muted-foreground hover:text-foreground">
            Flujos de Trabajo
          </a>
          <a href="/dashboard/monitoring" className="text-sm text-muted-foreground hover:text-foreground">
            Monitoreo
          </a>
          <a href="/documents" className="text-sm text-muted-foreground hover:text-foreground">
            Documentos
          </a>
          <a href="/projects" className="text-sm text-muted-foreground hover:text-foreground">
            Proyectos
          </a>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <a href="/settings" className="text-sm text-muted-foreground hover:text-foreground">
            <Settings className="w-5 h-5" />
          </a>
          <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        <button
          className="md:hidden"
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
        <div className="md:hidden border-t border-border px-6 py-4 space-y-3">
          <a href="/dashboard" className="block text-sm text-muted-foreground hover:text-foreground">
            Panel de Control
          </a>
          <a href="/dashboard/agents" className="block text-sm text-muted-foreground hover:text-foreground">
            Agentes
          </a>
          <a href="/dashboard/workflows" className="block text-sm text-muted-foreground hover:text-foreground">
            Flujos de Trabajo
          </a>
          <a href="/dashboard/monitoring" className="block text-sm text-muted-foreground hover:text-foreground">
            Monitoreo
          </a>
          <a href="/documents" className="block text-sm text-muted-foreground hover:text-foreground">
            Documentos
          </a>
          <a href="/projects" className="block text-sm text-muted-foreground hover:text-foreground">
            Proyectos
          </a>
          <div className="border-t border-border pt-3 space-y-2">
            <a href="/settings" className="block text-sm text-muted-foreground hover:text-foreground">
              <Settings className="w-4 h-4 mr-2 inline" />
              Configuración
            </a>
            <button onClick={handleLogout} className="block w-full text-left text-sm text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4 mr-2 inline" />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
