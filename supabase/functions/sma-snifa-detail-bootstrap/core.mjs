const PARSER_VERSION = 'sma-snifa-detail-v1'
const BASE_URL = 'https://snifa.sma.gob.cl'

const SECTION_ORDER = [
  'documentos',
  'instrumentos-considerados',
  'fiscalizaciones-asociadas',
  'medidas-provisionales-asociadas',
  'sanciones',
]

const NAMED_ENTITIES = new Map([
  ['amp', '&'], ['quot', '"'], ['apos', "'"], ['nbsp', ' '],
  ['lt', '<'], ['gt', '>'], ['ntilde', 'ñ'], ['Ntilde', 'Ñ'],
  ['aacute', 'á'], ['eacute', 'é'], ['iacute', 'í'], ['oacute', 'ó'], ['uacute', 'ú'],
  ['Aacute', 'Á'], ['Eacute', 'É'], ['Iacute', 'Í'], ['Oacute', 'Ó'], ['Uacute', 'Ú'],
  ['uuml', 'ü'], ['Uuml', 'Ü'], ['deg', '°'], ['ordm', 'º'], ['ldquo', '“'], ['rdquo', '”'],
])

export function decodeHtmlEntities(value = '') {
  return String(value)
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(/&([A-Za-z]+);/g, (match, name) => NAMED_ENTITIES.get(name) ?? match)
}

export function normalizeWhitespace(value = '') {
  return decodeHtmlEntities(String(value))
    .replace(/\u00a0/g, ' ')
    .replace(/[\t\r\n ]+/g, ' ')
    .trim()
}

export function htmlToText(value = '') {
  return normalizeWhitespace(
    String(value)
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
}

export async function sha256(value) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(String(value)),
  )
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function parseInteger(value, errorCode) {
  const normalized = normalizeWhitespace(value)
  if (!/^\d+$/.test(normalized)) throw new Error(errorCode)
  const number = Number(normalized)
  if (!Number.isSafeInteger(number) || number < 0) throw new Error(errorCode)
  return number
}

function parseOptionalDecimal(value, errorCode) {
  const normalized = normalizeWhitespace(value)
  if (!normalized) return null
  const compact = normalized.replace(/\./g, '').replace(',', '.')
  if (!/^-?\d+(?:\.\d+)?$/.test(compact)) throw new Error(errorCode)
  const number = Number(compact)
  if (!Number.isFinite(number) || number < 0) throw new Error(errorCode)
  return number
}

export function parseSnifaDate(value, options = {}) {
  const normalized = normalizeWhitespace(value)
  if (!normalized && options.optional) return null
  const match = normalized.match(/^(\d{2})-(\d{2})-(\d{4})$/)
  if (!match) throw new Error(options.errorCode || 'snifa_detail_invalid_date')
  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) {
    throw new Error(options.errorCode || 'snifa_detail_invalid_date')
  }
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function absoluteSnifaUrl(relativeOrAbsolute, expectedPattern, errorCode) {
  let url
  try {
    url = new URL(normalizeWhitespace(relativeOrAbsolute), BASE_URL)
  } catch {
    throw new Error(errorCode)
  }
  if (
    url.protocol !== 'https:'
    || url.hostname.toLowerCase() !== 'snifa.sma.gob.cl'
    || !expectedPattern.test(url.pathname)
    || url.search
    || url.hash
  ) {
    throw new Error(errorCode)
  }
  return `${BASE_URL}${url.pathname}`
}

function normalizeExternalReferenceUrl(value) {
  const normalized = normalizeWhitespace(value)
  if (!normalized) return null
  let url
  try {
    url = new URL(normalized)
  } catch {
    return null
  }
  if (!['http:', 'https:'].includes(url.protocol)) return null
  url.hash = ''
  return url.toString()
}

function extractHref(value = '') {
  const match = String(value).match(/href=["']([^"']+)["']/i)
  return match ? decodeHtmlEntities(match[1]) : null
}

function extractSection(html, sectionId) {
  const index = SECTION_ORDER.indexOf(sectionId)
  if (index < 0) throw new Error(`snifa_detail_unknown_section:${sectionId}`)
  const marker = `<div id="${sectionId}"`
  const start = String(html).indexOf(marker)
  if (start < 0) throw new Error(`snifa_detail_section_missing:${sectionId}`)

  let end = String(html).length
  for (const nextSection of SECTION_ORDER.slice(index + 1)) {
    const position = String(html).indexOf(`<div id="${nextSection}"`, start + marker.length)
    if (position > start && position < end) end = position
  }
  if (sectionId === 'sanciones') {
    const scriptPosition = String(html).indexOf('<script>', start + marker.length)
    if (scriptPosition > start) end = Math.min(end, scriptPosition)
  }
  return String(html).slice(start, end)
}

