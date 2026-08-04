const BASE_URL = 'https://www.dt.gob.cl/legislacion/1624/'

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const SHORT_MONTHS = new Map([
  ['ene', '01'], ['feb', '02'], ['mar', '03'], ['abr', '04'],
  ['may', '05'], ['jun', '06'], ['jul', '07'], ['ago', '08'],
  ['sep', '09'], ['sept', '09'], ['oct', '10'], ['nov', '11'], ['dic', '12'],
])

const LONG_MONTHS = new Map(MONTHS.map((month, index) => [month.toLocaleLowerCase('es-CL'), String(index + 1).padStart(2, '0')]))

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
    .replace(/&Aacute;/g, 'Á')
    .replace(/&Eacute;/g, 'É')
    .replace(/&Iacute;/g, 'Í')
    .replace(/&Oacute;/g, 'Ó')
    .replace(/&Uacute;/g, 'Ú')
    .replace(/&ntilde;/gi, 'ñ')
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) => String.fromCodePoint(Number.parseInt(code, 16)))
}

export function normalizeWhitespace(value = '') {
  return decodeEntities(String(value))
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function htmlToText(value = '') {
  return normalizeWhitespace(
    String(value)
      .replace(/<!--([\s\S]*?)-->/g, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
}

export function htmlToLines(value = '') {
  const withBreaks = String(value)
    .replace(/<!--([\s\S]*?)-->/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|li|h[1-6]|tr|td|section|article)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')

  return decodeEntities(withBreaks)
    .split(/\n+/)
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean)
}

export async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(value)))
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export function monthName(month) {
  const numericMonth = Number(month)
  if (!Number.isInteger(numericMonth) || numericMonth < 1 || numericMonth > 12) {
    throw new Error('invalid_dt_month')
  }
  return MONTHS[numericMonth - 1]
}

export function canonicalDtDetailUrl(input) {
  const url = new URL(input, BASE_URL)
  if (url.protocol !== 'https:') throw new Error('dt_https_required')
  if (!['www.dt.gob.cl', 'dt.gob.cl'].includes(url.hostname.toLowerCase())) {
    throw new Error('dt_host_not_allowed')
  }
  if (!/^\/legislacion\/1624\/w3-article-[0-9]+[.]html$/.test(url.pathname)) {
    throw new Error('dt_detail_path_not_allowed')
  }
  url.hostname = 'www.dt.gob.cl'
  url.search = ''
  url.hash = ''
  return url.toString()
}

export function normalizeOfficialNumber(value = '') {
  return normalizeWhitespace(value)
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/^ORD(?:INARIO)?[.]?N[°º]?/, '')
    .replace(/^DICTAMEN[.:]?/, '')
    .replace(/^N[°º]/, '')
    .replace(/[^0-9A-Z./-]/g, '')
}

export function dtCanonicalIdentifier(pronouncementType, officialNumber) {
  const normalized = normalizeOfficialNumber(officialNumber).toLocaleLowerCase('es-CL')
  if (!normalized) throw new Error('dt_number_missing')
  return `dt:${pronouncementType}:${normalized}`
}

function parseIsoDateFromIndex(value) {
  const match = String(value).match(/\b(\d{2})\/(\d{2})\/(\d{4})\b/)
  return match ? `${match[3]}-${match[2]}-${match[1]}` : null
}

