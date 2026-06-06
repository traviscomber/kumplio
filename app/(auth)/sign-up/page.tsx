'use client'

export const dynamic = 'force-dynamic';

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Mail, Lock, Building2, AlertCircle } from 'lucide-react'

export default function SignUp() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Sign up user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      if (authData.user) {
        // Create organization
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .insert([{ name: organizationName, country: 'CL' }])
          .select()
          .single()

        if (orgError) {
          setError('Error al crear la organización')
          return
        }

        // Add user as owner
        const { error: memberError } = await supabase
          .from('organization_members')
          .insert([{
            organization_id: orgData.id,
            user_id: authData.user.id,
            role: 'owner',
          }])

        if (memberError) {
          setError('Error al configurar la membresía')
          return
        }

        router.push('/sign-in?message=Cuenta creada. Por favor inicia sesión.')
      }
    } catch (err) {
      setError('Error durante el registro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-lg p-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary">
              <span className="text-primary-foreground font-bold text-lg">K</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">KUMPLIO</h1>
              <p className="text-sm text-muted-foreground">Crear nueva cuenta</p>
            </div>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            {error && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="organization" className="block text-sm font-medium text-foreground">
                Nombre de la organización
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="organization"
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="Mi Empresa"
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-secondary border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@empresa.cl"
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-secondary border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-secondary border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Creando cuenta...' : 'Registrarse'}
            </Button>
          </form>

          <div className="space-y-3 border-t border-border pt-6">
            <p className="text-center text-sm text-muted-foreground">
              {`¿Ya tienes cuenta?`}
            </p>
            <Button variant="outline" className="w-full" asChild>
              <a href="/sign-in">Inicia sesión aquí</a>
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Cumplimiento automático para Ley 21.719 de protección de datos
        </p>
      </div>
    </div>
  )
}
