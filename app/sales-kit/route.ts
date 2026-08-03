import { NextResponse } from 'next/server'

const retiredPage = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="robots" content="noindex, nofollow, noarchive">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Contenido retirado | Kumplio</title>
</head>
<body>
  <main>
    <h1>Este contenido fue retirado</h1>
    <p>La información de esta página ya no representa la oferta pública de Kumplio.</p>
    <p><a href="/resources/cumplimiento-normativo">Ir al centro de recursos</a></p>
  </main>
</body>
</html>`

export function GET() {
  return new NextResponse(retiredPage, {
    status: 410,
    headers: {
      'Cache-Control': 'public, max-age=0, s-maxage=3600',
      'Content-Type': 'text/html; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
    },
  })
}

export function HEAD() {
  return new NextResponse(null, {
    status: 410,
    headers: {
      'Cache-Control': 'public, max-age=0, s-maxage=3600',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
    },
  })
}
