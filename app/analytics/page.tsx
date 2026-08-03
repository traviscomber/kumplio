import type { Metadata } from 'next'
import AnalyticsDashboardClient from './client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Análisis',
  description: 'Indicadores privados de cumplimiento, riesgos, documentos y desempeño operativo de la organización.',
  robots: { index: false, follow: false },
}

export default function AnalyticsDashboardPage() {
  return <AnalyticsDashboardClient />
}
