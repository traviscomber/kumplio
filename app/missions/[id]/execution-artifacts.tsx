import { FileOutput, Link2, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export async function ExecutionArtifacts({ missionId }: { missionId: string }) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('mission_execution_artifacts')
    .select('id,artifact_type,title,version,confidence,source_refs,created_by_agent_id,created_at,capability_run_id')
    .eq('mission_id', missionId)
    .order('created_at', { ascending: false })
    .limit(12)

  const artifacts = data || []
  if (!artifacts.length) return null

  return (
    <div className="border-b border-border bg-background">
      <div className="container mx-auto px-4 py-5 sm:px-6">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <FileOutput className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-bold">Artefactos de ejecución</h3>
              <p className="text-sm text-muted-foreground">Entregas versionadas e inmutables producidas por los workers autorizados.</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {artifacts.map((artifact) => {
              const sources = Array.isArray(artifact.source_refs) ? artifact.source_refs.length : 0
              return (
                <article key={artifact.id} className="rounded-xl border border-border bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{artifact.artifact_type} · v{artifact.version}</p>
                      <h4 className="mt-1 font-bold">{artifact.title}</h4>
                    </div>
                    <ShieldCheck className="h-4 w-4 text-primary" />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>{artifact.created_by_agent_id}</span>
                    <span className="inline-flex items-center"><Link2 className="mr-1 h-3.5 w-3.5" />{sources} fuentes</span>
                    {artifact.confidence != null && <span>Confianza {Math.round(Number(artifact.confidence) * 100)}%</span>}
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
