import { createHash } from 'node:crypto'

const ARTICLE_PATTERN = /^art[ií]culo\s+((?:\d+|[ivxlcdm]+)(?:\s*(?:bis|ter|qu[aá]ter|[a-z]))?[°º]?)\s*(?:\.|-|–|—|:)*\s*(.*)$/i

function sha256(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex')
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

function htmlToParagraphs(html) {
  const withoutUnsafeBlocks = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ')

  const withBreaks = withoutUnsafeBlocks
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/(p|div|li|tr|section|article|h1|h2|h3|h4|h5|h6)>/gi, '\n\n')
    .replace(/<(p|div|li|tr|section|article|h1|h2|h3|h4|h5|h6)\b[^>]*>/gi, '\n\n')

  return decodeEntities(withBreaks.replace(/<[^>]+>/g, ' '))
    .replace(/\r/g, '')
    .split(/\n\s*\n+/)
    .map((paragraph) => paragraph.replace(/[\t ]+/g, ' ').replace(/\n+/g, ' ').trim())
    .filter(Boolean)
}

function normalizeText(value) {
  return value.normalize('NFC').replace(/\s+/g, ' ').trim()
}

function articleKey(reference) {
  const canonicalReference = normalizeText(reference)
    .toLowerCase()
    .replace(/^art[ií]culo\s+/, '')
    .replace(/\s+/g, '-')

  return `article:${canonicalReference}`
}

export function parseLeyChileHtml(html, options = {}) {
  if (typeof html !== 'string' || html.trim().length < 20) {
    throw new Error('leychile_parse_invalid_html')
  }

  const paragraphs = htmlToParagraphs(html)
  const articles = []
  let current = null

  for (const paragraph of paragraphs) {
    const match = paragraph.match(ARTICLE_PATTERN)
    if (match) {
      if (current) articles.push(current)
      current = {
        reference: `Artículo ${normalizeText(match[1])}`,
        openingText: normalizeText(match[2] || ''),
        paragraphs: [],
      }
      continue
    }

    if (current) current.paragraphs.push(normalizeText(paragraph))
  }

  if (current) articles.push(current)
  if (!articles.length) throw new Error('leychile_parse_no_articles')

  const sections = []
  let ordinal = 0

  for (const article of articles) {
    ordinal += 1
    const key = articleKey(article.reference)
    const articleParagraphs = [article.openingText, ...article.paragraphs].filter(Boolean)
    const bodyText = articleParagraphs.join('\n\n')
    const normalizedText = normalizeText(bodyText)

    sections.push({
      key,
      type: 'article',
      ordinal,
      referenceLabel: article.reference,
      heading: null,
      bodyText,
      normalizedText,
      hash: sha256(normalizedText),
      parentKey: null,
    })

    articleParagraphs.forEach((paragraph, index) => {
      ordinal += 1
      const incisoText = normalizeText(paragraph)
      sections.push({
        key: `${key}:inciso:${index + 1}`,
        type: 'inciso',
        ordinal,
        referenceLabel: `${article.reference}, inciso ${index + 1}`,
        heading: null,
        bodyText: paragraph,
        normalizedText: incisoText,
        hash: sha256(incisoText),
        parentKey: key,
      })
    })
  }

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  const title = titleMatch ? normalizeText(decodeEntities(titleMatch[1].replace(/<[^>]+>/g, ' '))) : null
  const normalizedDocument = sections
    .filter((section) => section.type === 'article')
    .map((section) => `${section.referenceLabel}\n${section.normalizedText}`)
    .join('\n\n')

  return {
    parserVersion: options.parserVersion || 'leychile-text-v1',
    title,
    articleCount: articles.length,
    sectionCount: sections.length,
    normalizedDocument,
    documentHash: sha256(normalizedDocument),
    sections,
  }
}

function canonicalChangePayload(changes) {
  return changes.map((change) => ({
    key: change.key,
    type: change.type,
    beforeHash: change.before?.hash || null,
    afterHash: change.after?.hash || null,
  }))
}

export function diffLeyChileSections(beforeSections, afterSections) {
  const beforeMap = new Map(beforeSections.map((section) => [section.key, section]))
  const afterMap = new Map(afterSections.map((section) => [section.key, section]))
  const keys = [...new Set([...beforeMap.keys(), ...afterMap.keys()])].sort()

  const changes = keys.map((key) => {
    const before = beforeMap.get(key) || null
    const after = afterMap.get(key) || null
    const type = !before ? 'added' : !after ? 'removed' : before.hash === after.hash ? 'unchanged' : 'modified'
    return { key, type, before, after }
  })

  const summary = changes.reduce((counts, change) => {
    counts[change.type] += 1
    return counts
  }, { added: 0, removed: 0, modified: 0, unchanged: 0 })

  const materialChanges = changes.filter((change) => change.type !== 'unchanged')
  const changeHash = sha256(JSON.stringify(canonicalChangePayload(materialChanges)))

  return {
    summary,
    hasChanges: materialChanges.length > 0,
    changeHash,
    changes,
  }
}

export function hashLeyChileContent(value) {
  return sha256(value)
}
