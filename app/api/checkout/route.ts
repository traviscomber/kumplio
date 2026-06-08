import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const NOTIFY_EMAIL = 'info@kumplio.app'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      planName,
      billingCycle,
      priceUF,
      totalCLP,
      nombre,
      email,
      empresa,
      rut,
      telefono,
    } = body

    // Validate required fields
    if (!planName || !nombre || !email || !empresa) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 },
      )
    }

    const apiKey = process.env.RESEND_API_KEY

    // Build a readable summary for the internal team + customer
    const fechaCL = new Date().toLocaleString('es-CL', {
      timeZone: 'America/Santiago',
      dateStyle: 'full',
      timeStyle: 'short',
    })

    const rows: Array<[string, string]> = [
      ['Plan', planName],
      ['Ciclo de facturación', billingCycle === 'anual' ? 'Anual' : 'Mensual'],
      ['Precio', `${priceUF} ${billingCycle === 'anual' ? '/año' : '/mes'}`],
      ['Total estimado', totalCLP || '—'],
      ['Empresa', empresa],
      ['RUT', rut || '—'],
      ['Contacto', nombre],
      ['Email', email],
      ['Teléfono', telefono || '—'],
      ['Fecha solicitud', fechaCL],
    ]

    const tableRows = rows
      .map(
        ([label, value]) =>
          `<tr><td style="padding:8px 12px;border-bottom:1px solid #1f2937;color:#9ca3af;font-size:14px;">${label}</td><td style="padding:8px 12px;border-bottom:1px solid #1f2937;color:#f9fafb;font-size:14px;font-weight:600;">${value}</td></tr>`,
      )
      .join('')

    const internalHtml = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;background:#0a0a0a;padding:32px;border-radius:12px;">
        <h1 style="color:#bdf26b;font-size:20px;margin:0 0 8px;">Nueva compra pendiente de activación</h1>
        <p style="color:#9ca3af;font-size:14px;margin:0 0 24px;">Un cliente completó el checkout en KUMPLIO. Activar la cuenta manualmente.</p>
        <table style="width:100%;border-collapse:collapse;background:#111827;border-radius:8px;overflow:hidden;">${tableRows}</table>
        <p style="color:#6b7280;font-size:12px;margin:24px 0 0;">Pago aún no procesado automáticamente. Confirmar pago y habilitar al cliente.</p>
      </div>`

    const customerHtml = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;background:#0a0a0a;padding:32px;border-radius:12px;">
        <h1 style="color:#bdf26b;font-size:20px;margin:0 0 8px;">Recibimos tu solicitud, ${nombre.split(' ')[0]}</h1>
        <p style="color:#d1d5db;font-size:14px;line-height:1.6;margin:0 0 16px;">
          Gracias por elegir KUMPLIO. Hemos recibido tu solicitud para el <strong style="color:#f9fafb;">Plan ${planName}</strong>.
          Nuestro equipo verificará el pago y activará tu cuenta dentro de las próximas horas hábiles.
        </p>
        <table style="width:100%;border-collapse:collapse;background:#111827;border-radius:8px;overflow:hidden;">${tableRows}</table>
        <p style="color:#9ca3af;font-size:13px;line-height:1.6;margin:24px 0 0;">
          Si tienes dudas, responde a este correo o escríbenos a info@kumplio.app.
        </p>
      </div>`

    // If no API key, fall back to logging so checkout still works in dev
    if (!apiKey) {
      console.log('[v0] CHECKOUT_NO_RESEND_KEY — would email info@kumplio.app:', {
        planName,
        billingCycle,
        nombre,
        email,
        empresa,
        rut,
        telefono,
      })
      return NextResponse.json(
        { success: true, emailed: false },
        { status: 200 },
      )
    }

    const resend = new Resend(apiKey)

    // Internal notification to the team
    await resend.emails.send({
      from: 'KUMPLIO <onboarding@resend.dev>',
      to: NOTIFY_EMAIL,
      replyTo: email,
      subject: `Nueva compra: ${planName} — ${empresa}`,
      html: internalHtml,
    })

    // Confirmation to the customer
    await resend.emails.send({
      from: 'KUMPLIO <onboarding@resend.dev>',
      to: email,
      subject: 'Recibimos tu solicitud — KUMPLIO',
      html: customerHtml,
    })

    return NextResponse.json({ success: true, emailed: true }, { status: 200 })
  } catch (error) {
    console.error('[v0] Error in /api/checkout:', error)
    return NextResponse.json(
      { error: 'Error procesando la solicitud' },
      { status: 500 },
    )
  }
}