export function parseDtIndexPage(html, options) {
  const year = Number(options?.year)
  const month = Number(options?.month)
  const pronouncementType = options?.pronouncementType
  const monthLabel = monthName(month)

  if (year !== 2026) throw new Error('dt_index_year_not_supported')
  if (!['dictamen', 'ordinario'].includes(pronouncementType)) {
    throw new Error('dt_index_type_not_supported')
  }

  const normalizedHtml = String(html || '').replace(/\r\n?/g, '\n')
  const groupMatch = normalizedHtml.match(
    new RegExp(`<a\\s+href=["']#(articulos_periodo_group_pvid_[0-9]+)["'][^>]*>\\s*${monthLabel}\\s*</a>`, 'i'),
  )
  if (!groupMatch) throw new Error('dt_index_month_group_missing')

  const marker = `<div id="${groupMatch[1]}"`
  const start = normalizedHtml.indexOf(marker)
  if (start < 0) throw new Error('dt_index_month_block_missing')

  const nextGroup = normalizedHtml.indexOf('<div id="articulos_periodo_group_pvid_', start + marker.length)
  const block = normalizedHtml.slice(start, nextGroup > start ? nextGroup : normalizedHtml.length)
  const cards = block.split('<div class="recuadro">').slice(1)
  const entries = []
  const seen = new Set()

  for (const cardSegment of cards) {
    const card = cardSegment.split('</div>')[0]
    const link = card.match(/<h3[^>]*class=["'][^"']*titulo[^"']*["'][^>]*>\s*<a[^>]*href=["']([^"']*w3-article-[0-9]+[.]html)["'][^>]*>([\s\S]*?)<\/a>\s*<\/h3>/i)
    const date = card.match(/<p[^>]*class=["'][^"']*fecha[^"']*["'][^>]*>([\s\S]*?)<\/p>/gi)
    const abstractMatch = card.match(/<p[^>]*class=["'][^"']*abstract[^"']*["'][^>]*>([\s\S]*?)<\/p>/i)
    if (!link || !date?.length) continue

    const dateText = htmlToText(date[date.length - 1])
    const publicationDate = parseIsoDateFromIndex(dateText)
    if (!publicationDate || !publicationDate.startsWith(`${year}-${String(month).padStart(2, '0')}`)) continue

    const detailUrl = canonicalDtDetailUrl(link[1])
    if (seen.has(detailUrl)) continue
    seen.add(detailUrl)

    const officialNumber = htmlToText(link[2])
    entries.push({
      pronouncementType,
      officialNumber,
      normalizedNumber: normalizeOfficialNumber(officialNumber),
      canonicalIdentifier: dtCanonicalIdentifier(pronouncementType, officialNumber),
      publicationDate,
      abstract: abstractMatch ? htmlToText(abstractMatch[1]) : '',
      detailUrl,
    })
  }

  if (entries.length === 0) throw new Error('dt_index_documents_missing')
  entries.sort((a, b) => a.publicationDate.localeCompare(b.publicationDate) || a.normalizedNumber.localeCompare(b.normalizedNumber))
  return entries
}

function parseSpanishDate(value = '') {
  const short = String(value).match(/\b(\d{1,2})-(ene|feb|mar|abr|may|jun|jul|ago|sep|sept|oct|nov|dic)-(\d{4})\b/i)
  if (short) {
    const month = SHORT_MONTHS.get(short[2].toLocaleLowerCase('es-CL'))
    return month ? `${short[3]}-${month}-${short[1].padStart(2, '0')}` : null
  }

  const long = String(value).match(/\b(\d{1,2})\s+de?\s*([A-Za-zÁÉÍÓÚáéíóúñÑ]+)\s+(?:de\s+)?(\d{4})\b/i)
    || String(value).match(/\b(\d{1,2})\s+([A-Za-zÁÉÍÓÚáéíóúñÑ]+)\s+(\d{4})\b/i)
  if (!long) return null
  const month = LONG_MONTHS.get(long[2].toLocaleLowerCase('es-CL'))
  return month ? `${long[3]}-${month}-${long[1].padStart(2, '0')}` : null
}

function normalizeLabel(value = '') {
  return normalizeWhitespace(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
}

function extractLabeledBlock(lines, startAt, label, allLabels) {
  const normalizedLabel = normalizeLabel(label)
  const index = lines.findIndex((line, position) => position >= startAt && normalizeLabel(line).startsWith(`${normalizedLabel}:`))
  if (index < 0) return ''

  const first = lines[index].replace(new RegExp(`^${label}:?`, 'i'), '').trim()
  const output = first ? [first] : []

  for (let position = index + 1; position < lines.length; position += 1) {
    const line = lines[position]
    const normalized = normalizeLabel(line)
    if (allLabels.some((candidate) => normalized.startsWith(`${normalizeLabel(candidate)}:`))) break
    if (/^SANTIAGO,?\s+\d{1,2}\s+/i.test(line)) break
    if (normalized === 'MINISTERIO DEL TRABAJO Y PREVISION SOCIAL') break
    output.push(line)
  }

  return output.join('\n').trim()
}

function classifyLegalReference(value) {
  const normalized = normalizeLabel(value)
  if (normalized.includes('CONSTITUCION')) return 'constitucion'
  if (normalized.includes('CODIGO DEL TRABAJO')) return 'codigo_trabajo'
  if (/\bLEY\b/.test(normalized)) return 'ley'
  if (normalized.includes('DECRETO')) return 'decreto'
  if (normalized.includes('REGLAMENTO')) return 'reglamento'
  if (normalized.includes('CONVENIO') || normalized.includes('TRATADO')) return 'tratado'
  if (normalized.includes('DICTAMEN')) return 'dictamen'
  if (normalized.includes('ORDINARIO') || /\bORD[.]?\b/.test(normalized)) return 'ordinario'
  return 'otro'
}

function relationTypeFromContext(value) {
  const normalized = normalizeLabel(value)
  if (normalized.includes('DEJA SIN EFECTO') || normalized.includes('DEJESE SIN EFECTO')) return 'leaves_without_effect'
  if (normalized.includes('RECONSIDERA')) return 'reconsiders'
  if (normalized.includes('COMPLEMENTA')) return 'complements'
  if (normalized.includes('REITERA')) return 'reiterates'
  if (normalized.includes('CONFIRMA')) return 'confirms'
  return 'cites'
}

function parseMentionDate(value = '') {
  const match = String(value).match(/\b(\d{1,2})[./-](\d{1,2})[./-](\d{4})\b/)
  return match ? `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}` : null
}

function extractRelationsFromText(text, defaultRelationType = null) {
  const source = String(text || '')
  const relations = []
  const pattern = /\b(Dictamen(?:es)?|Ord(?:inario|inarios)?[.]?)\s*(?:N(?:[°º]|ro[.]?)?s?[.]?\s*)?([0-9][0-9./-]*(?:\/[0-9]{4})?)(?:\s*,?\s*de\s*(\d{1,2}[./-]\d{1,2}[./-]\d{4}))?/gi

  for (const match of source.matchAll(pattern)) {
    const word = match[1].toLocaleLowerCase('es-CL')
    const targetType = word.startsWith('dictamen') ? 'dictamen' : 'ordinario'
    const officialCore = normalizeOfficialNumber(match[2])
    if (!officialCore) continue
    const context = source.slice(Math.max(0, match.index - 180), Math.min(source.length, match.index + match[0].length + 40))
    relations.push({
      type: defaultRelationType || relationTypeFromContext(context),
      targetLabel: normalizeWhitespace(match[0]),
      targetIdentifier: `dt:${targetType}:${officialCore.toLocaleLowerCase('es-CL')}`,
      targetPublicationDate: match[3] ? parseMentionDate(match[3]) : null,
      confidence: 1,
      metadata: { extraction: 'deterministic_text_relation_v1' },
    })
  }

  return relations
}

function uniqueBy(items, keyBuilder) {
  const output = []
  const seen = new Set()
  for (const item of items) {
    const key = keyBuilder(item)
    if (!key || seen.has(key)) continue
    seen.add(key)
    output.push(item)
  }
  return output
}

export async function parseDtDetailPage(html, discovery) {
  const lines = htmlToLines(html)
  const expectedNumber = normalizeOfficialNumber(discovery.officialNumber)
  const numberIndex = lines.findIndex((line) => {
    if (!/^(?:ORD|DICTAMEN|N[°º])/i.test(line)) return false
    return normalizeOfficialNumber(line) === expectedNumber
  })
  if (numberIndex < 0) throw new Error('dt_detail_number_missing')

  const dateCandidate = lines.slice(numberIndex, numberIndex + 12).map(parseSpanishDate).find(Boolean)
    || lines.slice(numberIndex).map(parseSpanishDate).find(Boolean)
  if (!dateCandidate) throw new Error('dt_detail_date_missing')
  if (dateCandidate !== discovery.publicationDate) throw new Error('dt_detail_date_mismatch')

  const pdfMatch = String(html).match(/href=["']([^"']*articles-[0-9]+_recurso_(?:[0-9]+[.]pdf|pdf(?:[.]pdf|[.])))["']/i)
  const pdfUrl = pdfMatch ? new URL(pdfMatch[1], BASE_URL).toString() : null
  if (pdfUrl && !/^https:\/\/(?:www[.])?dt[.]gob[.]cl\/legislacion\/1624\/articles-[0-9]+_recurso_(?:[0-9]+[.]pdf|pdf(?:[.]pdf|[.]))$/.test(pdfUrl)) {
    throw new Error('dt_detail_pdf_host_invalid')
  }

  const labels = ['ACTUACIÓN', 'MATERIAS', 'RESUMEN', 'ANTECEDENTES', 'FUENTES', 'CONCORDANCIA', 'CATALOGACIÓN']
  const actionText = extractLabeledBlock(lines, numberIndex, 'ACTUACIÓN', labels)
  const mattersText = extractLabeledBlock(lines, numberIndex, 'MATERIAS', labels)
  const summaryText = extractLabeledBlock(lines, numberIndex, 'RESUMEN', labels) || discovery.abstract
  const antecedentsText = extractLabeledBlock(lines, numberIndex, 'ANTECEDENTES', labels)
  const sourcesText = extractLabeledBlock(lines, numberIndex, 'FUENTES', labels)
  const concordanceText = extractLabeledBlock(lines, numberIndex, 'CONCORDANCIA', labels)
  const catalogText = extractLabeledBlock(lines, numberIndex, 'CATALOGACIÓN', labels)

  const catalogLine = lines
    .slice(Math.max(0, numberIndex - 8), numberIndex)
    .reverse()
    .find((line) => line.includes(';') && !/^Dictámenes$|^Ordinarios$/i.test(line)) || ''

  const internalReferenceIndex = lines.findIndex((line, position) => position > numberIndex && /\bE[0-9]{4,}\/[0-9]{4}\b/i.test(line))
  const internalReference = internalReferenceIndex >= 0
    ? lines[internalReferenceIndex].match(/\bE[0-9]{4,}\/[0-9]{4}\b/i)?.[0] || null
    : null
  const issuingUnit = internalReferenceIndex > numberIndex ? lines[internalReferenceIndex - 1] : null

  const footerIndex = lines.findIndex((line, position) => position > numberIndex && normalizeLabel(line) === 'MINISTERIO DEL TRABAJO Y PREVISION SOCIAL')
  const articleLines = lines.slice(Math.max(0, numberIndex - 2), footerIndex > numberIndex ? footerIndex : lines.length)
  const normalizedContent = articleLines.join('\n').trim()
  if (!normalizedContent) throw new Error('dt_detail_content_missing')

  const blockInputs = [
    ['actuacion', actionText],
    ['materias', mattersText || catalogLine],
    ['resumen', summaryText],
    ['antecedentes', antecedentsText],
    ['fuentes', sourcesText],
    ['concordancia', concordanceText],
    ['catalogacion', catalogText],
    ['cuerpo', normalizedContent],
  ].filter(([, body]) => normalizeWhitespace(body))

  const blocks = []
  for (let index = 0; index < blockInputs.length; index += 1) {
    const [type, body] = blockInputs[index]
    const normalizedText = normalizeWhitespace(body)
    blocks.push({
      key: type,
      type,
      ordinal: index + 1,
      heading: type === 'cuerpo' ? 'Texto oficial' : type.charAt(0).toUpperCase() + type.slice(1),
      bodyText: String(body).trim(),
      normalizedText,
      hash: await sha256(`${type}|${normalizedText}`),
      metadata: { source: 'direccion-trabajo-html-v1' },
    })
  }

  const topicSource = mattersText || catalogLine
  const topicValues = uniqueBy(
    topicSource.split(/[;\n]+/).map(normalizeWhitespace).filter((value) => value.length >= 3),
    (value) => value.toLocaleLowerCase('es-CL'),
  )
  const topics = []
  for (const topic of topicValues) {
    const normalizedTopic = topic.toLocaleLowerCase('es-CL')
    topics.push({ topic, normalizedTopic, hash: await sha256(normalizedTopic) })
  }

  const referenceValues = uniqueBy(
    sourcesText.split(/\n+/).map(normalizeWhitespace).filter((value) => value.length >= 5),
    (value) => value.toLocaleLowerCase('es-CL'),
  )
  const legalReferences = []
  for (const referenceText of referenceValues) {
    const normalizedText = referenceText.toLocaleLowerCase('es-CL')
    legalReferences.push({
      type: classifyLegalReference(referenceText),
      text: referenceText,
      normalizedText,
      hash: await sha256(normalizedText),
      metadata: { sourceBlock: 'fuentes' },
    })
  }

  const relationInputs = [
    ...extractRelationsFromText(actionText),
    ...extractRelationsFromText(catalogLine),
    ...extractRelationsFromText(summaryText),
    ...extractRelationsFromText(concordanceText, 'concordance'),
  ]
  const uniqueRelations = uniqueBy(
    relationInputs,
    (relation) => `${relation.type}|${relation.targetIdentifier}|${relation.targetPublicationDate || ''}`,
  )
  const relations = []
  for (const relation of uniqueRelations) {
    relations.push({
      ...relation,
      hash: await sha256(`${relation.type}|${relation.targetIdentifier}|${relation.targetPublicationDate || ''}|${relation.targetLabel}`),
    })
  }

  const detailsCore = {
    pronouncementType: discovery.pronouncementType,
    officialNumber: discovery.officialNumber,
    normalizedNumber: expectedNumber,
    internalReference,
    issuingUnit,
    actionText,
    summary: summaryText,
    pdfUrl,
    sourcePageUrl: discovery.detailUrl,
  }

  return {
    ...detailsCore,
    hash: await sha256(JSON.stringify(detailsCore)),
    metadata: {
      parserVersion: 'direccion-trabajo-doctrina-v1',
      discoveryAbstract: discovery.abstract,
      catalogTopics: catalogLine,
      requiresHumanReview: true,
    },
    normalizedContent,
    title: summaryText
      ? `${discovery.officialNumber}: ${normalizeWhitespace(summaryText).slice(0, 220)}`
      : discovery.officialNumber,
    canonicalIdentifier: discovery.canonicalIdentifier,
    publicationDate: discovery.publicationDate,
    blocks,
    topics,
    legalReferences,
    relations,
  }
}
