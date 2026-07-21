import 'server-only'

const SECRET_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: 'OpenAI API key', pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/g },
  { label: 'Bearer token', pattern: /\bBearer\s+[A-Za-z0-9._~+/=-]{20,}\b/gi },
  { label: 'JWT', pattern: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g },
  { label: 'Private key', pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
]

const INJECTION_MARKERS = [
  /ignore (all|any|the|previous) instructions/gi,
  /ignora (todas|las|cualquier) instrucciones/gi,
  /system prompt/gi,
  /developer message/gi,
  /reveal (your|the) (prompt|instructions)/gi,
  /muestra (el|tu) prompt/gi,
  /act as (system|developer)/gi,
  /override (the )?(policy|instructions)/gi,
]

export type PreparedAgentInput = {
  task: string
  context: string
  warnings: string[]
  injectionIndicators: number
  secretsRedacted: number
}

function cleanText(value: string) {
  return value.replace(/\u0000/g, '').replace(/\r\n/g, '\n').trim()
}

function redactSecrets(value: string) {
  let text = value
  const warnings: string[] = []
  let count = 0

  for (const item of SECRET_PATTERNS) {
    text = text.replace(item.pattern, () => {
      count += 1
      if (!warnings.includes(item.label)) warnings.push(item.label)
      return `[REDACTED ${item.label}]`
    })
  }

  return { text, warnings, count }
}

export function prepareAgentInput(task: string, context: string): PreparedAgentInput {
  const cleanedTask = cleanText(task)
  const cleanedContext = cleanText(context)
  const taskRedaction = redactSecrets(cleanedTask)
  const contextRedaction = redactSecrets(cleanedContext)
  const combined = `${taskRedaction.text}\n${contextRedaction.text}`
  const injectionIndicators = INJECTION_MARKERS.reduce(
    (total, marker) => total + (combined.match(marker)?.length || 0),
    0,
  )

  const warnings = [
    ...taskRedaction.warnings.map((label) => `${label} removed from task`),
    ...contextRedaction.warnings.map((label) => `${label} removed from context`),
  ]
  if (injectionIndicators > 0) {
    warnings.push('Potential prompt-injection instructions were treated as untrusted document content')
  }

  return {
    task: taskRedaction.text,
    context: contextRedaction.text,
    warnings,
    injectionIndicators,
    secretsRedacted: taskRedaction.count + contextRedaction.count,
  }
}
