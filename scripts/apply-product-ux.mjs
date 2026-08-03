import { readFile, writeFile } from 'node:fs/promises'

const dashboardPath = 'app/dashboard/content.tsx'
let dashboard = await readFile(dashboardPath, 'utf8')

dashboard = dashboard.replace("import { OnboardingFlow } from '@/components/onboarding/onboarding-flow'\n", '')
dashboard = dashboard.replace("  const [showOnboarding, setShowOnboarding] = useState(false)\n", '')

const oldMembership = `        if (!membership?.organization_id) {
          const { data: documents } = await supabase.from('documents').select('id').eq('user_id', auth.user.id).limit(1)
          setShowOnboarding(!documents?.length)
          if (documents?.length) setWarning('Tu cuenta todavía no está vinculada a una organización.')
          return
        }
`
const newMembership = `        if (!membership?.organization_id) {
          window.location.href = '/onboarding'
          return
        }
`
if (!dashboard.includes(oldMembership)) throw new Error('No se encontró el bloque de membresía del dashboard')
dashboard = dashboard.replace(oldMembership, newMembership)

const oldOnboarding = `  if (showOnboarding) {
    return (
      <div className="space-y-8">
        <div>
          <p className="text-sm font-semibold text-primary">Comienza con contexto real</p>
          <h1 className="mt-2 text-3xl font-bold">Prepara tu primera misión</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Carga una fuente regulatoria, contrato o política para que Kumplio comprenda tu organización.
          </p>
        </div>
        <OnboardingFlow onComplete={() => (window.location.href = '/dashboard')} />
      </div>
    )
  }

`
if (!dashboard.includes(oldOnboarding)) throw new Error('No se encontró el onboarding alternativo del dashboard')
dashboard = dashboard.replace(oldOnboarding, '')
await writeFile(dashboardPath, dashboard)

const analyticsPath = 'app/analytics/client.tsx'
let analytics = await readFile(analyticsPath, 'utf8')
analytics = analytics.replace("import { TopNav } from '@/components/layout/top-nav';", "import { WorkspaceNav } from '@/components/workspace-nav';")
analytics = analytics.replaceAll('<TopNav />', '<WorkspaceNav />')
analytics = analytics.replace('<h1 className="text-3xl font-bold mb-2">Analytics</h1>', '<h1 className="text-3xl font-bold mb-2">Análisis</h1>')
analytics = analytics.replace('Dashboard de cumplimiento y análisis de riesgos', 'Indicadores de cumplimiento, riesgos y desempeño operativo')
await writeFile(analyticsPath, analytics)
