export type ReuseCandidate = {
  id: string
  name: string
  score: number
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokens(value: string) {
  return new Set(normalize(value).split(' ').filter((token) => token.length > 2))
}

export function similarity(left: string, right: string) {
  const a = tokens(left)
  const b = tokens(right)
  if (!a.size || !b.size) return 0
  let intersection = 0
  for (const token of a) if (b.has(token)) intersection += 1
  const union = new Set([...a, ...b]).size
  return union ? intersection / union : 0
}

export function findReuseCandidates(
  input: { name: string; objective?: string | null },
  existing: Array<{ id: string; name: string; control_objective?: string | null }>,
  threshold = 0.62,
): ReuseCandidate[] {
  const source = `${input.name} ${input.objective || ''}`
  return existing
    .map((candidate) => ({
      id: candidate.id,
      name: candidate.name,
      score: similarity(source, `${candidate.name} ${candidate.control_objective || ''}`),
    }))
    .filter((candidate) => candidate.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
}
