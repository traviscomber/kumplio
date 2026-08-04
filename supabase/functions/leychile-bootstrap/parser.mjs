const ARTICLE_SUFFIX = '(?:duodecies|undecies|decies|nonies|octies|septies|sexies|quinquies|qu[aá]ter|ter|bis)'

export const ARTICLE_PATTERN = new RegExp(
  `^[\\s"“”'«»]*(art[ií]culo\\s+((?:\\d+|[ivxlcdm]+)(?:\\s*${ARTICLE_SUFFIX})?[°º]?|primero|segundo|tercero|cuarto|quinto|sexto|s[eé]ptimo|octavo|noveno|d[eé]cimo)(?:\\s+transitorio)?)\\s*(?:\\.|-|–|—|:)*\\s*(.*)$`,
  'i',
)

export const AMENDMENT_BOUNDARY_PATTERN = /^\s*\d+\)\s+(?:en\s+(?:el|la|los|las)\b|reempl[aá]z(?:ase|anse)\b|sustit[uú]y(?:ese|ense)\b|agr[eé]g(?:ase|anse)\b|incorp[oó]r(?:ase|anse)\b|interc[aá]l(?:ase|anse)\b|supr[ií]m(?:ese|ense)\b|modif[ií]c(?:ase|anse)\b|introd[uú]c(?:ese|ense)\b)/i

export function normalizeText(value) {
  return value.normalize('NFC').replace(/\s+/g, ' ').trim()
}

function decodeEntities(value) {
  const named = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: ' ',
    ndash: '–',
    mdash: '—',
    deg: '°',
  }

  return value
    .replace(/&#(\d+);/g, (_, number) => String.fromCodePoint(Number(number)))
    .replace(/&#x([0-9a-f]+);/gi, (_, number) => String.fromCodePoint(Number.parseInt(number, 16)))
    .replace(/&([a-z]+);/gi, (entity, name) => named[name.toLowerCase()] ?? entity)
}

export function htmlToParagraphs(html) {
  const cleaned = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<br\s*\/?\s*>/gi, '\n\n')
    .replace(/<\/(p|div|li|tr|section|article|h1|h2|h3|h4|h5|h6)>/gi, '\n\n')
    .replace(/<(p|div|li|tr|section|article|h1|h2|h3|h4|h5|h6)\b[^>]*>/gi, '\n\n')
    .replace(/<[^>]+>/g, ' ')

  return decodeEntities(cleaned)
    .replace(/\r/g, '')
    .split(/\n\s*\n+/)
    .map((paragraph) => paragraph.replace(/[\t ]+/g, ' ').replace(/\n+/g, ' ').trim())
    .filter(Boolean)
}

export async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function canonical(value) {
  return normalizeText(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^articulo\s+/, '')
    .replace(/º/g, '°')
    .replace(/[^a-z0-9°]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function structureNames(structure) {
  const names = new Map()

  const visit = (items) => {
    if (!Array.isArray(items)) return

    for (const item of items) {
      if (!item || typeof item !== 'object') continue
      const id = Number(item.i)
      if (Number.isFinite(id)) names.set(id, String(item.n || `Parte ${id}`))
      if (Array.isArray(item.h)) visit(item.h)
    }
  }

  visit(structure)
  return names
}

function flattenHtml(entries, names) {
  const parts = []

  const visit = (items) => {
    if (!Array.isArray(items)) return

    for (const item of items) {
      if (!item || typeof item !== 'object') continue
      const id = Number(item.i)
      if (!Number.isFinite(id)) continue

      parts.push({
        id,
        name: names.get(id) || `Parte ${id}`,
        html: String(item.t || ''),
      })

      if (Array.isArray(item.h)) visit(item.h)
    }
  }

  visit(entries)
  return parts
}

function findArticleEnd(paragraphs, startIndex, nextArticleIndex) {
  let end = nextArticleIndex ?? paragraphs.length

  for (let index = startIndex + 1; index < end; index += 1) {
    if (AMENDMENT_BOUNDARY_PATTERN.test(paragraphs[index])) {
      end = index
      break
    }
  }

  return end
}

export async function parsePayload(payload) {
  const names = structureNames(payload.estructura)
  const parts = flattenHtml(payload.html, names)
  const sections = []
  const normalizedParts = []
  let ordinal = 0

  for (const part of parts) {
    const paragraphs = htmlToParagraphs(part.html)
    if (!paragraphs.length) continue

    normalizedParts.push(`${part.name}\n${paragraphs.join('\n\n')}`)

    const articleStarts = []
    paragraphs.forEach((paragraph, index) => {
      const match = paragraph.match(ARTICLE_PATTERN)
      if (!match) return

      articleStarts.push({
        index,
        label: normalizeText(match[1]),
        reference: normalizeText(match[2]),
        opening: normalizeText(match[3] || ''),
      })
    })

    const keyOccurrences = new Map()

    for (let startPosition = 0; startPosition < articleStarts.length; startPosition += 1) {
      const start = articleStarts[startPosition]
      const nextArticleIndex = articleStarts[startPosition + 1]?.index
      const end = findArticleEnd(paragraphs, start.index, nextArticleIndex)
      const articleParagraphs = [start.opening, ...paragraphs.slice(start.index + 1, end)].filter(Boolean)
      const bodyText = articleParagraphs.join('\n\n')
      const normalizedBody = normalizeText(bodyText)
      if (!normalizedBody) continue

      const isPrimaryPartArticle = startPosition === 0 && /^art[ií]culo/i.test(part.name)
      const referenceLabel = isPrimaryPartArticle ? part.name : start.label
      const baseKey = `part:${part.id}:article:${canonical(referenceLabel || start.reference)}`
      const occurrence = (keyOccurrences.get(baseKey) || 0) + 1
      keyOccurrences.set(baseKey, occurrence)
      const articleKey = occurrence === 1 ? baseKey : `${baseKey}:occurrence:${occurrence}`

      ordinal += 1
      sections.push({
        key: articleKey,
        type: 'article',
        ordinal,
        referenceLabel,
        heading: part.name,
        bodyText,
        normalizedText: normalizedBody,
        hash: await sha256(`${articleKey}\n${normalizedBody}`),
        parentKey: null,
      })

      for (let index = 0; index < articleParagraphs.length; index += 1) {
        const paragraph = articleParagraphs[index]
        const incisoText = normalizeText(paragraph)
        if (!incisoText) continue

        const incisoKey = `${articleKey}:inciso:${index + 1}`
        ordinal += 1
        sections.push({
          key: incisoKey,
          type: 'inciso',
          ordinal,
          referenceLabel: `${referenceLabel}, inciso ${index + 1}`,
          heading: null,
          bodyText: paragraph,
          normalizedText: incisoText,
          hash: await sha256(`${incisoKey}\n${incisoText}`),
          parentKey: articleKey,
        })
      }
    }
  }

  if (!sections.some((section) => section.type === 'article')) {
    throw new Error('leychile_parse_no_articles')
  }

  const normalizedDocument = normalizedParts.join('\n\n')

  return {
    parts,
    sections,
    normalizedDocument,
    documentHash: await sha256(normalizedDocument),
  }
}
