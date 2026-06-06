'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Upload, File, AlertCircle, CheckCircle, Clock, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface Document {
  id: string
  name: string
  file_type: string
  file_size: number
  status: 'pending' | 'analyzing' | 'completed' | 'failed'
  created_at: string
}

export function DocumentsContent() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [projects, setProjects] = useState<any[]>([])

  useEffect(() => {
    loadDocuments()
  }, [selectedProject])

  const loadDocuments = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = '/sign-in'
        return
      }

      // Get organization
      const { data: memberData } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

      const orgId = memberData?.organization_id
      if (!orgId) return

      // Get projects
      const { data: projectList } = await supabase
        .from('projects')
        .select('id, name')
        .eq('organization_id', orgId)

      setProjects(projectList || [])
      if (projectList && projectList.length > 0 && !selectedProject) {
        setSelectedProject(projectList[0].id)
      }

      if (selectedProject) {
        const { data: docs } = await supabase
          .from('documents')
          .select('*')
          .eq('project_id', selectedProject)
          .order('created_at', { ascending: false })

        setDocuments(docs || [])
      }
    } catch (error) {
      console.error('[v0] Error loading documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (!files || !selectedProject) return

    setUploading(true)
    try {
      const supabase = createClient()
      const file = files[0]

      // Create document record
      const { data: doc, error } = await supabase
        .from('documents')
        .insert([{
          project_id: selectedProject,
          organization_id: (await supabase.auth.getUser()).data.user?.id,
          name: file.name,
          file_type: file.type,
          file_size: file.size,
          file_path: `documents/${selectedProject}/${Date.now()}-${file.name}`,
          status: 'analyzing',
        }])
        .select()
        .single()

      if (!error && doc) {
        setDocuments(prev => [doc, ...prev])
        
        // Simulate analysis
        setTimeout(() => {
          supabase
            .from('documents')
            .update({ status: 'completed' })
            .eq('id', doc.id)
            .then(() => {
              setDocuments(prev => 
                prev.map(d => d.id === doc.id ? { ...d, status: 'completed' } : d)
              )
            })
        }, 3000)
      }
    } catch (err) {
      console.error('[v0] Upload error:', err)
    } finally {
      setUploading(false)
      e.currentTarget.value = ''
    }
  }

  const handleDelete = async (docId: string) => {
    try {
      const supabase = createClient()
      await supabase.from('documents').delete().eq('id', docId)
      setDocuments(prev => prev.filter(d => d.id !== docId))
    } catch (error) {
      console.error('[v0] Delete error:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-primary" />
      case 'analyzing':
        return <Clock className="w-5 h-5 text-yellow-500 animate-spin" />
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-destructive" />
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Documentos</h1>
        <p className="text-muted-foreground">Carga y analiza documentos críticos</p>
      </div>

      {/* Project selector */}
      {projects.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Proyecto</label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full max-w-md bg-card border border-border rounded-lg px-4 py-2"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Upload area */}
      <div className="border-2 border-dashed border-border rounded-lg p-12 text-center space-y-4 hover:border-primary/50 transition-colors">
        <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
        <div>
          <h3 className="font-semibold text-lg mb-2">Sube un documento</h3>
          <p className="text-muted-foreground mb-4">
            Contratos, TDR, normativas, o cualquier documento crítico
          </p>
          <label>
            <Button disabled={uploading} asChild>
              <span>{uploading ? 'Subiendo...' : 'Seleccionar archivo'}</span>
            </Button>
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.xlsx,.xls"
            />
          </label>
        </div>
      </div>

      {/* Documents list */}
      {documents.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Documentos cargados</h2>
          <div className="space-y-2">
            {documents.map(doc => (
              <div key={doc.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <File className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{doc.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(doc.file_size)} • {new Date(doc.created_at).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                  {doc.status === 'completed' && (
                    <Link href={`/documents/${doc.id}`}>
                      <Button variant="outline" size="sm">Ver análisis</Button>
                    </Link>
                  )}
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  {getStatusIcon(doc.status)}
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 hover:bg-secondary rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && documents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No hay documentos. Comienza cargando uno.</p>
        </div>
      )}
    </div>
  )
}
