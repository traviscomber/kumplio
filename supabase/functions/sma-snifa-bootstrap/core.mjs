const PARSER_VERSION = 'sma-snifa-sanctioning-v1'

export const EXPECTED_HEADERS = [
  'ProcesoSancionId',
  'Expediente',
  'ProcesoSancionTipoNombre',
  'ProcesoSancionEstado',
  'FechaInicio',
  'FechaTermino',
  'ConfirmaPdC',
  'MultaTotalUTA',
  'LinkSNIFA',
  'UnidadFiscalizableId',
  'Nombre',
  'RegionNombre',
  'ComunaNombre',
  'Latitud',
  'Longitud',
  'CategoriaEconomicaNombre',
  'SubCategoriaEconomicaNombre',
  'LinkSNIFA_UF',
  'FechaActualizacion',
]

const PROCESS_TYPES = new Set([
  'Autodenuncia',
  'Denuncia',
  'Fiscalización',
  'Programa de Cumplimiento',
])

const PROCESS_STATES = new Set([
  'En curso',
  'Programa de Cumplimiento en ejecución',
  'Suspendido',
  'Terminado - Absolución',
  'Terminado - Archivado',
  'Terminado - PDC Satisfactorio',
  'Terminado - Sanción',
])

export function normalizeWhitespace(value = '') {
  return String(value).replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim()
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

export async function sha256Bytes(bytes) {
  if (!(bytes instanceof Uint8Array)) {
    throw new Error('sma_hash_bytes_required')
  }
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export function decodeWindows1252(bytes) {
  if (!(bytes instanceof Uint8Array)) {
    throw new Error('sma_csv_bytes_required')
  }
  return new TextDecoder('windows-1252', { fatal: true }).decode(bytes)
}

export function parseDelimitedCsv(text, delimiter = ';') {
  const rows = []
  let row = []
  let field = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]

    if (quoted) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"'
          index += 1
        } else {
          quoted = false
        }
      } else {
        field += character
      }
      continue
    }

    if (character === '"') {
      if (field.length !== 0) throw new Error('sma_csv_quote_in_unquoted_field')
      quoted = true
    } else if (character === delimiter) {
      row.push(field)
      field = ''
    } else if (character === '\n') {
      row.push(field.replace(/\r$/, ''))
      rows.push(row)
      row = []
      field = ''
    } else {
      field += character
    }
  }

  if (quoted) throw new Error('sma_csv_unclosed_quote')
  if (field.length > 0 || row.length > 0) {
    row.push(field.replace(/\r$/, ''))
    rows.push(row)
  }

  return rows.filter((candidate) => !(candidate.length === 1 && candidate[0] === ''))
}

function parseInteger(value, errorCode) {
  const normalized = normalizeWhitespace(value)
  if (!/^\d+$/.test(normalized)) throw new Error(errorCode)
  const number = Number(normalized)
  if (!Number.isSafeInteger(number) || number <= 0) throw new Error(errorCode)
  return number
}

function parseOptionalDecimal(value, errorCode) {
  const normalized = normalizeWhitespace(value)
  if (!normalized) return null
  if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) throw new Error(errorCode)
  const number = Number(normalized)
  if (!Number.isFinite(number)) throw new Error(errorCode)
  return number
}

function isoDate(year, month, day, errorCode) {
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) {
    throw new Error(errorCode)
  }
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function parseSmaDate(value, options = {}) {
  const normalized = normalizeWhitespace(value)
  if (!normalized && options.optional) return null
  const match = normalized.match(/^(\d{2})-(\d{2})-(\d{2}|\d{4})$/)
  if (!match) throw new Error(options.errorCode || 'sma_invalid_date')

  const day = Number(match[1])
  const month = Number(match[2])
  const year = match[3].length === 2 ? 2000 + Number(match[3]) : Number(match[3])
  if (year < 2010 || year > 2100) {
    throw new Error(options.errorCode || 'sma_invalid_date')
  }
  return isoDate(year, month, day, options.errorCode || 'sma_invalid_date')
}

function parseBoolean(value) {
  const normalized = normalizeWhitespace(value)
  if (normalized === 'Sí') return true
  if (normalized === 'No') return false
  throw new Error('sma_invalid_pdc_confirmation')
}

