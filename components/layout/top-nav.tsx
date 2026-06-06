'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LogOut, Settings, Menu, X } from 'lucide-react'
import { useState } from 'react'

export function TopNav() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/sign-in')
  }

  return (
    <header className="border-b border-border bg-card sticky top-0 z-40">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white text-sm font-bold">BS</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">BrightScope</h1>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <a href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            Dashboard
          </a>
          <a href="/documents" className="text-sm text-muted-foreground hover:text-foreground">
            Documentos
          </a>
          <a href="/analytics" className="text-sm text-muted-foreground hover:text-foreground">
            Analytics
          </a>
          <a href="/regulations" className="text-sm text-muted-foreground hover:text-foreground">
            Regulaciones
          </a>
          <a href="/mineria" className="text-sm text-muted-foreground hover:text-foreground">
            Minería
          </a>
          <a href="/projects" className="text-sm text-muted-foreground hover:text-foreground">
            Proyectos
          </a>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <a href="/settings">
              <Settings className="w-5 h-5" />
            </a>
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
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
            Dashboard
          </a>
          <a href="/documents" className="block text-sm text-muted-foreground hover:text-foreground">
            Documentos
          </a>
          <a href="/analytics" className="block text-sm text-muted-foreground hover:text-foreground">
            Analytics
          </a>
          <a href="/regulations" className="block text-sm text-muted-foreground hover:text-foreground">
            Regulaciones
          </a>
          <a href="/mineria" className="block text-sm text-muted-foreground hover:text-foreground">
            Minería
          </a>
          <a href="/projects" className="block text-sm text-muted-foreground hover:text-foreground">
            Proyectos
          </a>
          <div className="border-t border-border pt-3 space-y-2">
            <Button variant="ghost" className="w-full justify-start" asChild>
              <a href="/settings">
                <Settings className="w-4 h-4 mr-2" />
                Configuración
              </a>
            </Button>
            <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
