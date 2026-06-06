import { sofiaAnalyzeDocument, sofiaExtractObligations } from './sofia-analyzer'
import { elenaMonitorRegulations, elenaCheckLey21719Compliance } from './elena-monitor'
import { brunoAssessRisks, brunoCalculatePenalties } from './bruno-risk'
import { marcoGenerateRecommendations, marcoPrioritizeActions } from './marco-advisor'
import { lauraAuditCompliance, lauraTrackProgress } from './laura-auditor'
import { kaiAnalyzeLearnings, kaiRefinePrompt } from './kai-learner'
import { AgentExecution } from '@/lib/types/agent-system'

export interface CompliancePipeline {
  documentContent: string
  organizationType: string
  runFullAnalysis(): Promise<CompliancePipelineResult>
  runQuickScan(): Promise<QuickScanResult>
}

export interface CompliancePipelineResult {
  document: AgentExecution<any>
  regulatory: AgentExecution<any>
  risks: AgentExecution<any>
  recommendations: AgentExecution<any>
  audit: AgentExecution<any>
  learning: AgentExecution<any>
  totalCost: number
  totalTimeMs: number
}

export interface QuickScanResult {
  document: AgentExecution<any>
  risks: AgentExecution<any>
  topRecommendations: string[]
  totalCost: number
  totalTimeMs: number
}

/**
 * KUMPLIO Agent Coordinator
 * Orchestrates 6 specialized AI agents to perform comprehensive compliance analysis
 *
 * Agent Team:
 * - Sofia (Analyzer): Extract obligations from documents
 * - Elena (Monitor): Track regulatory changes
 * - Bruno (Risk): Assess compliance risks
 * - Marco (Advisor): Generate recommendations
 * - Laura (Auditor): Verify compliance
 * - Kai (Learner): Improve system continuously
 */

export class KumpioAgentCoordinator {
  private documentContent: string
  private organizationType: string

  constructor(documentContent: string, organizationType: string) {
    this.documentContent = documentContent
    this.organizationType = organizationType
  }

  /**
   * Full compliance analysis pipeline
   * 1. Sofia analyzes document and extracts obligations
   * 2. Elena checks regulatory updates
   * 3. Bruno assesses compliance risks
   * 4. Marco generates prioritized recommendations
   * 5. Laura audits current compliance status
   * 6. Kai learns from results for continuous improvement
   */
  async runFullAnalysis(): Promise<CompliancePipelineResult> {
    const startTime = Date.now()

    console.log('[KUMPLIO] Starting full compliance analysis pipeline')

    try {
      // Step 1: Sofia analyzes the document
      console.log('[Sofia] Analyzing document...')
      const sofiaAnalysis = await sofiaAnalyzeDocument(this.documentContent, {
        type: 'compliance-document',
      })

      if (sofiaAnalysis.status === 'error') {
        throw new Error(`Sofia analysis failed: ${sofiaAnalysis.error}`)
      }

      // Step 2: Elena monitors regulatory changes
      console.log('[Elena] Monitoring regulatory landscape...')
      const elenaRegulatory = await elenaCheckLey21719Compliance(
        this.organizationType,
        sofiaAnalysis.output?.obligations?.map((o) => o.title) || []
      )

      // Step 3: Bruno assesses risks
      console.log('[Bruno] Assessing compliance risks...')
      const brunoRisks = await brunoAssessRisks(
        elenaRegulatory.output?.map((u) => u.title) || [],
        this.organizationType,
        sofiaAnalysis.output?.obligations?.map((o) => o.description) || []
      )

      // Step 4: Marco generates recommendations
      console.log('[Marco] Generating recommendations...')
      const marcoRecommendations = await marcoGenerateRecommendations(
        JSON.stringify(brunoRisks.output || {}),
        this.organizationType
      )

      // Step 5: Laura performs audit
      console.log('[Laura] Auditing compliance status...')
      const lauraAudit = await lauraAuditCompliance(
        (marcoRecommendations.output?.recommendations || []).map((r) => ({
          action: r.title,
          evidence: r.description,
        })),
        (sofiaAnalysis.output?.obligations || []).map((o) => o.title)
      )

      // Step 6: Kai learns from results
      console.log('[Kai] Analyzing patterns for continuous improvement...')
      const kaiLearning = await kaiAnalyzeLearnings(
        [
          { agentName: 'Sofia', status: sofiaAnalysis.status as any },
          { agentName: 'Elena', status: elenaRegulatory.status as any },
          { agentName: 'Bruno', status: brunoRisks.status as any },
          { agentName: 'Marco', status: marcoRecommendations.status as any },
          { agentName: 'Laura', status: lauraAudit.status as any },
        ],
        (lauraAudit.output?.findings || []).map((f) => ({
          category: f.requirement,
          status: f.status,
          gaps: f.gaps,
        }))
      )

      const totalTimeMs = Date.now() - startTime
      const totalCost = this.calculateCost([
        sofiaAnalysis,
        elenaRegulatory,
        brunoRisks,
        marcoRecommendations,
        lauraAudit,
        kaiLearning,
      ])

      console.log(`[KUMPLIO] Analysis complete in ${totalTimeMs}ms, cost: $${totalCost.toFixed(4)}`)

      return {
        document: sofiaAnalysis,
        regulatory: elenaRegulatory,
        risks: brunoRisks,
        recommendations: marcoRecommendations,
        audit: lauraAudit,
        learning: kaiLearning,
        totalCost,
        totalTimeMs,
      }
    } catch (error) {
      console.error('[KUMPLIO] Pipeline error:', error)
      throw error
    }
  }

