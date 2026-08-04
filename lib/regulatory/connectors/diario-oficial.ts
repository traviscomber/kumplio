import 'server-only'

import {
  canonicalDiarioOficialEditionUrl,
  hashDiarioOficial,
  parseDiarioOficialEdition,
} from '@/lib/regulatory/diario-oficial-core.mjs'

const HOST = 'www.diariooficial.interior.gob.cl'
const PATH = '/edicionelectronica/index.php/index.php'
const MAX_BYTES = 8 * 1024 * 1024
const TIMEOUT_MS = 25_000
const USER_AGENT = 'KUMPLIO-Regulatory-Connector/1.0 (+https://kumplio.app/regulatory)'

export class DiarioOficialConnectorError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'DiarioOficialConnectorError'
  }
}

export function normalizeDiarioOficialUrl(input: string) {
  let url: URL
  try {
    url = new URL(input)
  } catch {
    throw new DiarioOficialConnectorError('invalid_url', 'La URL del Diario Oficial no es válida.')
  }

  if (url.protocol !== 'https:') {
    throw new DiarioOficialConnectorError('https_required', 'La captura requiere HTTPS.')
  }
  if (url.hostname.toLowerCase() !== HOST) {
    throw new DiarioOficialConnectorError('host_not_allowed', 'El dominio no está autorizado.')
  }
  if (url.pathname !== PATH) {
    throw new DiarioOficialConnectorError('path_not_allowed', 'La ruta no está autorizada.')
  }

  const date = url.searchParams.get('date') || ''
  const edition = url.searchParams.get('edition') || ''
  return canonicalDiarioOficialEditionUrl(date, edition)
}

async function readLimited(response: Response) {
  const declaredBytes = Number(response.headers.get('content-length') || 0)
  if (declaredBytes > MAX_BYTES) {
    throw new DiarioOficialConnectorError('response_too_large', 'La respuesta supera el límite permitido.')
  }

  if (!response.body) return ''

  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let totalBytes = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (!value) continue

    totalBytes += value.byteLength
    if (totalBytes > MAX_BYTES) {
      await reader.cancel()
      throw new DiarioOficialConnectorError('response_too_large', 'La respuesta supera el límite permitido.')
    }
    chunks.push(value)
  }

  const output = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    output.set(chunk, offset)
    offset += chunk.byteLength
  }

  return new TextDecoder('utf-8', { fatal: false }).decode(output)
}

function responseHeaders(response: Response) {
  return Object.fromEntries(response.headers.entries())
}

export async function captureDiarioOficialEdition(input: {
  date: string
  edition: string
  fetchImpl?: typeof fetch
}) {
  if (process.env.KUMPLIO_DIARIO_OFICIAL_CAPTURE_ENABLED === 'false') {
    throw new DiarioOficialConnectorError('capture_disabled', 'La captura del Diario Oficial está deshabilitada.')
  }

  const requestedUrl = canonicalDiarioOficialEditionUrl(input.date, input.edition)
  const canonicalUrl = normalizeDiarioOficialUrl(requestedUrl)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await (input.fetchImpl || fetch)(canonicalUrl, {
      method: 'GET',
      redirect: 'error',
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        Accept: 'text/html,application/xhtml+xml;q=0.9',
        'Accept-Language': 'es-CL,es;q=0.9',
        'User-Agent': USER_AGENT,
      },
    })

    if (!response.ok) {
      throw new DiarioOficialConnectorError('http_error', `El Diario Oficial respondió HTTP ${response.status}.`)
    }

    const mimeType = (response.headers.get('content-type') || '')
      .split(';')[0]
      .trim()
      .toLowerCase()

    if (!['text/html', 'application/xhtml+xml'].includes(mimeType)) {
      throw new DiarioOficialConnectorError('mime_not_allowed', 'El Diario Oficial respondió un formato no permitido.')
    }

    const rawHtml = await readLimited(response)
    if (!rawHtml.trim()) {
      throw new DiarioOficialConnectorError('empty_response', 'El Diario Oficial respondió sin contenido.')
    }

    let parsed
    try {
      parsed = parseDiarioOficialEdition(rawHtml, {
        parserVersion: 'diario-oficial-summary-v1',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'parse_failed'
      throw new DiarioOficialConnectorError(message.startsWith('parse_') ? message : 'parse_failed', message)
    }

    const expectedEdition = String(input.edition).replace(/^0+/, '')
    if (parsed.editionNumber !== expectedEdition) {
      throw new DiarioOficialConnectorError('edition_mismatch', 'La edición recibida no coincide con la solicitada.')
    }

    const [day, month, year] = input.date.split('-')
    const expectedDate = `${year}-${month}-${day}`
    if (parsed.publicationDateIso !== expectedDate) {
      throw new DiarioOficialConnectorError('date_mismatch', 'La fecha recibida no coincide con la solicitada.')
    }

    return {
      requestedUrl,
      finalUrl: canonicalUrl,
      status: response.status,
      mimeType,
      byteSize: new TextEncoder().encode(rawHtml).byteLength,
      contentHash: hashDiarioOficial(rawHtml),
      rawHtml,
      responseHeaders: responseHeaders(response),
      parsed,
      connectorVersion: 'diario-oficial-summary-v1',
    }
  } catch (error) {
    if (error instanceof DiarioOficialConnectorError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new DiarioOficialConnectorError('timeout', 'La captura del Diario Oficial excedió el tiempo máximo.')
    }
    throw new DiarioOficialConnectorError(
      'network_error',
      error instanceof Error ? error.message : 'No fue posible conectar con el Diario Oficial.',
    )
  } finally {
    clearTimeout(timeout)
  }
}
