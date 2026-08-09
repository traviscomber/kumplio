const API_HOSTS = new Set(['api.mercadopublico.cl', 'apipre.mercadopublico.cl'])

export function normalizeWhitespace(value = '') {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

export function normalizeRut(value = '') {
  const compact = String(value ?? '').toUpperCase().replace(/[^0-9K]/g, '')
  if (compact.length < 2) return ''
  return `${compact.slice(0, -1)}-${compact.slice(-1)}`
}

export function canonicalApiUrl(input) {
  const url = new URL(input)
  if (url.protocol !== 'https:') throw new Error('mercado_publico_https_required')
  if (!API_HOSTS.has(url.hostname.toLowerCase())) throw new Error('mercado_publico_host_not_allowed')
  if (!/^\/servicios\/v1\/publico\/(?:licitaciones|ordenesdecompra)[.]json$/i.test(url.pathname)) {
    throw new Error('mercado_publico_path_not_allowed')
  }
  url.hash = ''
  return url.toString()
}

export function formatApiDate(input) {
  const value = String(input ?? '')
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) throw new Error('mercado_publico_invalid_date')
  const date = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error('mercado_publico_invalid_date')
  }
  return `${match[3]}${match[2]}${match[1]}`
}

export function parseProviderDate(value) {
  if (!value) return null
  const raw = String(value).trim()
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  const latam = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/)
  if (latam) return `${latam[3]}-${latam[2].padStart(2, '0')}-${latam[1].padStart(2, '0')}`
  const dotNet = raw.match(/\/Date\((\d+)(?:[+-]\d+)?\)\//)
  if (dotNet) return new Date(Number(dotNet[1])).toISOString().slice(0, 10)
  return null
}

function unwrapList(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('mercado_publico_invalid_payload')
  const listado = payload.Listado ?? payload.listado
  if (!Array.isArray(listado)) throw new Error('mercado_publico_list_missing')
  return listado
}

function text(value) {
  return normalizeWhitespace(value)
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(String(value).replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeBuyer(value = {}) {
  return {
    organizationCode: text(value.CodigoOrganismo ?? value.codigoOrganismo),
    organizationName: text(value.NombreOrganismo ?? value.nombreOrganismo),
    unitRut: normalizeRut(value.RutUnidad ?? value.rutUnidad),
    unitCode: text(value.CodigoUnidad ?? value.codigoUnidad),
    unitName: text(value.NombreUnidad ?? value.nombreUnidad),
    commune: text(value.ComunaUnidad ?? value.comunaUnidad),
    region: text(value.RegionUnidad ?? value.regionUnidad),
  }
}

function normalizeSupplier(value = {}) {
  return {
    code: text(value.CodigoProveedor ?? value.codigoProveedor ?? value.CodigoEmpresa ?? value.codigoEmpresa),
    name: text(value.NombreProveedor ?? value.nombreProveedor ?? value.NombreEmpresa ?? value.nombreEmpresa),
    rut: normalizeRut(value.RutProveedor ?? value.rutProveedor ?? value.RutEmpresa ?? value.rutEmpresa),
  }
}

export function tenderCanonicalIdentifier(code) {
  const normalized = text(code).toLowerCase()
  if (!normalized) throw new Error('mercado_publico_tender_code_missing')
  return `mercadopublico:licitacion:${normalized}`
}

export function purchaseOrderCanonicalIdentifier(code) {
  const normalized = text(code).toLowerCase()
  if (!normalized) throw new Error('mercado_publico_purchase_order_code_missing')
  return `mercadopublico:oc:${normalized}`
}

export function parseTenderPayload(payload) {
  const entries = unwrapList(payload)
  const seen = new Set()
  const output = []

  for (const item of entries) {
    const code = text(item.CodigoExterno ?? item.codigoExterno)
    if (!code) continue
    const canonicalIdentifier = tenderCanonicalIdentifier(code)
    if (seen.has(canonicalIdentifier)) continue
    seen.add(canonicalIdentifier)

    const buyer = normalizeBuyer(item.Comprador ?? item.comprador ?? {})
    const award = item.Adjudicacion ?? item.adjudicacion ?? null
    const supplier = award ? normalizeSupplier(award) : null

    output.push({
      canonicalIdentifier,
      code,
      name: text(item.Nombre ?? item.nombre),
      description: text(item.Descripcion ?? item.descripcion),
      statusCode: text(item.CodigoEstado ?? item.codigoEstado),
      status: text(item.Estado ?? item.estado),
      createdDate: parseProviderDate(item.FechaCreacion ?? item.fechaCreacion),
      closingDate: parseProviderDate(item.FechaCierre ?? item.fechaCierre),
      publishedDate: parseProviderDate(item.FechaPublicacion ?? item.fechaPublicacion),
      currency: text(item.Moneda ?? item.moneda),
      estimatedAmount: numberOrNull(item.MontoEstimado ?? item.montoEstimado),
      buyer,
      supplier,
      awardAmount: award ? numberOrNull(award.MontoUnitario ?? award.montoUnitario ?? award.Monto ?? award.monto) : null,
      sourceType: 'licitacion',
    })
  }

  output.sort((a, b) => a.code.localeCompare(b.code, 'es-CL'))
  return output
}

export function parsePurchaseOrderPayload(payload) {
  const entries = unwrapList(payload)
  const seen = new Set()
  const output = []

  for (const item of entries) {
    const code = text(item.Codigo ?? item.codigo ?? item.CodigoExterno ?? item.codigoExterno)
    if (!code) continue
    const canonicalIdentifier = purchaseOrderCanonicalIdentifier(code)
    if (seen.has(canonicalIdentifier)) continue
    seen.add(canonicalIdentifier)

    output.push({
      canonicalIdentifier,
      code,
      name: text(item.Nombre ?? item.nombre),
      description: text(item.Descripcion ?? item.descripcion),
      statusCode: text(item.CodigoEstado ?? item.codigoEstado),
      status: text(item.Estado ?? item.estado),
      createdDate: parseProviderDate(item.FechaCreacion ?? item.fechaCreacion),
      sentDate: parseProviderDate(item.Fechas?.FechaEnvio ?? item.fechas?.fechaEnvio ?? item.FechaEnvio ?? item.fechaEnvio),
      acceptedDate: parseProviderDate(item.Fechas?.FechaAceptacion ?? item.fechas?.fechaAceptacion ?? item.FechaAceptacion ?? item.fechaAceptacion),
      currency: text(item.TipoMoneda ?? item.tipoMoneda ?? item.Moneda ?? item.moneda),
      totalNet: numberOrNull(item.TotalNeto ?? item.totalNeto),
      taxes: numberOrNull(item.Impuestos ?? item.impuestos),
      total: numberOrNull(item.Total ?? item.total),
      buyer: normalizeBuyer(item.Comprador ?? item.comprador ?? {}),
      supplier: normalizeSupplier(item.Proveedor ?? item.proveedor ?? {}),
      sourceType: 'orden_compra',
    })
  }

  output.sort((a, b) => a.code.localeCompare(b.code, 'es-CL'))
  return output
}

export async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(value)))
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}
