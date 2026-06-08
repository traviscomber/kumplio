export const dynamic = 'force-dynamic'

import { AgentDashboard } from '@/components/agents/agent-dashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = {
  title: 'Centro de Control de Agentes - KUMPLIO',
  description: 'Monitorea y gestiona los agentes IA de KUMPLIO para análisis de cumplimiento',
}

export default function AgentsDashboardPage() {
  return (
    <main className="container mx-auto px-6 py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Centro de Control de Agentes</h1>
        <p className="text-lg text-muted-foreground">
          Monitorea tu equipo de agentes IA y ejecuta análisis de cumplimiento en tiempo real
        </p>
      </div>

      <AgentDashboard />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sofia - Analizador de Documentos</CardTitle>
            <CardDescription>Extrae obligaciones y estructura documentos legales</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>Extracción de obligaciones legales</li>
              <li>Identificación de partes interesadas</li>
              <li>Mapeo de cláusulas</li>
              <li>Puntuación de relevancia Ley 21.719</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Elena - Monitor Regulatorio</CardTitle>
            <CardDescription>Rastrea cambios regulatorios y requisitos de cumplimiento</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>Escaneo regulatorio</li>
              <li>Seguimiento de plazos</li>
              <li>Generación de alertas críticas</li>
              <li>Monitoreo de estado Ley 21.719</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bruno - Evaluador de Riesgos</CardTitle>
            <CardDescription>Cuantifica riesgos de cumplimiento y sanciones</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>Cuantificación de riesgos (puntuación 0-100)</li>
              <li>Cálculos de sanciones (UF)</li>
              <li>Análisis de exposición financiera</li>
              <li>Mapeo de probabilidad e impacto</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Marco - Asesor de Cumplimiento</CardTitle>
            <CardDescription>Genera recomendaciones priorizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>Recomendaciones accionables</li>
              <li>Hojas de ruta de implementación</li>
              <li>Estimaciones de recursos</li>
              <li>Métricas de éxito</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Laura - Auditora de Cumplimiento</CardTitle>
            <CardDescription>Verifica estado de cumplimiento y rastrea progreso</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>Verificación de cumplimiento</li>
              <li>Identificación de brechas</li>
              <li>Recopilación de evidencia</li>
              <li>Seguimiento de progreso</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kai - Aprendizaje Continuo</CardTitle>
            <CardDescription>Mejora el sistema basado en resultados</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>Reconocimiento de patrones</li>
              <li>Análisis de tasa de éxito</li>
              <li>Refinamiento de indicaciones</li>
              <li>Mejora del sistema</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cómo funciona el equipo de agentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold">Pipeline de análisis completo (sistema de 6 agentes)</h4>
            <ol className="mt-2 space-y-2 text-sm">
              <li>1. Sofia analiza tu documento → extrae obligaciones</li>
              <li>2. Elena monitorea regulaciones → identifica leyes aplicables</li>
              <li>3. Bruno evalúa riesgos → calcula sanciones y exposición</li>
              <li>4. Marco genera recomendaciones → crea hoja de ruta de implementación</li>
              <li>5. Laura audita cumplimiento → verifica qué se ha realizado</li>
              <li>6. Kai aprende de resultados → mejora análisis futuros</li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold">Escaneo rápido (sistema de 3 agentes)</h4>
            <ol className="mt-2 space-y-2 text-sm">
              <li>1. Sofia extrae obligaciones</li>
              <li>2. Bruno identifica riesgos principales</li>
              <li>3. Marco prioriza acciones</li>
            </ol>
          </div>

          <div className="bg-blue-50 p-3 rounded">
            <p className="text-sm font-semibold text-blue-900">Diseñado para Ley 21.719</p>
            <p className="text-sm text-blue-700">Todos los agentes están especializados en la ley chilena de protección de datos y proporcionan recomendaciones dentro de ese marco legal.</p>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
