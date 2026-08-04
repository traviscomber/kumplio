import type { AIPlatformGroundedResponse } from './types'

function sameSet(left: string[], right: string[]) {
  if (left.length !== right.length) return false
  const a = [...left].sort()
  const b = [...right].sort()
  return a.every((value, index) => value === b[index])
}

export function validateGroundedResponse(
  deterministic: AIPlatformGroundedResponse,
  candidate: AIPlatformGroundedResponse,
) {
  if (candidate.intent !== deterministic.intent) throw new Error('El modelo cambió la intención.')

  const deterministicSources = deterministic.sources.map((item) => `${item.type}:${item.id}`)
  const candidateSources = candidate.sources.map((item) => `${item.type}:${item.id}`)
  if (!sameSet(deterministicSources, candidateSources)) throw new Error('El modelo alteró las fuentes.')

  const deterministicActions = deterministic.actions.map((item) => `${item.label}:${item.href}`)
  const candidateActions = candidate.actions.map((item) => `${item.label}:${item.href}`)
  if (!sameSet(deterministicActions, candidateActions)) throw new Error('El modelo alteró las acciones permitidas.')

  const deterministicFacts = deterministic.facts.map((item) => `${item.label}:${item.value}`)
  const candidateFacts = candidate.facts.map((item) => `${item.label}:${item.value}`)
  if (!sameSet(deterministicFacts, candidateFacts)) throw new Error('El modelo alteró los hechos.')

  if (!candidate.answer.trim()) throw new Error('La respuesta está vacía.')
  return candidate
}
