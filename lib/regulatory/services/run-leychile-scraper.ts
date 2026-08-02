import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'

const SOURCE_URL = 'https://www.bcn.cl/leychile/'
const API_URL = 'https://servicios-leychile.bcn.cl/Navegar/get_norma_json?idNorma=1209272&idVersion=2026-12-01&idLey=&tipoVersion=&cve=&agrupa_partes=1&r='

export type LeyChileScraperTrigger = 'manual' | 'cron' | 'retry'

export type LeyChileScraperRun = {
  source: 'leychile'
  trigger: LeyChileScraperTrigger
  status: 'succeeded' | 'unchanged' | 'failed'
  sourceParts: number
  articleSections: number
  incisoSections: number
  totalSections: number
  versionNumber: number | null
  fetchId: string | null
  durationMs: number
  error: string | null
}

export async function runLeyChileScraper(trigger: LeyChileScraperTrigger): Promise<LeyChileScraperRun> {
  const startedAt = Date.now()
  const admin = createAdminClient()

  const { data: source, error: sourceError } = await admin
    .from('regulatory_sources')
    .select('id')
    .eq('canonical_url', SOURCE_URL)
    .single()

  if (sourceError || !source) {
    throw new Error('leychile_source_not_registered')
  }

  try {
    const { data, error } = await admin.functions.invoke('leychile-bootstrap', {
      body: { trigger },
    })

    if (error) {
      throw new Error(`leychile_edge_function_failed:${error.message}`)
    }

    if (!data?.ok) {
      throw new Error(`leychile_capture_failed:${data?.error || 'unknown'}`)
    }

    const recordStatus = data.record?.status === 'unchanged' ? 'unchanged' : 'succeeded'

    return {
      source: 'leychile',
      trigger,
      status: recordStatus,
      sourceParts: Number(data.sourceParts || 0),
      articleSections: Number(data.articleSections || 0),
      incisoSections: Number(data.incisoSections || 0),
      totalSections: Number(data.totalSections || 0),
      versionNumber: data.record?.versionNumber ? Number(data.record.versionNumber) : null,
      fetchId: data.record?.fetchId || null,
      durationMs: Date.now() - startedAt,
      error: null,
    }
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : 'leychile_capture_failed'
    const errorCode = message.split(':')[0] || 'leychile_capture_failed'

    await admin.from('regulatory_source_fetches').insert({
      source_id: source.id,
      requested_url: API_URL,
      final_url: API_URL,
      status: 'failed',
      connector_version: 'leychile-official-json-v1',
      error_code: errorCode,
      error_message: message.slice(0, 1000),
      response_headers: { trigger },
    })

    await admin
      .from('regulatory_sources')
      .update({
        health_status: 'failed',
        last_error_at: new Date().toISOString(),
        last_error_code: errorCode,
      })
      .eq('id', source.id)

    return {
      source: 'leychile',
      trigger,
      status: 'failed',
      sourceParts: 0,
      articleSections: 0,
      incisoSections: 0,
      totalSections: 0,
      versionNumber: null,
      fetchId: null,
      durationMs: Date.now() - startedAt,
      error: message,
    }
  }
}