function normalizeOfficialUrl(value, type, expectedId) {
  let normalized = normalizeWhitespace(value)
  if (type === 'unit') normalized = normalized.replace(/^http:\/\//i, 'https://')

  let url
  try {
    url = new URL(normalized)
  } catch {
    throw new Error(`sma_invalid_${type}_url`)
  }

  const expectedPath = type === 'proceeding'
    ? `/Sancionatorio/Ficha/${expectedId}`
    : `/UnidadFiscalizable/Ficha/${expectedId}`

  if (
    url.protocol !== 'https:'
    || url.hostname.toLowerCase() !== 'snifa.sma.gob.cl'
    || url.pathname !== expectedPath
    || url.search
    || url.hash
  ) {
    throw new Error(`sma_invalid_${type}_url`)
  }

  return `https://snifa.sma.gob.cl${expectedPath}`
}

function optionalText(value) {
  const normalized = normalizeWhitespace(value)
  return normalized || null
}

function parseCoordinate(value, minimum, maximum, errorCode) {
  const number = parseOptionalDecimal(value, errorCode)
  if (number === null) return null
  if (number < minimum || number > maximum) throw new Error(errorCode)
  return number
}

export function parseSmaSanctioningCsv(text, options = {}) {
  const rows = parseDelimitedCsv(String(text).replace(/^\uFEFF/, ''))
  if (rows.length < 2) throw new Error('sma_csv_empty')

  const headers = rows[0].map(normalizeWhitespace)
  if (
    headers.length !== EXPECTED_HEADERS.length
    || headers.some((header, index) => header !== EXPECTED_HEADERS[index])
  ) {
    throw new Error(`sma_csv_headers_changed:${headers.join('|')}`)
  }

  const dataRows = rows.slice(1)
  const minimumRows = options.minimumRows ?? 3000
  if (dataRows.length < minimumRows) {
    throw new Error(`sma_unexpected_row_count:${dataRows.length}`)
  }

  const processUnitKeys = new Set()
  const processFingerprints = new Map()
  const normalizedRows = []
  const processIds = new Set()
  const unitIds = new Set()
  const states = new Map()
  const categories = new Map()
  let blankCategoryCount = 0
  let missingCoordinateCount = 0
  let partialCoordinateCount = 0
  let totalFineUta = 0

  dataRows.forEach((values, index) => {
    const sourceRowNumber = index + 2
    if (values.length !== EXPECTED_HEADERS.length) {
      throw new Error(`sma_csv_column_count:${sourceRowNumber}:${values.length}`)
    }

    const record = Object.fromEntries(headers.map((header, position) => [header, values[position]]))
    const smaProcessId = parseInteger(record.ProcesoSancionId, `sma_invalid_process_id:${sourceRowNumber}`)
    const smaUnitId = parseInteger(record.UnidadFiscalizableId, `sma_invalid_unit_id:${sourceRowNumber}`)
    const expediente = normalizeWhitespace(record.Expediente).toUpperCase()
    if (!/^[A-Z]+-\d{3}-\d{4}$/.test(expediente)) {
      throw new Error(`sma_invalid_expediente:${sourceRowNumber}`)
    }

    const processType = normalizeWhitespace(record.ProcesoSancionTipoNombre)
    if (!PROCESS_TYPES.has(processType)) {
      throw new Error(`sma_unknown_process_type:${sourceRowNumber}:${processType}`)
    }

    const processState = normalizeWhitespace(record.ProcesoSancionEstado)
    if (!PROCESS_STATES.has(processState)) {
      throw new Error(`sma_unknown_process_state:${sourceRowNumber}:${processState}`)
    }

    const startDate = parseSmaDate(record.FechaInicio, {
      errorCode: `sma_invalid_start_date:${sourceRowNumber}`,
    })
    const endDate = parseSmaDate(record.FechaTermino, {
      optional: true,
      errorCode: `sma_invalid_end_date:${sourceRowNumber}`,
    })
    if (endDate && endDate < startDate) {
      throw new Error(`sma_end_before_start:${sourceRowNumber}`)
    }

    const confirmsPdc = parseBoolean(record.ConfirmaPdC)
    const fineTotalUta = parseOptionalDecimal(
      record.MultaTotalUTA,
      `sma_invalid_fine:${sourceRowNumber}`,
    )
    if (fineTotalUta !== null && fineTotalUta < 0) {
      throw new Error(`sma_invalid_fine:${sourceRowNumber}`)
    }

    const proceedingUrl = normalizeOfficialUrl(record.LinkSNIFA, 'proceeding', smaProcessId)
    const unitUrl = normalizeOfficialUrl(record.LinkSNIFA_UF, 'unit', smaUnitId)
    const unitName = normalizeWhitespace(record.Nombre)
    const regionName = normalizeWhitespace(record.RegionNombre)
    const communeName = normalizeWhitespace(record.ComunaNombre)
    if (!unitName || !regionName || !communeName) {
      throw new Error(`sma_missing_unit_identity:${sourceRowNumber}`)
    }

    const latitude = parseCoordinate(
      record.Latitud,
      -60,
      -15,
      `sma_invalid_latitude:${sourceRowNumber}`,
    )
    const longitude = parseCoordinate(
      record.Longitud,
      -82,
      -65,
      `sma_invalid_longitude:${sourceRowNumber}`,
    )

    const economicCategory = optionalText(record.CategoriaEconomicaNombre)
    const economicSubcategory = optionalText(record.SubCategoriaEconomicaNombre)
    if ((economicCategory === null) !== (economicSubcategory === null)) {
      throw new Error(`sma_partial_economic_category:${sourceRowNumber}`)
    }

    const sourceUpdateDate = parseSmaDate(record.FechaActualizacion, {
      errorCode: `sma_invalid_update_date:${sourceRowNumber}`,
    })

    const processUnitKey = `${smaProcessId}|${smaUnitId}`
    if (processUnitKeys.has(processUnitKey)) {
      throw new Error(`sma_duplicate_process_unit:${sourceRowNumber}:${processUnitKey}`)
    }
    processUnitKeys.add(processUnitKey)

    const processFingerprint = JSON.stringify([
      expediente,
      processType,
      processState,
      startDate,
      endDate,
      confirmsPdc,
      fineTotalUta,
      proceedingUrl,
      sourceUpdateDate,
    ])
    const previousFingerprint = processFingerprints.get(smaProcessId)
    if (previousFingerprint && previousFingerprint !== processFingerprint) {
      throw new Error(`sma_inconsistent_process_fields:${smaProcessId}`)
    }
    processFingerprints.set(smaProcessId, processFingerprint)

    normalizedRows.push({
      row_number: index + 1,
      sma_process_id: smaProcessId,
      expediente,
      process_type: processType,
      process_state: processState,
      start_date: startDate,
      end_date: endDate,
      confirms_pdc: confirmsPdc,
      fine_total_uta: fineTotalUta,
      proceeding_url: proceedingUrl,
      sma_unit_id: smaUnitId,
      unit_name: unitName,
      region_name: regionName,
      commune_name: communeName,
      latitude,
      longitude,
      economic_category: economicCategory,
      economic_subcategory: economicSubcategory,
      unit_url: unitUrl,
      source_update_date: sourceUpdateDate,
    })

    processIds.add(smaProcessId)
    unitIds.add(smaUnitId)
    states.set(processState, (states.get(processState) || 0) + 1)
    const categoryKey = economicCategory || 'Sin categoría informada'
    categories.set(categoryKey, (categories.get(categoryKey) || 0) + 1)
    if (economicCategory === null) blankCategoryCount += 1
    if (latitude === null || longitude === null) missingCoordinateCount += 1
    if ((latitude === null) !== (longitude === null)) partialCoordinateCount += 1
    if (fineTotalUta !== null) totalFineUta += fineTotalUta
  })

  const sourceUpdateDates = new Set(normalizedRows.map((row) => row.source_update_date))
  if (sourceUpdateDates.size !== 1) {
    throw new Error(`sma_multiple_source_update_dates:${[...sourceUpdateDates].join('|')}`)
  }

  return {
    parserVersion: PARSER_VERSION,
    headers,
    rows: normalizedRows,
    metrics: {
      rawRowCount: normalizedRows.length,
      proceedingCount: processIds.size,
      fiscalizableUnitCount: unitIds.size,
      relationCount: processUnitKeys.size,
      sourceUpdateDate: normalizedRows[0].source_update_date,
      blankCategoryCount,
      missingCoordinateCount,
      partialCoordinateCount,
      totalFineUta,
      states: Object.fromEntries([...states.entries()].sort()),
      categories: Object.fromEntries(
        [...categories.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es')),
      ),
    },
  }
}

export function chunkRows(rows, batchSize = 400) {
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 500) {
    throw new Error('sma_invalid_chunk_size')
  }
  const batches = []
  for (let index = 0; index < rows.length; index += batchSize) {
    batches.push(rows.slice(index, index + batchSize))
  }
  return batches
}
