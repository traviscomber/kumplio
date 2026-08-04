import type { AIPlatformGroundedResponse } from './types'

const MAX_FACTS = 12
const MAX_SOURCES = 12
const MAX_ACTIONS = 8
const MAX_CAVEATS = 4

function uniqueBy<T>(items: T[], key: (item: T) => string) {
  const seen = new Set<string>()
  return items.filter((item) => {
    const value = key(item)
    if (seen.has(value)) return false
    seen.add(value)
    return true
  })
}

export function compactAIPlatformContext(response: AIPlatformGroundedResponse) {
  return {
    intent: response.intent,
    deterministic_answer: response.answer.slice(0, 2_400),
    facts: uniqueBy(response.facts, (item) => item.label).slice(0, MAX_FACTS),
    sources: uniqueBy(response.sources, (item) => `${item.type}:${item.id}`).slice(0, MAX_SOURCES),
    allowed_actions: uniqueBy(response.actions, (item) => `${item.label}:${item.href}`).slice(0, MAX_ACTIONS),
    execution_plan: response.plan,
    caveats: uniqueBy(response.caveats || [], (item) => item).slice(0, MAX_CAVEATS),
  }
}
