// KUMPLIO Agent System Types
// Complete type definitions for multi-agent compliance system

export type AgentId = 'sofia' | 'elena' | 'bruno' | 'marco' | 'laura' | 'kai';

export type AgentStatus = 'pending' | 'running' | 'completed' | 'failed' | 'retrying';
export type ActionStatus = 'pending' | 'in_progress' | 'completed' | 'overdue' | 'dismissed';
export type ActionType = 'deadline' | 'risk_mitigation' | 'process_change' | 'documentation';
export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type WorkflowType = 'document_analysis' | 'daily_monitoring' | 'risk_assessment' | 'compliance_audit';
export type WorkflowStatus = 'scheduled' | 'running' | 'completed' | 'failed' | 'paused';

// Agent Execution Record
export interface AgentExecution {
  id: string;
  agent_id: AgentId;
  agent_name: string;
  document_id?: string;
  user_id: string;
  
  status: AgentStatus;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
  
  input_data: Record<string, any>;
  output_data?: Record<string, any>;
  error_message?: string;
  
  tokens_used?: number;
  cost_usd?: number;
  model_used?: string;
  
  workflow_id?: string;
  retry_count: number;
  parent_execution_id?: string;
}

// Compliance Action Record
export interface ComplianceAction {
  id: string;
  user_id: string;
  document_id?: string;
  
  title: string;
  description?: string;
  action_type: ActionType;
  priority: Priority;
  
  status: ActionStatus;
  due_date?: string;
  created_at: string;
  completed_at?: string;
  
  ley_article?: string;
  penalty_uf_min?: number;
  penalty_uf_max?: number;
  
  assigned_to_user_id?: string;
  assigned_at?: string;
  
  created_by_agent_id?: AgentId;
  recommendation_id?: string;
  
  notes?: string;
  updated_at: string;
}

// Agent Learning Outcome
export interface AgentLearningOutcome {
  id: string;
  compliance_action_id: string;
  agent_id: AgentId;
  
  was_executed: boolean;
  completion_time_days?: number;
  execution_quality?: number;
  
  user_feedback?: string;
  effectiveness_rating?: number;
  follow_up_risks_identified?: string;
  new_actions_created: number;
  
  created_at: string;
}

// Regulatory Change
export interface RegulatoryChange {
  id: string;
  regulation_name: string;
  ley_article?: string;
  change_type: 'new_obligation' | 'penalty_update' | 'deadline_change' | 'new_regulation';
  
  description: string;
  impact_summary?: string;
  implementation_date?: string;
  
  affected_users_count: number;
  alert_sent: boolean;
  alert_sent_at?: string;
  
  source_url?: string;
  source_type: 'gobierno.cl' | 'diariooficial' | 'other';
  discovered_at: string;
  verified_at?: string;
}

// Agent Memory
export interface AgentMemory {
  id: string;
  user_id: string;
  document_id?: string;
  
  memory_type: 'risk_pattern' | 'obligation_pattern' | 'company_context' | 'user_preference';
  memory_key: string;
  memory_value: Record<string, any>;
  
  confidence_score: number;
  created_at: string;
  last_used_at?: string;
  usage_count: number;
  expires_at?: string;
}

// Workflow Definition
export interface AgentWorkflow {
  id: string;
  user_id: string;
  document_id: string;
  
  workflow_type: WorkflowType;
  workflow_status: WorkflowStatus;
  
  created_at: string;
  started_at?: string;
  completed_at?: string;
  
  agents_sequence: AgentId[];
  current_step: number;
  total_steps: number;
  
  final_output?: Record<string, any>;
  total_actions_created: number;
  
  auto_repeat: boolean;
  repeat_interval?: 'daily' | 'weekly' | 'monthly';
  next_scheduled_run?: string;
}

// Agent Context - Shared state for all agents
export interface AgentContext {
  userId: string;
  documentId?: string;
  workflowId?: string;
  
  // Document content and analysis
  documentText?: string;
  documentMetadata?: {
    filename: string;
    uploadedAt: string;
    documentType: string;
  };
  
