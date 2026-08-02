import { createHash } from 'node:crypto'

function decodeEntities(value) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/gi, "'")
    .replace(/&aacute;/gi, 'á').replace(/&eacute;/gi, 'é')
    .replace(/&iacute;/gi, 'í').replace(/&oacute;/gi, 'ó').replace(/&uacute;/gi, 'ú')
    .replace(/&ntilde;/gi, 'ñ')
}

function text(value = '') {
  return decodeEntities(value.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
}

export function hashDiarioOficial(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

export function canonicalDiarioOficialEditionUrl(date, edition) {
  if (!/^\d{2}-\d{2}-\d{4}$/.test(date)) throw new Error('invalid_edition_date')
  if (!/^\d{4,6}$/.test(String(edition))) throw new Error('invalid_edition_number')
  return `https://www.diariooficial.interior.gob.cl/edicionelectronica/index.php/index.php?date=${date}&edition=${edition}`
}

export function parseDiarioOficialEdition(html, options = {}) {
  const normalizedHtml = html.replace(/\r\n?/g, '\n')
  const visible = text(normalizedHtml)
  const editionMatch = visible.match(/Edici[oó]n\s+N[uú]m\.?\s*([\d.]+)/i)
  const dateMatch = visible.match(/(?:Lunes|Martes|Mi[eé]rcoles|Jueves|Viernes|S[aá]bado|Domingo)\s+(\d{1,2})\s+de\s+([A-Za-zÁÉÍÓÚáéíóúñÑ]+)\s+de\s+(\d{4})/i)
  if (!editionMatch) throw new Error('parse_edition_number_missing')

  const editionNumber = editionMatch[1].replace(/\./g, '')
  const publicationPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>[\s\S]*?(?:CVE[-\s]*(\d{5,12}))[\s\S]*?<\/a>/gi
  const matches = [...normalizedHtml.matchAll(publicationPattern)]
  const publications = []
  const seen = new Set()

  for (const match of matches) {
    const cve = match[2]
    if (seen.has(cve)) continue
    seen.add(cve)

    const anchorHtml = match[0]
    const surroundingStart = Math.max(0, (match.index || 0) - 1800)
    const surrounding = normalizedHtml.slice(surroundingStart, (match.index || 0) + anchorHtml.length)
    const rows = [...surrounding.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)]
    const rowHtml = rows.at(-1)?.[1] || surrounding
    const cells = [...rowHtml.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((item) => text(item[1])).filter(Boolean)
    const title = cells.find((cell) => /(?:ley|decreto|resoluci[oó]n|certificado|extracto|acuerdo|circular|aviso)/i.test(cell)) || cells.at(-2) || text(rowHtml)
    if (!title || title.length < 8) continue

    const headings = [...surrounding.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map((item) => text(item[2])).filter(Boolean)
    const upper = headings.filter((heading) => heading === heading.toUpperCase() && heading.length > 3)
    const power = upper.find((heading) => /^PODER\s+/i.test(heading)) || null
    const ministry = [...upper].reverse().find((heading) => /^MINISTERIO\s+/i.test(heading)) || null
    const agency = cells.length > 2 ? cells.at(-3) : null
    const href = new URL(match[1], 'https://www.diariooficial.interior.gob.cl').toString()
    const normalizedTitle = title.replace(/\s+/g, ' ').trim()

    publications.push({
      cve,
      title: normalizedTitle,
      power,
      ministry,
      agency: agency && agency !== normalizedTitle ? agency : null,
      section: 'normas_generales',
      pdfUrl: href,
      hash: hashDiarioOficial(JSON.stringify({ cve, title: normalizedTitle, power, ministry, agency, href })),
    })
  }

  if (publications.length === 0) throw new Error('parse_publications_missing')

  return {
    editionNumber,
    editionLabel: `Edición ${editionMatch[1]}`,
    publicationDateLabel: dateMatch ? dateMatch[0] : null,
    parserVersion: options.parserVersion || 'diario-oficial-summary-v1',
    publicationCount: publications.length,
    publications,
    normalizedEdition: publications.map((item) => `${item.cve}|${item.hash}`).sort().join('\n'),
  }
}

export function diffDiarioOficialPublications(previous = [], current = []) {
  const before = new Map(previous.map((item) => [item.cve, item]))
  const after = new Map(current.map((item) => [item.cve, item]))
  const added = []
  const removed = []
  const modified = []
  const unchanged = []

  for (const [cve, item] of after) {
    if (!before.has(cve)) added.push(item)
    else if (before.get(cve).hash !== item.hash) modified.push({ before: before.get(cve), after: item })
    else unchanged.push(item)
  }
  for (const [cve, item] of before) if (!after.has(cve)) removed.push(item)
  return { added, removed, modified, unchanged, changeCount: added.length + removed.length + modified.length }
}
