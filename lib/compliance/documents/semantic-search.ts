import { classifyDocument } from './classification'

export type SearchableDocument = {
  id: string
  title: string
  text?: string | null
  documentType?: string | null
  status?: string | null
  href: string
}

export type RankedDocument = SearchableDocument & {
  score: number
  matchedTerms: string[]
  classification: ReturnType<typeof classifyDocument>
}

const STOP_WORDS = new Set([
  'a', 'al', 'de', 'del', 'el', 'en', 'la', 'las', 'los', 'o', 'para', 'por', 'que', 'se', 'un', 'una', 'y',
])

export function rankDocuments(query: string, documents: SearchableDocument[], limit = 12): RankedDocument[] {
  const terms = tokenize(query)
  if (!terms.length) return []

  return documents
    .map((document) => rankDocument(terms, document))
    .filter((document) => document.score > 0)
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title, 'es'))
    .slice(0, limit)
}

function rankDocument(terms: string[], document: SearchableDocument): RankedDocument {
  const title = normalize(document.title)
  const body = normalize(`${document.documentType || ''} ${document.status || ''} ${document.text || ''}`)
  const classification = classifyDocument({ title: document.title, text: document.text })
  const semanticText = normalize(`${classification.kind} ${classification.domains.join(' ')}`)
  const matchedTerms: string[] = []
  let score = 0

  for (const term of terms) {
    let matched = false
    if (title.includes(term)) {
      score += title === term ? 14 : 8
      matched = true
    }
    if (body.includes(term)) {
      score += 3
      matched = true
    }
    if (semanticText.includes(term)) {
      score += 5
      matched = true
    }
    if (matched) matchedTerms.push(term)
  }

  if (matchedTerms.length === terms.length) score += 8
  if (classification.confidence >= 70) score += 2

  return { ...document, score, matchedTerms, classification }
}

function tokenize(value: string) {
  return normalize(value)
    .split(/\s+/)
    .filter((term) => term.length > 1 && !STOP_WORDS.has(term))
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
