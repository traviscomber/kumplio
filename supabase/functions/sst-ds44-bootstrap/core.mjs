const DT_HOSTS = new Set(['www.dt.gob.cl', 'dt.gob.cl'])
const SUSESO_HOSTS = new Set(['www.suseso.cl', 'www-cloud.suseso.cl', 'suseso.cl'])

function decodeEntities(value = '') {
  return String(value)
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/gi, "'")
    .replace(/&aacute;/gi, 'á')
    .replace(/&eacute;/gi, 'é')
    .replace(/&iacute;/gi, 'í')
    .replace(/&oacute;/gi, 'ó')
    .replace(/&uacute;/gi, 'ú')
    .replace(/&ntilde;/gi, 'ñ')
    .replace(/&#(\d+);/g, (_m, code) => String.fromCodePoint(Number(code)))
}

export function normalizeWhitespace(value = '') {
  return decodeEntities(value).replace(/\s+/g, ' ').trim()
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

export async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(value)))
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function canonicalOfficialUrl(input, authority) {
  const url = new URL(input)
  if (url.protocol !== 'https:') throw new Error('sst_https_required')
  const host = url.hostname.toLowerCase()
  if (authority === 'dt' && !DT_HOSTS.has(host)) throw new Error('sst_dt_host_not_allowed')
  if (authority === 'suseso' && !SUSESO_HOSTS.has(host)) throw new Error('sst_suseso_host_not_allowed')
  if (!['dt', 'suseso'].includes(authority)) throw new Error('sst_authority_not_supported')
  url.search = ''
  url.hash = ''
  return url.toString()
}

function classifyDtResource(label = '', href = '') {
  const text = `${label} ${href}`.toLocaleLowerCase('es-CL')
  if (text.includes('formulario') && text.includes('fiscal')) return 'inspection_form'
  if (text.includes('tipificador')) return 'infraction_typifier'
  if (text.includes('mapa') && text.includes('riesgo')) return 'risk_map_guidance'
  if ((text.includes('identific') || text.includes('evaluaci')) && text.includes('riesgo')) return 'risk_assessment_guidance'
  if (text.includes('element') && text.includes('protecci')) return 'ppe_guidance'
  if (text.includes('política nacional') || text.includes('politica nacional')) return 'national_policy'
  if (text.includes('decreto') && text.includes('44')) return 'decree_text'
  if (text.includes('presentaci')) return 'presentation'
  if (text.includes('guía') || text.includes('guia')) return 'technical_guidance'
  return 'other_resource'
}

export function parseDtDs44LandingPage(html, sourceUrl = 'https://www.dt.gob.cl/portal/1626/w3-article-127643.html') {
  const canonicalUrl = canonicalOfficialUrl(sourceUrl, 'dt')
  const body = String(html || '')
  const resources = []
  const seen = new Set()
  const linkPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi

  for (const match of body.matchAll(linkPattern)) {
    const label = htmlToText(match[2])
    if (!label) continue
    let absolute
    try {
      absolute = new URL(match[1], canonicalUrl)
    } catch {
      continue
    }
    const host = absolute.hostname.toLowerCase()
    if (!DT_HOSTS.has(host)) continue
    const combined = `${label} ${absolute.pathname}`.toLocaleLowerCase('es-CL')
    if (!combined.includes('decreto') && !combined.includes('riesgo') && !combined.includes('fiscal') && !combined.includes('tipificador') && !combined.includes('protecci') && !combined.includes('política') && !combined.includes('politica')) continue
    absolute.search = ''
    absolute.hash = ''
    const url = absolute.toString()
    if (seen.has(url)) continue
    seen.add(url)
    resources.push({
      title: label,
      url,
      resourceType: classifyDtResource(label, url),
      mimeHint: /[.]pdf$/i.test(absolute.pathname) ? 'application/pdf' : 'text/html',
      authorityRole: label.toLocaleLowerCase('es-CL').includes('guía') || label.toLocaleLowerCase('es-CL').includes('guia') ? 'technical_guidance' : 'official_material',
    })
  }

  const pageText = htmlToText(body)
  const instrumentNames = [
    'Matriz de Identificación de Peligros y Evaluación de Riesgos',
    'Programa de Trabajo en Prevención de Riesgos Laborales',
    'Información y formación en seguridad y salud en el trabajo',
    'Consulta y participación de las personas trabajadoras en la gestión preventiva',
    'Plan de Gestión para la reducción de Riesgos de emergencias, catástrofes o desastres en los lugares de trabajo',
    'Sistema de Gestión de Seguridad y Salud en el Trabajo',
    'Comités Paritarios de Higiene y Seguridad',
    'Departamentos de Prevención de Riesgos',
    'Reglamentos Internos',
    'Mapas de Riesgos',
    'Instrumentos de Gestión Preventiva para entidades empleadoras de menor tamaño',
  ]
  const instruments = instrumentNames.filter((name) => pageText.toLocaleLowerCase('es-CL').includes(name.toLocaleLowerCase('es-CL')))

  return {
    authority: 'Dirección del Trabajo',
    sourceUrl: canonicalUrl,
    resourceCount: resources.length,
    resources,
    instruments,
  }
}

