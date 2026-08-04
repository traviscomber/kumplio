import { createHash } from 'node:crypto'

const MONTHS = new Map([
  ['enero', '01'],
  ['febrero', '02'],
  ['marzo', '03'],
  ['abril', '04'],
  ['mayo', '05'],
  ['junio', '06'],
  ['julio', '07'],
  ['agosto', '08'],
  ['septiembre', '09'],
  ['octubre', '10'],
  ['noviembre', '11'],
  ['diciembre', '12'],
])

function decodeEntities(value = '') {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&deg;/gi, '°')
    .replace(/&ordm;/gi, 'º')
    .replace(/&aacute;/gi, 'á')
    .replace(/&eacute;/gi, 'é')
    .replace(/&iacute;/gi, 'í')
    .replace(/&oacute;/gi, 'ó')
    .replace(/&uacute;/gi, 'ú')
    .replace(/&ntilde;/gi, 'ñ')
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) => String.fromCodePoint(Number.parseInt(code, 16)))
}

function text(value = '') {
  return decodeEntities(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim()
}

function dateLabelToIso(label) {
  const match = label?.match(
    /(?:Lunes|Martes|Mi[eé]rcoles|Jueves|Viernes|S[aá]bado|Domingo)\s+(\d{1,2})\s+de\s+([A-Za-zÁÉÍÓÚáéíóúñÑ]+)\s+de\s+(\d{4})/i,
  )
  if (!match) return null
  const month = MONTHS.get(match[2].toLocaleLowerCase('es-CL'))
  if (!month) return null
  return `${match[3]}-${month}-${match[1].padStart(2, '0')}`
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
  const normalizedHtml = String(html || '').replace(/\r\n?/g, '\n')
  const visible = text(normalizedHtml)
  const editionMatch = visible.match(/Edici[oó]n\s+N[uú]m\.?\s*([\d.]+)/i)
  const dateMatch = visible.match(
    /(?:Lunes|Martes|Mi[eé]rcoles|Jueves|Viernes|S[aá]bado|Domingo)\s+\d{1,2}\s+de\s+[A-Za-zÁÉÍÓÚáéíóúñÑ]+\s+de\s+\d{4}/i,
  )

  if (!editionMatch) throw new Error('parse_edition_number_missing')
  if (!dateMatch) throw new Error('parse_publication_date_missing')

  const editionNumber = editionMatch[1].replace(/\./g, '')
  const publicationDateLabel = dateMatch[0]
  const publicationDateIso = dateLabelToIso(publicationDateLabel)
  if (!publicationDateIso) throw new Error('parse_publication_date_invalid')

  const summaryMatch = normalizedHtml.match(
    /href=["']([^"']+\/sumarios\/[0-9]{4,6}\.pdf)["'][^>]*>[\s\S]*?Sumario de la Edici[oó]n/i,
  )
  const summaryPdfUrl = summaryMatch
    ? new URL(summaryMatch[1], 'https://www.diariooficial.interior.gob.cl').toString()
    : null

  let power = null
  let ministry = null
  let agency = null
  const publications = []
  const seen = new Set()
  const tokenPattern = /<td\b[^>]*class=["'](title[345])["'][^>]*>([\s\S]*?)<\/td>|<tr\b[^>]*class=["']content["'][^>]*>([\s\S]*?)<\/tr>/gi

  for (const token of normalizedHtml.matchAll(tokenPattern)) {
    if (token[1]) {
      const heading = text(token[2])
      if (!heading) continue

      if (token[1].toLowerCase() === 'title3') {
        power = heading
        ministry = null
        agency = null
      } else if (token[1].toLowerCase() === 'title4') {
        ministry = heading
        agency = null
      } else {
        agency = heading
      }
      continue
    }

    const rowHtml = token[3] || ''
    const cells = [...rowHtml.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)]
    if (cells.length < 2) continue

    const title = text(cells[0][1])
    const anchor = cells[1][1].match(
      /<a\b[^>]*href=["']([^"']+)["'][^>]*>[\s\S]*?CVE[-\s]*(\d{5,12})[\s\S]*?<\/a>/i,
    )
    if (!anchor || title.length < 8) continue

    const cve = anchor[2]
    if (seen.has(cve)) continue
    seen.add(cve)

    const pdfUrl = new URL(anchor[1], 'https://www.diariooficial.interior.gob.cl').toString()
    if (!/^https:\/\/www\.diariooficial\.interior\.gob\.cl\/publicaciones\//.test(pdfUrl)) {
      throw new Error('parse_pdf_host_invalid')
    }

    const publication = {
      cve,
      section: 'normas_generales',
      power,
      ministry,
      agency,
      title,
      pdfUrl,
    }

    publications.push({
      ...publication,
      hash: hashDiarioOficial(JSON.stringify(publication)),
    })
  }

  if (publications.length === 0) throw new Error('parse_publications_missing')

  return {
    editionNumber,
    editionLabel: `Edición ${editionMatch[1]}`,
    publicationDateLabel,
    publicationDateIso,
    summaryPdfUrl,
    parserVersion: options.parserVersion || 'diario-oficial-summary-v1',
    publicationCount: publications.length,
    publications,
    normalizedEdition: publications
      .map((publication) => `${publication.cve}|${publication.hash}`)
      .sort()
      .join('\n'),
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

  for (const [cve, item] of before) {
    if (!after.has(cve)) removed.push(item)
  }

  return {
    added,
    removed,
    modified,
    unchanged,
    changeCount: added.length + removed.length + modified.length,
  }
}