  /**
   * Quick scan - faster analysis with key agent
   * 1. Sofia extracts obligations
   * 2. Bruno assesses top risks
   * 3. Marco prioritizes actions
   */
  async runQuickScan(): Promise<QuickScanResult> {
    const startTime = Date.now()

    console.log('[KUMPLIO] Starting quick scan')

    try {
      // Step 1: Sofia analyzes
      const sofiaAnalysis = await sofiaAnalyzeDocument(this.documentContent)

      if (sofiaAnalysis.status === 'error') {
        throw new Error(`Sofia analysis failed: ${sofiaAnalysis.error}`)
      }

      // Step 2: Bruno assesses risks
      const brunoRisks = await brunoAssessRisks(
        (sofiaAnalysis.output?.obligations || []).map((o) => o.description),
        this.organizationType
      )

      // Step 3: Marco prioritizes
      const topRisks = (brunoRisks.output?.risks || [])
        .filter((r) => r.probability === 'high')
        .slice(0, 5)
        .map((r) => r.title)

      const marcoActions = await marcoPrioritizeActions(topRisks)

      const totalTimeMs = Date.now() - startTime
      const totalCost = this.calculateCost([sofiaAnalysis, brunoRisks, marcoActions])

      console.log(`[KUMPLIO] Quick scan complete in ${totalTimeMs}ms`)

      return {
        document: sofiaAnalysis,
        risks: brunoRisks,
        topRecommendations: (marcoActions.output as string[]) || [],
        totalCost,
        totalTimeMs,
      }
    } catch (error) {
      console.error('[KUMPLIO] Quick scan error:', error)
      throw error
    }
  }

  private calculateCost(executions: any[]): number {
    const CLAUDE_INPUT_COST = 0.003 / 1000 // $0.003 per 1M tokens
    const CLAUDE_OUTPUT_COST = 0.015 / 1000 // $0.015 per 1M tokens

    return executions.reduce((total, execution) => {
      if (execution.tokensUsed) {
        const inputCost = execution.tokensUsed.input * CLAUDE_INPUT_COST
        const outputCost = execution.tokensUsed.output * CLAUDE_OUTPUT_COST
        return total + inputCost + outputCost
      }
      return total
    }, 0)
  }
}

/**
 * Create a compliance pipeline for a document
 */
export async function createCompliancePipeline(
  documentContent: string,
  organizationType: string = 'empresa'
): Promise<CompliancePipelineResult> {
  const coordinator = new KumpioAgentCoordinator(documentContent, organizationType)
  return coordinator.runFullAnalysis()
}

/**
 * Run a quick scan on a document
 */
export async function runQuickCompliacneScan(
  documentContent: string,
  organizationType: string = 'empresa'
): Promise<QuickScanResult> {
  const coordinator = new KumpioAgentCoordinator(documentContent, organizationType)
  return coordinator.runQuickScan()
}
