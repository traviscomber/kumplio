const baseUrl = (process.env.SMOKE_BASE_URL || 'https://www.kumplio.app').replace(/\/$/, '')

const checks = [
  ['landing', '/', [200]],
  ['sign-in', '/sign-in', [200]],
  ['robots', '/robots.txt', [200]],
  ['sitemap', '/sitemap.xml', [200]],
  ['health', '/api/health', [200]],
]

let failed = false
for (const [name, path, accepted] of checks) {
  try {
    const response = await fetch(`${baseUrl}${path}`, { redirect: 'manual' })
    const ok = accepted.includes(response.status)
    console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: ${response.status}`)
    if (!ok) failed = true
  } catch (error) {
    failed = true
    console.error(`FAIL ${name}:`, error instanceof Error ? error.message : error)
  }
}

if (failed) process.exit(1)
console.log(`Smoke test: PASS (${baseUrl})`)
