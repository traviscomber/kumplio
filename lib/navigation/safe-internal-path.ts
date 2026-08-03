const INTERNAL_ORIGIN = 'https://kumplio.internal'
const DEFAULT_FALLBACK = '/onboarding'
const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/

function isUnsafeCandidate(value: string) {
  return (
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    CONTROL_CHARACTERS.test(value)
  )
}

function validatesAfterDecoding(value: string) {
  let candidate = value

  for (let iteration = 0; iteration < 4; iteration += 1) {
    if (isUnsafeCandidate(candidate)) return false

    let decoded: string
    try {
      decoded = decodeURIComponent(candidate)
    } catch {
      return false
    }

    if (decoded === candidate) return true
    candidate = decoded
  }

  return !isUnsafeCandidate(candidate)
}

export function safeInternalPath(value: string | null | undefined, fallback = DEFAULT_FALLBACK) {
  const rawValue = value?.trim()
  if (!rawValue || !validatesAfterDecoding(rawValue)) return fallback

  try {
    const parsed = new URL(rawValue, INTERNAL_ORIGIN)
    if (parsed.origin !== INTERNAL_ORIGIN) return fallback
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return fallback
  }
}