  // Extracted obligations and risks
  extractedObligations?: Array<{
    text: string;
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    dueDate?: string;
  }>;
  
  identifiedRisks?: Array<{
    description: string;
    probability: number;
    impact: number;
    penaltyUF?: number;
  }>;
  
  // Previous actions and outcomes
  previousActions?: ComplianceAction[];
  learningOutcomes?: AgentLearningOutcome[];
  
  // Memory and patterns
  sharedMemory?: Record<string, AgentMemory[]>;
  
  // Current state
  currentPhase: 'extraction' | 'analysis' | 'recommendation' | 'execution' | 'monitoring';
  timestamp: string;
}

// Agent Input/Output Schemas

// Sofia (Analyzer) - Extracts obligations
export interface SofiaInput {
  documentText: string;
  documentType: string;
  previousExtractions?: any[];
}

export interface SofiaOutput {
  obligations: Array<{
    id: string;
    text: string;
    type: ActionType;
    severity: Priority;
    dueDate?: string;
    legalBasis?: string;
    potentialPenalty?: { min: number; max: number; unit: string };
  }>;
  summary: string;
  confidence: number;
  warnings?: string[];
}

// Elena (Monitor) - Tracks regulatory changes
export interface ElenaInput {
  lastCheckDate?: string;
  focusAreas?: string[];
  userPreferences?: Record<string, any>;
}

export interface ElenaOutput {
  regulatoryChanges: RegulatoryChange[];
  affectedObligations?: string[];
  requiresImmediateAction: boolean;
  recommendations: string[];
}

// Bruno (Risk Assessor) - Analyzes risks
export interface BrunoInput {
  obligations: SofiaOutput['obligations'];
  complianceActions?: ComplianceAction[];
  historicalOutcomes?: AgentLearningOutcome[];
}

export interface BrunoOutput {
  riskAssessment: Array<{
    obligationId: string;
    riskLevel: 'critical' | 'high' | 'medium' | 'low';
    riskFactors: string[];
    estimatedImpact: number;
    estimatedProbability: number;
    potentialPenalty: { min: number; max: number };
    complianceGap: string;
  }>;
  topRisks: string[];
  immediateActionsNeeded: boolean;
}

// Marco (Advisor) - Generates recommendations
export interface MarcoInput {
  riskAssessment: BrunoOutput['riskAssessment'];
  userContext?: Record<string, any>;
  previousRecommendations?: ComplianceAction[];
}

export interface MarcoOutput {
  recommendations: Array<{
    title: string;
    description: string;
    priority: Priority;
    actionType: ActionType;
    estimatedEffort: string;
    targetCompletionDays: number;
    successCriteria: string[];
    resources: string[];
  }>;
  executionStrategy: string;
  estimatedImprovementScore: number;
}

// Laura (Auditor) - Tracks execution
export interface LauraInput {
  complianceActions: ComplianceAction[];
  targetDate?: string;
}

export interface LauraOutput {
  executionStatus: {
    totalActions: number;
    completed: number;
    inProgress: number;
    overdue: number;
    dismissedWithReason: number;
  };
  complianceScore: number;
  riskReduction: number;
  nextActionsNeeded: string[];
  recommendations: string[];
}

// Kai (Learner) - Improves from outcomes
export interface KaiInput {
  outcomes: AgentLearningOutcome[];
  successfulPatterns?: Record<string, any>;
  failurePatterns?: Record<string, any>;
}

export interface KaiOutput {
  patterns: Array<{
    pattern: string;
    successRate: number;
    affectedActions: number;
    recommendations: string[];
  }>;
  updatedMemory: Record<string, any>;
  nextIterationImprovement: string;
}

// Agent Configuration
export interface AgentConfig {
  id: AgentId;
  name: string;
  description: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  tools: string[];
  maxRetries: number;
  timeout: number;
}

// Batch execution for multi-agent workflows
export interface BatchExecution {
  workflowId: string;
  agents: AgentId[];
  parallel: boolean;
  context: AgentContext;
  timeout: number;
}
