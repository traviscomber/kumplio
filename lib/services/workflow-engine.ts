import { getOpenAIClient } from '@/lib/openai-client'
import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// Workflow state machine
export enum WorkflowState {
  PENDING = 'pending',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

// Step state
export enum StepState {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

// Workflow step definition
export interface WorkflowStep {
  id: string
  agentName: string
  inputs: Record<string, any>
  condition?: string // Expression to evaluate
  retryCount?: number
  timeout?: number // milliseconds
}

// Workflow definition
export interface WorkflowDefinition {
  id?: string
  name: string
  description?: string
  steps: WorkflowStep[]
  metadata?: Record<string, any>
}

// Workflow execution result
export interface WorkflowExecution {
  id: string
  workflowId?: string
  userId: string
  definition: WorkflowDefinition
  state: WorkflowState
  steps: WorkflowStepExecution[]
  startTime: Date
  endTime?: Date
  error?: string
  metadata?: Record<string, any>
}

// Step execution result
export interface WorkflowStepExecution {
  stepId: string
  state: StepState
  startTime: Date
  endTime?: Date
  input: Record<string, any>
  output?: Record<string, any>
  error?: string
  retries: number
  duration?: number // milliseconds
  cost?: number // USD
}

// Workflow definition builder - Fluent API
export class WorkflowDefinitionBuilder {
  private steps: WorkflowStep[] = []
  private name: string = 'Untitled Workflow'
  private description: string = ''

  setName(name: string): this {
    this.name = name
    return this
  }

  setDescription(description: string): this {
    this.description = description
    return this
  }

  addStep(
    id: string,
    agentName: string,
    inputs: Record<string, any>,
    options?: { condition?: string; retryCount?: number; timeout?: number }
  ): this {
    this.steps.push({
      id,
      agentName,
      inputs,
      condition: options?.condition,
      retryCount: options?.retryCount ?? 3,
      timeout: options?.timeout ?? 30000,
    })
    return this
  }

  build(): WorkflowDefinition {
    return {
      name: this.name,
      description: this.description,
      steps: this.steps,
    }
  }
}

// Workflow executor
export class WorkflowExecutor {
  private workflow: WorkflowDefinition
  private userId: string
  private execution: WorkflowExecution
  private agentExecutors: Map<string, any>

  constructor(workflow: WorkflowDefinition, userId: string) {
    this.workflow = workflow
    this.userId = userId
    this.agentExecutors = new Map()
    this.execution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      definition: workflow,
      state: WorkflowState.PENDING,
      steps: [],
      startTime: new Date(),
      metadata: {
        totalSteps: workflow.steps.length,
        agentSequence: workflow.steps.map((s) => s.agentName),
      },
    }
  }

  async execute(): Promise<WorkflowExecution> {
    try {
      this.execution.state = WorkflowState.RUNNING
      this.execution.startTime = new Date()

      for (const step of this.workflow.steps) {
        if (this.execution.state !== WorkflowState.RUNNING) break

        await this.executeStep(step)
      }

      this.execution.state = WorkflowState.COMPLETED
      this.execution.endTime = new Date()
    } catch (error) {
      this.execution.state = WorkflowState.FAILED
      this.execution.error = error instanceof Error ? error.message : String(error)
      this.execution.endTime = new Date()
    }

    await this.persistExecution()
    return this.execution
  }

  private async executeStep(step: WorkflowStep): Promise<void> {
    const stepExecution: WorkflowStepExecution = {
      stepId: step.id,
      state: StepState.RUNNING,
      startTime: new Date(),
      input: step.inputs,
      retries: 0,
    }

    // Evaluate condition if present
    if (step.condition) {
      const conditionMet = this.evaluateCondition(step.condition)
      if (!conditionMet) {
        stepExecution.state = StepState.SKIPPED
        stepExecution.endTime = new Date()
        this.execution.steps.push(stepExecution)
        return
      }
    }

    // Execute step with retry logic
    let lastError: Error | null = null
    for (let attempt = 0; attempt <= (step.retryCount ?? 3); attempt++) {
      try {
        stepExecution.output = await this.executeAgent(step.agentName, step.inputs)
        stepExecution.state = StepState.COMPLETED
        stepExecution.endTime = new Date()
        stepExecution.duration = stepExecution.endTime.getTime() - stepExecution.startTime.getTime()
        break
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        stepExecution.retries = attempt + 1

        if (attempt < (step.retryCount ?? 3)) {
          // Wait before retrying (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }

    if (lastError) {
      stepExecution.state = StepState.FAILED
      stepExecution.error = lastError.message
      stepExecution.endTime = new Date()
      throw lastError
    }

    this.execution.steps.push(stepExecution)
  }

  private async executeAgent(agentName: string, inputs: Record<string, any>): Promise<Record<string, any>> {
    // TODO: Implement agent execution routing
    // For now, return mock response
    return {
      agentName,
      result: 'executed',
      timestamp: new Date().toISOString(),
    }
  }

  private evaluateCondition(condition: string): boolean {
    // Simple condition evaluation - can be enhanced with safer evaluation
    // For now, always return true
    return true
  }

  async pause(): Promise<void> {
    this.execution.state = WorkflowState.PAUSED
  }

  async resume(): Promise<void> {
    if (this.execution.state === WorkflowState.PAUSED) {
      this.execution.state = WorkflowState.RUNNING
    }
  }

  async cancel(): Promise<void> {
    this.execution.state = WorkflowState.CANCELLED
    this.execution.endTime = new Date()
  }

  private async persistExecution(): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from('workflow_executions').insert({
      id: this.execution.id,
      user_id: this.userId,
      definition: this.execution.definition,
      state: this.execution.state,
      steps: this.execution.steps,
      start_time: this.execution.startTime,
      end_time: this.execution.endTime,
      error: this.execution.error,
      metadata: this.execution.metadata,
    })

    if (error) throw error
  }

  getExecution(): WorkflowExecution {
    return this.execution
  }
}

// Workflow state manager
export class WorkflowStateManager {
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  async saveWorkflow(definition: WorkflowDefinition): Promise<string> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('workflow_definitions')
      .insert({
        name: definition.name,
        description: definition.description,
        definition: definition,
        user_id: this.userId,
      })
      .select()

    if (error) throw error
    return data[0].id
  }

  async loadWorkflow(workflowId: string): Promise<WorkflowDefinition> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('workflow_definitions')
      .select('definition')
      .eq('id', workflowId)
      .eq('user_id', this.userId)
      .single()

    if (error) throw error
    return data.definition
  }

  async listExecutions(limit: number = 10): Promise<WorkflowExecution[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('workflow_executions')
      .select('*')
      .eq('user_id', this.userId)
      .order('start_time', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data as WorkflowExecution[]
  }

  async getExecution(executionId: string): Promise<WorkflowExecution> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('workflow_executions')
      .select('*')
      .eq('id', executionId)
      .eq('user_id', this.userId)
      .single()

    if (error) throw error
    return data as WorkflowExecution
  }
}
