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
const USER_AGENT = 'KUMPLIO-Regulatory-Connector/0.3 (+https://www.kumplio.app/regulatory)'

export class DiarioOficialConnectorError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message)
    this.name = 'DiarioOficialConnectorError'
  }
}

export function normalizeDiarioOficialUrl(input: string) {
  let url: URL
  try { url = new URL(input) } catch { throw new DiarioOficialConnectorError('invalid_url', 'Invalid Diario Oficial URL') }
  if (url.protocol !== 'https:') throw new DiarioOficialConnectorError('https_required', 'HTTPS is required')
  if (url.hostname.toLowerCase() !== HOST) throw new DiarioOficialConnectorError('host_not_allowed', 'Host is not allowed')
  if (url.pathname !== PATH) throw new DiarioOficialConnectorError('path_not_allowed', 'Path is not allowed')
  const date = url.searchParams.get('date') || ''
  const edition = url.searchParams.get('edition') || ''
  return canonicalDiarioOficialEditionUrl(date, edition)
}

async function readLimited(response: Response) {
  const declared = Number(response.headers.get('content-length') || 0)
  if (declared > MAX_BYTES) throw new DiarioOficialConnectorError('response_too_large', 'Response exceeds size limit')
  if (!response.body) return ''
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (!value) continue
    total += value.byteLength
    if (total > MAX_BYTES) {
      await reader.cancel()
      throw new DiarioOficialConnectorError('response_too_large', 'Response exceeds size limit')
    }
    chunks.push(value)
  }
  const output = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) { output.set(chunk, offset); offset += chunk.byteLength }
  return new TextDecoder('utf-8', { fatal: false }).decode(output)
}

export async function captureDiarioOficialEdition(input: {
  date: string
  edition: string
  fetchImpl?: typeof fetch
}) {
  if (process.env.KUMPLIO_DIARIO_OFICIAL_CAPTURE_ENABLED === 'false') {
    throw new DiarioOficialConnectorError('capture_disabled', 'Diario Oficial capture is disabled')
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
    if (!response.ok) throw new DiarioOficialConnectorError('http_error', `HTTP ${response.status}`)
    const mimeType = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase()
    if (!['text/html', 'application/xhtml+xml'].includes(mimeType)) {
      throw new DiarioOficialConnectorError('mime_not_allowed', 'Unsupported content type')
    }
    const rawHtml = await readLimited(response)
    if (!rawHtml.trim()) throw new DiarioOficialConnectorError('empty_response', 'Empty response')
    const parsed = parseDiarioOficialEdition(rawHtml, { parserVersion: 'diario-oficial-summary-v1' })
    if (parsed.editionNumber !== String(input.edition).replace(/^0+/, '')) {
      throw new DiarioOficialConnectorError('edition_mismatch', 'Returned edition does not match requested edition')
    }
    return {
      requestedUrl,
      finalUrl: canonicalUrl,
      status: response.status,
      mimeType,
      byteSize: new TextEncoder().encode(rawHtml).byteLength,
      contentHash: hashDiarioOficial(rawHtml),
      rawHtml,
      parsed,
      connectorVersion: 'diario-oficial-summary-v1',
    }
  } catch (error) {
    if (error instanceof DiarioOficialConnectorError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new DiarioOficialConnectorError('timeout', 'Diario Oficial capture timed out')
    }
    throw new DiarioOficialConnectorError('network_error', 'Diario Oficial capture failed')
  } finally {
    clearTimeout(timeout)
  }
}
