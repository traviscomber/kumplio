import { Activity, BadgeDollarSign, Clock3, Cpu, ListChecks, Wrench } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

function money(microusd: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'USD', minimumFractionDigits: 4 }).format(microusd / 1_000_000)
}

function duration(milliseconds: number) {
  if (milliseconds < 1000) return `${milliseconds} ms`
  if (milliseconds < 60000) return `${(milliseconds / 1000).toFixed(1)} s`
  return `${(milliseconds / 60000).toFixed(1)} min`
}

export async function ExecutionObservability({ missionId }: { missionId: string }) {
  const supabase = await createClient()
  const [jobsResult, modelResult, toolsResult, qualityResult] = await Promise.all([
    supabase.from('mission_execution_jobs').select('id,status,worker_id,attempt,total_input_tokens,total_output_tokens,total_cost_microusd,total_latency_ms,quality_score,created_at,updated_at,error_message').eq('mission_id', missionId).order('created_at', { ascending: false }).limit(20),
    supabase.from('mission_model_runs').select('id,provider,model,operation,input_tokens,output_tokens,latency_ms,cost_microusd,created_at').eq('mission_id', missionId).order('created_at', { ascending: false }).limit(20),
    supabase.from('mission_tool_calls').select('id,tool_key,source_key,status,latency_ms,created_at').eq('mission_id', missionId).order('created_at', { ascending: false }).limit(20),
    supabase.from('mission_quality_evaluations').select('id,evaluator_agent_id,rubric_version,score,passed,created_at').eq('mission_id', missionId).order('created_at', { ascending: false }).limit(20),
  ])

  const jobs = jobsResult.data || []
  const models = modelResult.data || []
  const tools = toolsResult.data || []
  const quality = qualityResult.data || []
  if (!jobs.length && !models.length && !tools.length && !quality.length) return null

  const inputTokens = jobs.reduce((sum, job) => sum + Number(job.total_input_tokens || 0), 0)
  const outputTokens = jobs.reduce((sum, job) => sum + Number(job.total_output_tokens || 0), 0)
  const totalCost = jobs.reduce((sum, job) => sum + Number(job.total_cost_microusd || 0), 0)
  const totalLatency = jobs.reduce((sum, job) => sum + Number(job.total_latency_ms || 0), 0)
  const scored = quality.filter((item) => item.score != null)
  const averageQuality = scored.length ? scored.reduce((sum, item) => sum + Number(item.score), 0) / scored.length : null

  return (
    <section className="border-b border-border bg-background">
      <div className="container mx-auto px-4 py-6 sm:px-6">
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-semibold text-primary">Observabilidad</p>
            <h2 className="text-xl font-bold">Ejecución, consumo y calidad</h2>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Metric icon={Cpu} label="Tokens" value={`${inputTokens.toLocaleString('es-CL')} / ${outputTokens.toLocaleString('es-CL')}`} detail="entrada / salida" />
          <Metric icon={BadgeDollarSign} label="Costo" value={money(totalCost)} detail="registrado en USD" />
          <Metric icon={Clock3} label="Latencia" value={duration(totalLatency)} detail="acumulada" />
          <Metric icon={Wrench} label="Herramientas" value={String(tools.length)} detail={`${tools.filter((item) => item.status === 'blocked').length} bloqueadas`} />
          <Metric icon={ListChecks} label="Calidad" value={averageQuality == null ? 'Pendiente' : `${Math.round(averageQuality * 100)}%`} detail={`${quality.filter((item) => item.passed).length}/${quality.length} aprobadas`} />
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          <Panel title="Cola de ejecución">
            {jobs.slice(0, 6).map((job) => (
              <div key={job.id} className="flex items-start justify-between gap-3 border-b border-border py-3 last:border-0">
                <div><p className="text-sm font-semibold">{job.worker_id}</p><p className="text-xs text-muted-foreground">Intento {job.attempt} · {duration(Number(job.total_latency_ms || 0))}</p></div>
                <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold">{job.status}</span>
              </div>
            ))}
          </Panel>
          <Panel title="Modelos utilizados">
            {models.slice(0, 6).map((run) => (
              <div key={run.id} className="border-b border-border py-3 last:border-0">
                <div className="flex justify-between gap-3"><p className="text-sm font-semibold">{run.model}</p><p className="text-xs font-semibold">{money(Number(run.cost_microusd || 0))}</p></div>
                <p className="text-xs text-muted-foreground">{run.provider} · {run.operation} · {duration(Number(run.latency_ms || 0))}</p>
              </div>
            ))}
          </Panel>
          <Panel title="Control de calidad">
            {quality.slice(0, 6).map((evaluation) => (
              <div key={evaluation.id} className="flex items-start justify-between gap-3 border-b border-border py-3 last:border-0">
                <div><p className="text-sm font-semibold">{evaluation.evaluator_agent_id}</p><p className="text-xs text-muted-foreground">Rúbrica {evaluation.rubric_version}</p></div>
                <span className={`rounded-full px-2 py-1 text-xs font-bold ${evaluation.passed ? 'bg-emerald-500/10 text-emerald-700' : 'bg-red-500/10 text-red-700'}`}>{Math.round(Number(evaluation.score) * 100)}%</span>
              </div>
            ))}
          </Panel>
        </div>
      </div>
    </section>
  )
}

function Metric({ icon: Icon, label, value, detail }: { icon: typeof Cpu; label: string; value: string; detail: string }) {
  return <div className="rounded-xl border border-border bg-card p-4"><Icon className="h-4 w-4 text-primary" /><p className="mt-3 text-xs text-muted-foreground">{label}</p><p className="mt-1 font-bold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-xl border border-border bg-card p-4"><h3 className="font-bold">{title}</h3><div className="mt-2">{children}</div></div>
}
