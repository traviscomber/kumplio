import { chileComplianceGuides } from '@/lib/chile-compliance-content'
import { PUBLIC_DISCOVERY, SITE_NAME, SITE_URL } from '@/lib/public-site'

export const dynamic = 'force-static'

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

export function GET() {
  const buildDate = new Date(`${PUBLIC_DISCOVERY.lastReviewed}T12:00:00-04:00`).toUTCString()
  const items = chileComplianceGuides.map((guide) => {
    const url = `${SITE_URL}/resources/ley-21719/${guide.slug}`
    return `<item>
  <title>${escapeXml(guide.title)}</title>
  <link>${url}</link>
  <guid isPermaLink="true">${url}</guid>
  <description>${escapeXml(guide.description)}</description>
  <category>Ley 21.719</category>
  <category>Protección de datos personales</category>
  <category>Privacidad Chile</category>
  <pubDate>${buildDate}</pubDate>
</item>`
  }).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${SITE_NAME} — Protección de datos y Ley 21.719 en Chile</title>
  <link>${SITE_URL}/resources/ley-21719</link>
  <description>Guías públicas sobre protección de datos personales, privacidad, Ley 21.719, evidencia y preparación para organizaciones en Chile.</description>
  <language>es-cl</language>
  <lastBuildDate>${buildDate}</lastBuildDate>
  <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
  ${items}
</channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  })
}
