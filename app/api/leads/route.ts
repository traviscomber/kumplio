import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

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
})

export async function POST(req: NextRequest) {
  try {
    const parsed = leadSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Revisa los datos ingresados e intenta nuevamente.' },
        { status: 400 },
      )
    }

    const pipedriveWebhook = process.env.PIPEDRIVE_WEBHOOK_URL
    if (!pipedriveWebhook) {
      console.error('[LEAD_CAPTURE_FAILED] PIPEDRIVE_WEBHOOK_URL no está configurado')
      return NextResponse.json(
        { error: 'El canal de contacto no está disponible temporalmente.' },
        { status: 503 },
      )
    }

    const lead = parsed.data
    const response = await fetch(pipedriveWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        person_name: lead.nombre,
        person_email: lead.email,
        org_name: lead.empresa,
        custom_properties: {
          industria: lead.industria,
          empleados: lead.empleados,
          telefono: lead.telefono,
          pain_point: lead.mensaje,
          source: lead.source,
          submitted_at: lead.timestamp || new Date().toISOString(),
        },
      }),
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error('[LEAD_CAPTURE_FAILED]', {
        status: response.status,
        statusText: response.statusText,
      })
      return NextResponse.json(
        { error: 'No fue posible registrar tu solicitud. Intenta nuevamente.' },
        { status: 502 },
      )
    }

    console.info('[LEAD_CAPTURED]', {
      empresa: lead.empresa,
      industria: lead.industria,
      source: lead.source,
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('[LEAD_CAPTURE_ERROR]', error)
    return NextResponse.json(
      { error: 'Error procesando la solicitud.' },
      { status: 500 },
    )
  }
}