function parseTableRows(sectionHtml) {
  const rows = []
  for (const match of String(sectionHtml).matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const rowHtml = match[1]
    const cells = {}
    const rawCells = {}
    for (const cellMatch of rowHtml.matchAll(/<td[^>]*data-label=["']([^"']+)["'][^>]*>([\s\S]*?)<\/td>/gi)) {
      const label = normalizeWhitespace(cellMatch[1])
      rawCells[label] = cellMatch[2]
      cells[label] = htmlToText(cellMatch[2])
    }
    if (Object.keys(cells).length > 0) rows.push({ cells, rawCells })
  }
  return rows
}

function declaredCount(html, label) {
  const pattern = new RegExp(`${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\((\\d+)\\)`, 'i')
  const match = String(html).match(pattern)
  if (!match) throw new Error(`snifa_detail_count_missing:${label}`)
  return Number(match[1])
}

function parseMetadata(html) {
  const expediente = normalizeWhitespace(String(html).match(/<h3>\s*Expediente:\s*([^<]+)<\/h3>/i)?.[1] || '')
  const startDateRaw = htmlToText(String(html).match(/<b>Fecha Inicio\s*:<\/b>\s*<i>([\s\S]*?)<\/i>/i)?.[1] || '')
  const endDateRaw = htmlToText(String(html).match(/<b>Fecha Término:\s*<\/b>\s*<i>([\s\S]*?)<\/i>/i)?.[1] || '')
  const state = htmlToText(String(html).match(/<b>Estado:\s*<\/b>\s*<i>([\s\S]*?)<\/i>/i)?.[1] || '')

  if (!/^[A-Z]+-\d{3}-\d{4}$/.test(expediente)) throw new Error('snifa_detail_expediente_missing')
  if (!state) throw new Error('snifa_detail_state_missing')

  return {
    expediente,
    startDate: parseSnifaDate(startDateRaw, { errorCode: 'snifa_detail_start_date_invalid' }),
    endDate: parseSnifaDate(endDateRaw, { optional: true, errorCode: 'snifa_detail_end_date_invalid' }),
    state,
  }
}

