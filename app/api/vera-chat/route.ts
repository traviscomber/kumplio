export const runtime = 'nodejs'

const responseBody = {
  error: 'Vera no está disponible mientras se valida su corpus y trazabilidad.',
  code: 'assistant_retired',
}

export function POST() {
  return Response.json(responseBody, {
    status: 410,
    headers: {
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
