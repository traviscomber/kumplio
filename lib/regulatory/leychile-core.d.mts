export type LeyChileSection = {
  key: string
  type: 'article' | 'inciso'
  ordinal: number
  referenceLabel: string
  heading: string | null
  bodyText: string
  normalizedText: string
  hash: string
  parentKey: string | null
}

export type ParsedLeyChileDocument = {
  parserVersion: string
  title: string | null
  articleCount: number
  sectionCount: number
  normalizedDocument: string
  documentHash: string
  sections: LeyChileSection[]
}

export type LeyChileSectionChange = {
  key: string
  type: 'added' | 'removed' | 'modified' | 'unchanged'
  before: LeyChileSection | null
  after: LeyChileSection | null
}

export type LeyChileDiff = {
  summary: {
    added: number
    removed: number
    modified: number
    unchanged: number
  }
  hasChanges: boolean
  changeHash: string
  changes: LeyChileSectionChange[]
}

export function parseLeyChileHtml(
  html: string,
  options?: { parserVersion?: string },
): ParsedLeyChileDocument

export function diffLeyChileSections(
  beforeSections: LeyChileSection[],
  afterSections: LeyChileSection[],
): LeyChileDiff

export function hashLeyChileContent(value: string): string
