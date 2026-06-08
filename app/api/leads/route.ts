import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { nombre, email, empresa, industria, empleados, telefono, mensaje } = await req.json()

    // Validate required fields
    if (!nombre || !email || !empresa || !industria || !empleados) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Here you would integrate with Pipedrive or HubSpot
    // Example for Pipedrive webhook:
    const pipedriveWebhook = process.env.PIPEDRIVE_WEBHOOK_URL
    if (pipedriveWebhook) {
      await fetch(pipedriveWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          person_name: nombre,
          person_email: email,
          org_name: empresa,
          custom_properties: {
            industria,
            empleados,
            telefono,
            pain_point: mensaje,
          },
        }),
      })
    }

    // Store in database if you have one
    // Example with Supabase:
    // const supabase = createClient()
    // await supabase.from('leads').insert({ nombre, email, empresa, industria, empleados, telefono, mensaje })

    // For now, just log it
    console.log('[LEAD_CAPTURED]', { nombre, email, empresa, industria })

    // Send confirmation email (you would use SendGrid, Mailgun, etc)
    // Example:
    // await sendEmail({
    //   to: email,
    //   subject: 'Hemos recibido tu solicitud - KUMPLIO',
    //   template: 'contact_confirmation',
    // })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error in /api/leads:', error)
    return NextResponse.json(
      { error: 'Error procesando solicitud' },
      { status: 500 }
    )
  }
}
