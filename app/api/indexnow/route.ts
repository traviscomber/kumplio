import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { SITE_URL } from '@/lib/public-site'

const requestSchema = z.object({
  urls: z.array(z.string().url()).min(1).max(10000),
})

export async function POST(request: NextRequest) {
  const secret = process.env.INDEXNOW_SECRET
  const authorization = request.headers.get('authorization')

  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const key = process.env.INDEXNOW_KEY
  if (!key) {
    return NextResponse.json({ error: 'INDEXNOW_KEY no está configurado' }, { status: 503 })
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Lista de URLs inválida' }, { status: 400 })
  }

  const allowedOrigin = new URL(SITE_URL).origin
  const urlList = [...new Set(parsed.data.urls)].filter((value) => {
    try {
      const url = new URL(value)
      return url.origin === allowedOrigin && url.protocol === 'https:'
    } catch {
      return false
    }
  })

  if (!urlList.length) {
    return NextResponse.json({ error: 'No hay URLs válidas de kumplio.app' }, { status: 400 })
  }

  const response = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: new URL(SITE_URL).host,
      key,
      keyLocation: `${SITE_URL}/indexnow-key.txt`,
      urlList,
    }),
    cache: 'no-store',
  })

  if (!response.ok && response.status !== 202) {
    const detail = await response.text().catch(() => '')
    console.error('[INDEXNOW_FAILED]', { status: response.status, detail })
    return NextResponse.json({ error: 'IndexNow rechazó la solicitud' }, { status: 502 })
  }

  return NextResponse.json({ success: true, submitted: urlList.length, status: response.status })
}
