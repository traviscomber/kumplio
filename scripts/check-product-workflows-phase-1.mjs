import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const [layout, indexPage, navigation, topNav, homePage, casesPage, legacyCasesPage, caseDetailPage, documentsPage, legacyDocumentsPage, evidencePage, legacyEvidencePage, legacyDashboardPage, dailyContent] = await Promise.all([
  readFile('app/app/layout.tsx', 'utf8'),
  readFile('app/app/page.tsx', 'utf8'),
  readFile('components/app-navigation.tsx', 'utf8'),
  readFile('components/layout/top-nav.tsx', 'utf8'),
  readFile('app/app/inicio/page.tsx', 'utf8'),
  readFile('app/app/casos/page.tsx', 'utf8'),
  readFile('app/cases/page.tsx', 'utf8'),
  readFile('app/app/casos/[id]/page.tsx', 'utf8'),
  readFile('app/app/documentos/page.tsx', 'utf8'),
  readFile('app/documents/page.tsx', 'utf8'),
  readFile('app/app/evidencia/page.tsx', 'utf8'),
  readFile('app/evidence/page.tsx', 'utf8'),
  readFile('app/dashboard/page.tsx', 'utf8'),
  readFile('app/dashboard/daily-content.tsx', 'utf8'),
])

assert.match(layout, /resolveAuthenticatedAppAccess/)
assert.match(layout, /getWorkspaceAccess\(admin, userId\)/)
assert.match(layout, /if \(decision\.kind === 'redirect'\) redirect\(decision\.href\)/)
assert.match(layout, /robots:\s*\{\s*index:\s*false/)
assert.match(layout, /<AppNavigation/)

assert.match(indexPage, /redirect\('\/app\/inicio'\)/)

for (const [href, label] of [
  ['/app/inicio', 'Inicio'],
  ['/app/casos', 'Casos'],
  ['/app/documentos', 'Documentos'],
  ['/app/evidencia', 'Evidencia'],
]) {
  assert.match(navigation, new RegExp(`href: '${href.replaceAll('/', '\\/')}'`))
  assert.match(navigation, new RegExp(`label: '${label}'`))
}
assert.doesNotMatch(navigation, /Ejecuciones IA|Workflow/)
assert.match(topNav, /href="\/app\/inicio"/)
assert.doesNotMatch(topNav, />\s*Agentes\s*</)
assert.doesNotMatch(topNav, />\s*Flujos de Trabajo\s*</)
assert.doesNotMatch(topNav, /href="\/dashboard/)

assert.match(homePage, /DailyComplianceContent/)
assert.match(homePage, /Qué necesita tu atención/)
assert.match(casesPage, /CasesPageContent/)
assert.match(legacyCasesPage, /CasesWorkspace/)
assert.match(legacyCasesPage, /getWorkspaceAccess\(createAdminClient\(\), user\.id\)/)
assert.match(legacyCasesPage, /redirect\('\/app\/casos'\)/)
assert.match(caseDetailPage, /redirect\(`\/cases\/\$\{id\}`\)/)
assert.match(documentsPage, /DocumentsPageClient/)
assert.match(legacyDocumentsPage, /redirect\('\/app\/documentos'\)/)
assert.match(evidencePage, /EvidencePageContent/)
assert.match(legacyEvidencePage, /EvidenceWorkspace/)
assert.match(legacyEvidencePage, /getWorkspaceAccess\(createAdminClient\(\), user\.id\)/)
assert.match(legacyEvidencePage, /redirect\('\/app\/evidencia'\)/)
assert.match(legacyDashboardPage, /redirect\('\/app\/inicio'\)/)
assert.match(dailyContent, /getWorkspaceAccess\(admin, user\.id\)/)
assert.doesNotMatch(dailyContent, /\.from\('organization_members'\)/)

console.log('Product workflows phase 1 contract: PASS')
