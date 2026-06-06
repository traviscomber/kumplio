export const dynamic = 'force-dynamic'

import { AgentDashboard } from '@/components/agents/agent-dashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = {
  title: 'Agent Dashboard - KUMPLIO',
  description: 'Monitor and manage KUMPLIO AI agents for compliance analysis',
}

export default function AgentsDashboardPage() {
  return (
    <main className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Agent Control Center</h1>
        <p className="text-lg text-muted-foreground">
          Monitor your AI agent team and execute compliance analyses in real-time
        </p>
      </div>

      <AgentDashboard />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sofia - Document Analyzer</CardTitle>
            <CardDescription>Extracts obligations and structures legal documents</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>✓ Legal obligation extraction</li>
              <li>✓ Stakeholder identification</li>
              <li>✓ Clause mapping</li>
              <li>✓ Ley 21.719 relevance scoring</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Elena - Regulatory Monitor</CardTitle>
            <CardDescription>Tracks regulatory changes and compliance requirements</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>✓ Regulatory scanning</li>
              <li>✓ Deadline tracking</li>
              <li>✓ Critical alert generation</li>
              <li>✓ Ley 21.719 status monitoring</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bruno - Risk Assessor</CardTitle>
            <CardDescription>Quantifies compliance risks and penalties</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>✓ Risk quantification (0-100 score)</li>
              <li>✓ Penalty calculations (UF)</li>
              <li>✓ Financial exposure analysis</li>
              <li>✓ Probability & impact mapping</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Marco - Compliance Advisor</CardTitle>
            <CardDescription>Generates prioritized recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>✓ Actionable recommendations</li>
              <li>✓ Implementation roadmaps</li>
              <li>✓ Resource estimates</li>
              <li>✓ Success metrics</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Laura - Compliance Auditor</CardTitle>
            <CardDescription>Verifies compliance status and tracks progress</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>✓ Compliance verification</li>
              <li>✓ Gap identification</li>
              <li>✓ Evidence collection</li>
              <li>✓ Progress tracking</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kai - Continuous Learning</CardTitle>
            <CardDescription>Improves system based on outcomes</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>✓ Pattern recognition</li>
              <li>✓ Success rate analysis</li>
              <li>✓ Prompt refinement</li>
              <li>✓ System improvement</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How the Agent Team Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold">Full Analysis Pipeline (6-agent system)</h4>
            <ol className="mt-2 space-y-2 text-sm">
              <li>1. Sofia analyzes your document → extracts obligations</li>
              <li>2. Elena monitors regulations → identifies applicable laws</li>
              <li>3. Bruno assesses risks → calculates penalties & exposure</li>
              <li>4. Marco generates recommendations → creates implementation roadmap</li>
              <li>5. Laura audits compliance → verifies what's been done</li>
              <li>6. Kai learns from results → improves future analyses</li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold">Quick Scan (3-agent system)</h4>
            <ol className="mt-2 space-y-2 text-sm">
              <li>1. Sofia extracts obligations</li>
              <li>2. Bruno identifies top risks</li>
              <li>3. Marco prioritizes actions</li>
            </ol>
          </div>

          <div className="bg-blue-50 p-3 rounded">
            <p className="text-sm font-semibold text-blue-900">Designed for Ley 21.719</p>
            <p className="text-sm text-blue-700">All agents are specialized in Chilean data protection law and provide recommendations within that legal framework.</p>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
