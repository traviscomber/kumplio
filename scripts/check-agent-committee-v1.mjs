import fs from 'node:fs'

const required = [
  ['lib/agents/committee.ts', ['buildCommitteeContrast', 'evaluateAgentQuality', 'quality_gate_failed']],
  ['lib/agents/tools.ts', ['CONTRASTE DEL COMITÉ', 'agent_artifacts']],
  ['lib/agents/prompts.ts', ['DECIDE:', 'NO DECIDE:', 'segunda línea del comité']],
  ['lib/agents/openai-runtime.ts', ['evaluateAgentQuality', 'quality_gate_failed', 'qualityGate']],
]

for (const [file, markers] of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing ${file}`)
  const text = fs.readFileSync(file, 'utf8')
  for (const marker of markers) {
    if (!text.includes(marker)) throw new Error(`${file} missing marker: ${marker}`)
  }
}

console.log('Agent committee guardrail: PASS')
