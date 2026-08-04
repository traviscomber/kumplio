import { normalizeOfficialNumber, normalizeWhitespace, sha256 } from './core.mjs'

function normalizeLabel(value = '') {
  return normalizeWhitespace(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
}

function parseDate(value = '') {
  const match = String(value).match(/\b(\d{1,2})[./-](\d{1,2})[./-](\d{4})\b/)
  return match ? `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}` : null
}

function relationTypeFromContext(value = '') {
  const normalized = normalizeLabel(value)
  if (normalized.includes('DEJA SIN EFECTO') || normalized.includes('DEJESE SIN EFECTO')) return 'leaves_without_effect'
  if (normalized.includes('RECONSIDERA')) return 'reconsiders'
  if (normalized.includes('COMPLEMENTA')) return 'complements'
  if (normalized.includes('REITERA')) return 'reiterates'
  if (normalized.includes('CONFIRMA')) return 'confirms'
  return 'cites'
}

function canonicalIdentifier(targetType, rawNumber, mentionDate, sourcePublicationDate) {
  let normalized = normalizeOfficialNumber(rawNumber).replace(/^(\d+)\/0+(\d+)$/, '$1/$2')
  const referenceYear = mentionDate?.slice(0, 4) || sourcePublicationDate?.slice(0, 4) || null
  const operational = normalized.match(/^(\d{4})[/-](\d{5})$/)
  if (targetType === 'ordinario' && operational && referenceYear) {
    normalized = `${operational[1]}-${operational[2]}/${referenceYear}`
  }
  return normalized ? `dt:${targetType}:${normalized.toLocaleLowerCase('es-CL')}` : null
}

async function extractContinuations(text, options) {
  const source = String(text || '')
  const output = []
  const continuation = /(?:,|\by\b)\s*N(?:[°º]|ro[.]?)?s?[.]?\s*([0-9][0-9./-]*(?:\/[0-9]{4})?)(?:\s*,?\s*de\s*(\d{1,2}[./-]\d{1,2}[./-]\d{4}))?/gi

  for (const match of source.matchAll(continuation)) {
    const prefix = source.slice(Math.max(0, match.index - 320), match.index)
    const typeMatches = [...prefix.matchAll(/\b(Dictámenes|Ordinarios)\b/gi)]
    const nearestType = typeMatches.at(-1)?.[1]?.toLocaleLowerCase('es-CL')
    if (!nearestType) continue

    const targetType = nearestType.startsWith('dictamen') ? 'dictamen' : 'ordinario'
    const mentionDate = match[2] ? parseDate(match[2]) : null
    const targetIdentifier = canonicalIdentifier(
      targetType,
      match[1],
      mentionDate,
      options.sourcePublicationDate,
    )
    if (!targetIdentifier || targetIdentifier === options.currentIdentifier) continue

    const context = source.slice(Math.max(0, match.index - 220), Math.min(source.length, match.index + match[0].length + 40))
    const relation = {
      type: relationTypeFromContext(context),
      targetLabel: normalizeWhitespace(match[0]).replace(/^[,\s]+/, ''),
      targetIdentifier,
      targetPublicationDate: mentionDate,
      confidence: 1,
      metadata: {
        extraction: 'deterministic_continuation_relation_v2',
        sourceBlock: options.sourceBlock,
      },
    }
    output.push({
      ...relation,
      hash: await sha256(`${relation.type}|${relation.targetIdentifier}|${relation.targetPublicationDate || ''}|${relation.targetLabel}`),
    })
  }

  return output
}

export async function enrichDtRelations(parsed) {
  const additions = [
    ...await extractContinuations(parsed.metadata?.catalogTopics || '', {
      sourceBlock: 'catalogacion',
      currentIdentifier: parsed.canonicalIdentifier,
      sourcePublicationDate: parsed.publicationDate,
    }),
    ...await extractContinuations(parsed.summary || '', {
      sourceBlock: 'resumen',
      currentIdentifier: parsed.canonicalIdentifier,
      sourcePublicationDate: parsed.publicationDate,
    }),
  ]

  const output = []
  const seen = new Set()
  for (const relation of [...(parsed.relations || []), ...additions]) {
    const key = `${relation.type}|${relation.targetIdentifier}|${relation.targetPublicationDate || ''}`
    if (seen.has(key)) continue
    seen.add(key)
    output.push(relation)
  }
  return output
}