function parseUnits(html) {
  const coordinateValues = new Map()
  for (const match of String(html).matchAll(/id=["']t(Lat|Lng|Nombre)_(\d+)["'][^>]*value=["']([^"']*)["']/gi)) {
    const [, type, id, value] = match
    const current = coordinateValues.get(id) || {}
    current[type.toLowerCase()] = decodeHtmlEntities(value)
    coordinateValues.set(id, current)
  }

  const units = []
  const seen = new Set()
  for (const match of String(html).matchAll(/<a\s+href=["']\/UnidadFiscalizable\/Ficha\/(\d+)["'][^>]*>([\s\S]*?)<\/a>\s*<br\s*\/?>\s*([\s\S]*?)<\/li>/gi)) {
    const unitId = Number(match[1])
    if (seen.has(unitId)) continue
    seen.add(unitId)
    const coordinates = coordinateValues.get(String(unitId)) || {}
    const latitude = coordinates.lat ? Number(coordinates.lat) : null
    const longitude = coordinates.lng ? Number(coordinates.lng) : null
    if (latitude !== null && (!Number.isFinite(latitude) || latitude < -60 || latitude > -15)) {
      throw new Error(`snifa_detail_invalid_latitude:${unitId}`)
    }
    if (longitude !== null && (!Number.isFinite(longitude) || longitude < -82 || longitude > -65)) {
      throw new Error(`snifa_detail_invalid_longitude:${unitId}`)
    }
    units.push({
      ordinal: units.length + 1,
      sma_unit_id: unitId,
      unit_name: htmlToText(match[2]),
      location_text: htmlToText(match[3]),
      latitude,
      longitude,
      unit_url: `${BASE_URL}/UnidadFiscalizable/Ficha/${unitId}`,
    })
  }
  if (units.length === 0) throw new Error('snifa_detail_units_missing')
  return units
}

function parseHolders(html) {
  const blocks = [...String(html).matchAll(/<h4[^>]*>[\s\S]*?Titular<\/h4>\s*<ul>([\s\S]*?)<\/ul>/gi)]
  const holders = []
  const seen = new Set()
  for (const block of blocks) {
    for (const item of block[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)) {
      const holderName = htmlToText(item[1].replace(/<i[^>]*>[\s\S]*?<\/i>/gi, ' '))
      if (!holderName || seen.has(holderName.toLocaleLowerCase('es-CL'))) continue
      seen.add(holderName.toLocaleLowerCase('es-CL'))
      holders.push({ ordinal: holders.length + 1, holder_name: holderName })
    }
  }
  return holders
}

function classificationParts(rawHtml) {
  return {
    label: htmlToText(String(rawHtml).match(/<b[^>]*>([\s\S]*?)<\/b>/i)?.[1] || ''),
    detail: htmlToText(String(rawHtml).match(/<i[^>]*>([\s\S]*?)<\/i>/i)?.[1] || ''),
  }
}

function instrumentParts(rawHtml) {
  const link = extractHref(rawHtml)
  const labelHtml = String(rawHtml).replace(/<a[\s\S]*?<\/a>/gi, ' ')
  return {
    label: htmlToText(labelHtml),
    url: link ? normalizeExternalReferenceUrl(link) : null,
  }
}

async function addHashes(items) {
  const output = []
  for (const item of items) {
    output.push({ ...item, item_hash: await sha256(JSON.stringify(item)) })
  }
  return output
}

async function parseDocuments(html) {
  const rows = parseTableRows(extractSection(html, 'documentos'))
  const output = []
  for (const row of rows) {
    const ordinal = parseInteger(row.cells['#'], 'snifa_detail_document_ordinal_invalid')
    const href = extractHref(row.rawCells.Link)
    const downloadUrl = absoluteSnifaUrl(
      href || '',
      /^\/General\/Descargar\/\d+$/,
      'snifa_detail_document_url_invalid',
    )
    const downloadId = Number(downloadUrl.split('/').at(-1))
    output.push({
      ordinal,
      document_name: row.cells['Nombre Documento'],
      document_type: row.cells['Tipo Documento'],
      document_date: parseSnifaDate(row.cells.Fecha, { errorCode: `snifa_detail_document_date_invalid:${ordinal}` }),
      download_id: downloadId,
      download_url: downloadUrl,
    })
  }
  return addHashes(output)
}

async function parseFacts(html) {
  const rows = parseTableRows(extractSection(html, 'instrumentos-considerados'))
  const output = []
  for (const row of rows) {
    const ordinal = parseInteger(row.cells['#'], 'snifa_detail_fact_ordinal_invalid')
    const instrument = instrumentParts(row.rawCells['Instrumento Infringido'] || '')
    const classification = classificationParts(row.rawCells['Clasificación (Art. 36 LOSMA)'] || '')
    output.push({
      ordinal,
      fact_text: row.cells.Hecho,
      instrument_label: instrument.label,
      instrument_url: instrument.url,
      infringement_text: row.cells['Infracción (Art.35 LOSMA)'],
      classification_label: classification.label,
      classification_detail: classification.detail,
    })
  }
  return addHashes(output)
}

async function parseAssociations(html, sectionId, associationType) {
  const rows = parseTableRows(extractSection(html, sectionId))
  const output = []
  for (const row of rows) {
    const ordinal = parseInteger(row.cells['#'], `snifa_detail_${associationType}_ordinal_invalid`)
    const detailCell = row.rawCells.Detalle || ''
    const href = extractHref(detailCell)
    let detailUrl = null
    let externalId = null
    if (href) {
      const pattern = associationType === 'inspection'
        ? /^\/Fiscalizacion\/Ficha\/\d+$/
        : /^\/MedidaProvisional\/Ficha\/\d+$/
      detailUrl = absoluteSnifaUrl(href, pattern, `snifa_detail_${associationType}_url_invalid`)
      externalId = Number(detailUrl.split('/').at(-1))
    }
    const referenceLabel = associationType === 'inspection'
      ? row.cells['Expediente de fiscalización']
      : row.cells.Expediente || row.cells['Medida provisional'] || row.cells.Nombre || null
    const activityYearRaw = row.cells['Año actividad'] || row.cells.Año || ''
    const activityYear = activityYearRaw ? parseInteger(activityYearRaw, `snifa_detail_${associationType}_year_invalid`) : null
    output.push({
      ordinal,
      association_type: associationType,
      reference_label: referenceLabel,
      activity_year: activityYear,
      external_id: externalId,
      detail_url: detailUrl,
      row_data: row.cells,
    })
  }
  return addHashes(output)
}

async function parseSanctions(html) {
  const rows = parseTableRows(extractSection(html, 'sanciones'))
  const output = []
  for (const row of rows) {
    const ordinal = parseInteger(row.cells['#'], 'snifa_detail_sanction_ordinal_invalid')
    const instrument = instrumentParts(row.rawCells['Instrumento Infringido'] || '')
    const classification = classificationParts(row.rawCells['Clasificación (Art. 36 LOSMA)'] || '')
    output.push({
      ordinal,
      fact_text: row.cells.Hecho,
      instrument_label: instrument.label,
      instrument_url: instrument.url,
      infringement_text: row.cells['Infracción (Art.35 LOSMA)'],
      classification_label: classification.label,
      classification_detail: classification.detail,
      sanction_text: row.cells.Sanción,
      fine_uta: parseOptionalDecimal(row.cells.Multa, `snifa_detail_sanction_fine_invalid:${ordinal}`),
    })
  }
  return addHashes(output)
}

function ensureSequential(items, sectionName) {
  items.forEach((item, index) => {
    if (item.ordinal !== index + 1) {
      throw new Error(`snifa_detail_non_sequential:${sectionName}:${item.ordinal}:${index + 1}`)
    }
  })
}

function ensureCount(actual, declared, sectionName) {
  if (actual !== declared) {
    throw new Error(`snifa_detail_count_mismatch:${sectionName}:${declared}:${actual}`)
  }
}

export async function parseSnifaSanctioningDetail(html, expected) {
  const sourceHtml = String(html || '')
  if (!sourceHtml.includes('SNIFA - Sistema Nacional de Información de Fiscalización Ambiental')) {
    throw new Error('snifa_detail_signature_missing')
  }
  const metadata = parseMetadata(sourceHtml)
  if (metadata.expediente !== expected.expediente) {
    throw new Error(`snifa_detail_expediente_mismatch:${expected.expediente}:${metadata.expediente}`)
  }
  if (metadata.startDate !== expected.startDate) {
    throw new Error(`snifa_detail_start_date_mismatch:${expected.startDate}:${metadata.startDate}`)
  }
  if (metadata.state !== expected.processState) {
    throw new Error(`snifa_detail_state_mismatch:${expected.processState}:${metadata.state}`)
  }

  const declared = {
    documents: declaredCount(sourceHtml, 'Documentos'),
    facts: declaredCount(sourceHtml, 'Hechos considerados'),
    inspections: declaredCount(sourceHtml, 'Fiscalizaciones asociadas'),
    provisionalMeasures: declaredCount(sourceHtml.replace(/<br\s*\/?>/gi, ' '), 'Medidas provisionales asociadas'),
    sanctions: declaredCount(sourceHtml, 'Sanciones'),
  }

  const units = await addHashes(parseUnits(sourceHtml))
  const holders = await addHashes(parseHolders(sourceHtml))
  const documents = await parseDocuments(sourceHtml)
  const facts = await parseFacts(sourceHtml)
  const inspections = await parseAssociations(sourceHtml, 'fiscalizaciones-asociadas', 'inspection')
  const provisionalMeasures = await parseAssociations(sourceHtml, 'medidas-provisionales-asociadas', 'provisional_measure')
  const sanctions = await parseSanctions(sourceHtml)

  ensureSequential(documents, 'documents')
  ensureSequential(facts, 'facts')
  ensureSequential(inspections, 'inspections')
  ensureSequential(provisionalMeasures, 'provisional_measures')
  ensureSequential(sanctions, 'sanctions')
  ensureCount(documents.length, declared.documents, 'documents')
  ensureCount(facts.length, declared.facts, 'facts')
  ensureCount(inspections.length, declared.inspections, 'inspections')
  ensureCount(provisionalMeasures.length, declared.provisionalMeasures, 'provisional_measures')
  ensureCount(sanctions.length, declared.sanctions, 'sanctions')

  const core = {
    parserVersion: PARSER_VERSION,
    smaProcessId: expected.smaProcessId,
    expediente: metadata.expediente,
    startDate: metadata.startDate,
    endDate: metadata.endDate,
    processState: metadata.state,
    counts: {
      units: units.length,
      holders: holders.length,
      documents: documents.length,
      facts: facts.length,
      inspections: inspections.length,
      provisionalMeasures: provisionalMeasures.length,
      sanctions: sanctions.length,
    },
    units,
    holders,
    documents,
    facts,
    inspections,
    provisionalMeasures,
    sanctions,
  }

  return {
    ...core,
    payloadHash: await sha256(JSON.stringify(core)),
    metadata: {
      requiresHumanReview: true,
      factsAreAllegationsOrFindingsFromOfficialProceeding: true,
      sanctionAmountsRequireDocumentReview: true,
      sourcePageUrl: `${BASE_URL}/Sancionatorio/Ficha/${expected.smaProcessId}`,
    },
  }
}
