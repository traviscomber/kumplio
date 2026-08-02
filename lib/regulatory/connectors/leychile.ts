import 'server-only'

import {
  hashLeyChileContent,
  parseLeyChileHtml,
  type ParsedLeyChileDocument,
} from '@/lib/regulatory/leychile-core.mjs'

const ALLOWED_HOSTS = new Set(['www.bcn.cl', 'bcn.cl'])
const ALLOWED_PATH = '/leychile/navegar'
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024
const DEFAULT_TIMEOUT_MS = 20_000
const USER_AGENT = 'KUMPLIO-Regulatory-Connector/0.1 (+https://www.kumplio.app/regulatory)'

export type LeyChileCaptureAuthorization = {
  termsApproved: boolean
  approvedMethod: 'official_api' | 'official_feed' | 'controlled_html' | 'manual'
  approvalReference: string
}

export type LeyChileCaptureResult = {
  requestedUrl: string
  finalUrl: string
  status: number
  mimeType: string
  byteSize: number
  contentHash: string
  rawHtml: string
  parsed: ParsedLeyChileDocument
  connectorVersion: string
}

export class LeyChileConnectorError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'LeyChileConnectorError'
  }
}

export function normalizeLeyChileUrl(input: string) {
  let url: URL
  try {
    url = new URL(input)
  } catch {
    throw new LeyChileConnectorError('invalid_url', 'LeyChile URL is invalid')
  }

  if (url.protocol !== 'https:') {
    throw new LeyChileConnectorError('https_required', 'LeyChile connector requires HTTPS')
  }

  const hostname = url.hostname.toLowerCase()
  if (!ALLOWED_HOSTS.has(hostname)) {
    throw new LeyChileConnectorError('host_not_allowed', 'LeyChile host is not allowed')
  }

  if (url.pathname.toLowerCase() !== ALLOWED_PATH) {
    throw new LeyChileConnectorError('path_not_allowed', 'LeyChile path is not allowed')
  }

  const idNorma = url.searchParams.get('idNorma')
  if (!idNorma || !/^\d{1,12}$/.test(idNorma)) {
    throw new LeyChileConnectorError('invalid_norm_id', 'LeyChile idNorma is required')
  }

  const idVersion = url.searchParams.get('idVersion')
  if (idVersion && !/^\d{4}-\d{2}-\d{2}$/.test(idVersion)) {
    throw new LeyChileConnectorError('invalid_version', 'LeyChile idVersion must use YYYY-MM-DD')
  }

  const canonical = new URL(`https://www.bcn.cl${ALLOWED_PATH}`)
  canonical.searchParams.set('idNorma', idNorma)
  if (idVersion) canonical.searchParams.set('idVersion', idVersion)
  return canonical.toString()
}

export function isLeyChileCaptureEnabled() {
  return process.env.KUMPLIO_LEYCHILE_CAPTURE_ENABLED === 'true'
}

async function readLimitedText(response: Response, maximumBytes: number) {
  const declaredLength = Number(response.headers.get('content-length') || 0)
  if (declaredLength > maximumBytes) {
    throw new LeyChileConnectorError('response_too_large', 'LeyChile response exceeds the configured limit')
  }

  if (!response.body) return ''

  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (!value) continue
    total += value.byteLength
    if (total > maximumBytes) {
      await reader.cancel()
      throw new LeyChileConnectorError('response_too_large', 'LeyChile response exceeds the configured limit')
    }
    chunks.push(value)
  }

  const bytes = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }

  return new TextDecoder('utf-8', { fatal: false }).decode(bytes)
}

async function controlledFetch(
  requestedUrl: string,
  fetchImpl: typeof fetch,
  signal: AbortSignal,
) {
  let currentUrl = requestedUrl

  for (let redirects = 0; redirects <= 2; redirects += 1) {
    const response = await fetchImpl(currentUrl, {
      method: 'GET',
      redirect: 'manual',
      cache: 'no-store',
      signal,
      headers: {
        Accept: 'text/html,application/xhtml+xml;q=0.9,text/plain;q=0.8',
        'User-Agent': USER_AGENT,
      },
    })

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (!location) throw new LeyChileConnectorError('redirect_without_location', 'LeyChile returned an invalid redirect')
      currentUrl = normalizeLeyChileUrl(new URL(location, currentUrl).toString())
      continue
    }

    return { response, finalUrl: currentUrl }
  }

  throw new LeyChileConnectorError('too_many_redirects', 'LeyChile exceeded the redirect limit')
}

export async function captureLeyChileDocument(input: {
  url: string
  authorization: LeyChileCaptureAuthorization
  fetchImpl?: typeof fetch
  timeoutMs?: number
}): Promise<LeyChileCaptureResult> {
  if (!isLeyChileCaptureEnabled()) {
    throw new LeyChileConnectorError('capture_disabled', 'LeyChile production capture is disabled')
  }

  if (!input.authorization.termsApproved || input.authorization.approvedMethod !== 'controlled_html') {
    throw new LeyChileConnectorError('method_not_approved', 'Controlled HTML capture has not been approved')
  }

  if (input.authorization.approvalReference.trim().length < 3) {
    throw new LeyChileConnectorError('approval_reference_required', 'Capture approval reference is required')
  }

  const requestedUrl = normalizeLeyChileUrl(input.url)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs || DEFAULT_TIMEOUT_MS)

  try {
    const { response, finalUrl } = await controlledFetch(
      requestedUrl,
      input.fetchImpl || fetch,
      controller.signal,
    )

    if (!response.ok) {
      throw new LeyChileConnectorError('http_error', `LeyChile returned HTTP ${response.status}`)
    }

    const mimeType = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase()
    if (!['text/html', 'application/xhtml+xml', 'text/plain'].includes(mimeType)) {
      throw new LeyChileConnectorError('mime_not_allowed', 'LeyChile returned an unsupported content type')
    }

    const rawHtml = await readLimitedText(response, MAX_RESPONSE_BYTES)
    if (!rawHtml.trim()) {
      throw new LeyChileConnectorError('empty_response', 'LeyChile returned an empty response')
    }

    const parsed = parseLeyChileHtml(rawHtml, { parserVersion: 'leychile-text-v1' })

    return {
      requestedUrl,
      finalUrl,
      status: response.status,
      mimeType,
      byteSize: new TextEncoder().encode(rawHtml).byteLength,
      contentHash: hashLeyChileContent(rawHtml),
      rawHtml,
      parsed,
      connectorVersion: 'leychile-controlled-html-v1',
    }
  } catch (error) {
    if (error instanceof LeyChileConnectorError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new LeyChileConnectorError('timeout', 'LeyChile capture timed out')
    }
    throw new LeyChileConnectorError('network_error', 'LeyChile capture failed')
  } finally {
    clearTimeout(timeout)
  }
}
