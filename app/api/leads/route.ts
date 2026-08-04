import { createHmac, randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
const RATE_LIMIT_MAX_REQUESTS = 5

const leadSchema = z.object({
  nombre: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  empresa: z.string().trim().min(2).max(160),
  industria: z.string().trim().min(2).max(80),
  empleados: z.string().trim().min(1).max(40),
  telefono: z.string().trim().max(40).optional().default(''),
  mensaje: z.string().trim().max(3000).optional().default(''),
  source: z.string().trim().max(80).optional().default('contact-page'),
  timestamp: z.string().datetime().optional(),
  website: z.string().trim().max(200).optional().default(''),
})

function noStoreJson(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  })
}

function getClientIp(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null
}

function hashIp(ip: string | null) {
  if (!ip) return null
  const secret =
    process.env.LEAD_HASH_SECRET ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!secret) throw new Error('Lead hashing secret is not configured')
  return createHmac('sha256', secret).update(ip).digest('hex')
}

function syncErrorMessage(response: Response) {
  return `Webhook ${response.status} ${response.statusText}`.slice(0, 500)
}

export async function POST(request: NextRequest) {
  try {
    const parsed = leadSchema.safeParse(await request.json())
    if (!parsed.success) {
      return noStoreJson(
        { error: 'Revisa los datos ingresados e intenta nuevamente.' },
        400,
      )
    }

    const lead = parsed.data

    // Campo señuelo: respondemos como éxito para no enseñar al bot cómo fue detectado.
    if (lead.website) return noStoreJson({ success: true }, 200)

    const supabase = createAdminClient()
    const ipHash = hashIp(getClientIp(request))
    const userAgent = request.headers.get('user-agent')?.slice(0, 500) || null

    if (ipHash) {
      const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString()
      const { count, error: rateLimitError } = await supabase
        .from('commercial_leads')
        .select('id', { count: 'exact', head: true })
        .eq('ip_hash', ipHash)
        .gte('created_at', windowStart)

      if (rateLimitError) {
        console.error('[LEAD_RATE_LIMIT_ERROR]', rateLimitError.code)
        return noStoreJson(
          { error: 'El canal de contacto no está disponible temporalmente.' },
          503,
        )
      }

      if ((count || 0) >= RATE_LIMIT_MAX_REQUESTS) {
        return noStoreJson(
          { error: 'Has enviado varias solicitudes. Intenta nuevamente más tarde.' },
          429,
        )
      }
    }

    const pipedriveWebhook = process.env.PIPEDRIVE_WEBHOOK_URL
    const requestKey = randomUUID()
    const submittedAt = lead.timestamp || new Date().toISOString()

    const { data: storedLead, error: insertError } = await supabase
      .from('commercial_leads')
      .insert({
        request_key: requestKey,
        submitted_at: submittedAt,
        nombre: lead.nombre,
        email: lead.email.toLowerCase(),
        empresa: lead.empresa,
        industria: lead.industria,
        empleados: lead.empleados,
        telefono: lead.telefono,
        mensaje: lead.mensaje,
        source: lead.source,
        sync_status: pipedriveWebhook ? 'pending' : 'not_configured',
        ip_hash: ipHash,
        user_agent: userAgent,
      })
      .select('id')
      .single()

    if (insertError || !storedLead) {
      console.error('[LEAD_PERSISTENCE_ERROR]', insertError?.code || 'missing_row')
      return noStoreJson(
        { error: 'No fue posible registrar tu solicitud. Intenta nuevamente.' },
        503,
      )
    }

    if (!pipedriveWebhook) {
      console.warn('[LEAD_SYNC_PENDING] PIPEDRIVE_WEBHOOK_URL no está configurado')
      return noStoreJson({ success: true, queued: true }, 202)
    }

    try {
      const response = await fetch(pipedriveWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          external_id: storedLead.id,
          person_name: lead.nombre,
          person_email: lead.email.toLowerCase(),
          org_name: lead.empresa,
          custom_properties: {
            industria: lead.industria,
            empleados: lead.empleados,
            telefono: lead.telefono,
            pain_point: lead.mensaje,
            source: lead.source,
            submitted_at: submittedAt,
          },
        }),
        cache: 'no-store',
        signal: AbortSignal.timeout(8_000),
      })

      if (!response.ok) {
        await supabase
          .from('commercial_leads')
          .update({
            sync_status: 'failed',
            sync_attempts: 1,
            last_sync_error: syncErrorMessage(response),
          })
          .eq('id', storedLead.id)

        console.error('[LEAD_SYNC_FAILED]', response.status)
        return noStoreJson({ success: true, queued: true }, 202)
      }

      const { error: updateError } = await supabase
        .from('commercial_leads')
        .update({
          sync_status: 'synced',
          sync_attempts: 1,
          synced_at: new Date().toISOString(),
          last_sync_error: null,
        })
        .eq('id', storedLead.id)

      if (updateError) console.error('[LEAD_SYNC_STATE_ERROR]', updateError.code)

      console.info('[LEAD_CAPTURED]', {
        id: storedLead.id,
        source: lead.source,
        sync_status: 'synced',
      })

      return noStoreJson({ success: true }, 200)
    } catch (syncError) {
      const message = syncError instanceof Error ? syncError.name : 'unknown_sync_error'

      await supabase
        .from('commercial_leads')
        .update({
          sync_status: 'failed',
          sync_attempts: 1,
          last_sync_error: message.slice(0, 500),
        })
        .eq('id', storedLead.id)

      console.error('[LEAD_SYNC_ERROR]', message)
      return noStoreJson({ success: true, queued: true }, 202)
    }
  } catch (error) {
    console.error('[LEAD_CAPTURE_ERROR]', error instanceof Error ? error.name : 'unknown')
    return noStoreJson({ error: 'Error procesando la solicitud.' }, 500)
  }
}