function parseSpanishDate(value = '') {
  const match = String(value).match(/\b(\d{1,2})\s+de\s+([a-záéíóúñ]+)\s+de\s+(\d{4})\b/i)
  if (!match) return null
  const months = new Map([
    ['enero', '01'], ['febrero', '02'], ['marzo', '03'], ['abril', '04'], ['mayo', '05'], ['junio', '06'],
    ['julio', '07'], ['agosto', '08'], ['septiembre', '09'], ['octubre', '10'], ['noviembre', '11'], ['diciembre', '12'],
  ])
  const month = months.get(match[2].toLocaleLowerCase('es-CL'))
  return month ? `${match[3]}-${month}-${match[1].padStart(2, '0')}` : null
}

function extractLabel(text, label, stopLabels) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const stop = stopLabels.map((item) => item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  const pattern = new RegExp(`${escaped}\\s*:?\\s*([\\s\\S]*?)(?=${stop ? `(?:${stop})\\s*:?` : '$'})`, 'i')
  const match = String(text).match(pattern)
  return match ? normalizeWhitespace(match[1]) : ''
}

export function parseSusesoCircularPage(html, sourceUrl) {
  const canonicalUrl = canonicalOfficialUrl(sourceUrl, 'suseso')
  const text = htmlToText(html)
  const titleMatch = text.match(/Circular\s+(\d{3,5})/i)
  if (!titleMatch) throw new Error('suseso_circular_number_missing')
  const number = titleMatch[1]
  const dateTextMatch = text.match(/Fecha\s*:\s*(\d{1,2}\s+de\s+[a-záéíóúñ]+\s+de\s+\d{4})/i)
  const publicationDate = dateTextMatch ? parseSpanishDate(dateTextMatch[1]) : null
  const labels = ['Materia', 'Tema', 'Destinatario', 'Observación', 'Acción', 'Fuentes', 'Departamento(s)']
  const field = (label) => extractLabel(text, label, labels.filter((candidate) => candidate !== label))
  const sources = field('Fuentes')
  const ds44Related = /D[.]?S[.]?\s*N?[°º]?\s*44|Decreto\s+44/i.test(`${sources} ${text}`)

  return {
    authority: 'SUSESO',
    canonicalIdentifier: `suseso:circular:${number}`,
    circularNumber: number,
    publicationDate,
    sourceUrl: canonicalUrl,
    subject: field('Materia'),
    topic: field('Tema'),
    recipient: field('Destinatario'),
    observation: field('Observación'),
    action: field('Acción'),
    sources,
    department: field('Departamento(s)'),
    ds44Related,
  }
}

export function deriveSstOutcomeSignals({ dt, suseso = [] } = {}) {
  const resources = Array.isArray(dt?.resources) ? dt.resources : []
  const circulars = Array.isArray(suseso) ? suseso.filter((item) => item?.ds44Related) : []
  const hasInspectionForm = resources.some((item) => item.resourceType === 'inspection_form')
  const hasTypifier = resources.some((item) => item.resourceType === 'infraction_typifier')
  const hasRiskGuidance = resources.some((item) => ['risk_map_guidance', 'risk_assessment_guidance'].includes(item.resourceType))
  return {
    inspectionReadiness: hasInspectionForm && hasTypifier,
    riskManagementEvidence: hasRiskGuidance,
    ds44OperationalGuidanceCount: circulars.length,
    candidateOutcomes: [
      ...(hasInspectionForm ? ['inspection_gap_analysis'] : []),
      ...(hasTypifier ? ['risk_prioritization'] : []),
      ...(hasRiskGuidance ? ['risk_matrix_and_controls'] : []),
      ...(circulars.length ? ['training_records_incident_controls'] : []),
    ],
  }
}
