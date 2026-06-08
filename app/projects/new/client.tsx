'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { TopNav } from '@/components/layout/top-nav'
import { ChevronLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function NewProjectPageClient() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/sign-in')
        return
      }

      // Get organization
      // Get user's organization
      const { data: memberData } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

      const orgId = memberData?.organization_id
      
      // Try to create with organization_id first
      let insertResult = await supabase
        .from('projects')
        .insert([{
          user_id: user.id,
          organization_id: orgId,
          name,
          description,
          status: 'active',
          compliance_law: 'Ley 21.719',
        }])
        .select()
        .single()

      // If organization_id doesn't exist as column, try without it
      if (insertResult.error?.message.includes('organization_id')) {
        console.log('[v0] organization_id field not available, using fallback')
        insertResult = await supabase
          .from('projects')
          .insert([{
            user_id: user.id,
            name,
            description,
            status: 'active',
            compliance_law: 'Ley 21.719',
          }])
          .select()
          .single()
      }

      const { data, error: insertError } = insertResult

      if (insertError) {
        // More user-friendly error message
        if (!orgId) {
          setError('No se encontró la organización. Por favor, contacta a administración.')
        } else {
          setError(insertError.message)
        }
        return
      }

      router.push(`/projects/${data.id}`)
    } catch (err) {
      setError('Error al crear el proyecto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="container mx-auto px-6 py-8">
        <Link href="/projects" className="flex items-center gap-2 text-primary hover:underline mb-8">
          <ChevronLeft className="w-4 h-4" />
          Volver a proyectos
        </Link>

        <div className="max-w-2xl mx-auto">
          <div className="bg-card border border-border rounded-lg p-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Crear nuevo proyecto</h1>
            <p className="text-muted-foreground mb-8">
              Inicia un nuevo proyecto de auditoría y escaneo de vulnerabilidades
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                  Nombre del proyecto
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Auditoría API Backend"
                  className="w-full px-4 py-2 rounded-lg bg-input border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                  Descripción
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe el objetivo del proyecto..."
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg bg-input border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div className="bg-blue-500/5 border border-blue-200/20 rounded-lg p-4">
                <p className="text-sm text-foreground">
                  <span className="font-medium">Consejo:</span> {' '}
                  El proyecto incluirá análisis automático SAST, escaneo de dependencias y validación de cumplimiento Ley 21.719
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !name}
                >
                  {loading ? 'Creando...' : 'Crear proyecto'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
