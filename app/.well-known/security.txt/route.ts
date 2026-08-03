import { SITE_URL } from '@/lib/public-site'

export const dynamic = 'force-static'

export function GET() {
  const content = `Contact: mailto:security@kumplio.app
Preferred-Languages: es, en
Canonical: ${SITE_URL}/.well-known/security.txt
Policy: ${SITE_URL}/security
Expires: 2027-08-03T23:59:59.000Z
`

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  })
}
