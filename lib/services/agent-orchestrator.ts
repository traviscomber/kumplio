// KUMPLIO Agent Orchestrator
// Central coordination system for multi-agent workflows

import { createClient } from '@/lib/supabase/client';
import type { AgentId, AgentContext, AgentExecution, AgentWorkflow, WorkflowType } from '@/lib/types/agent-system';

class AgentOrchestrator {
  private supabase = createClient();

  /**
   * Execute a single agent
   */
  async executeAgent(
    agentId: AgentId,
    userId: string,
    input: Record<string, any>,
    documentId?: string,
    workflowId?: string
  ): Promise<AgentExecution> {
    const executionId = crypto.randomUUID();
    const startTime = Date.now();

    try {
      // Create pending execution record
      const { data: execution, error: createError } = await this.supabase
        .from('agent_executions')
        .insert({
          id: executionId,
          agent_id: agentId,
          agent_name: this.getAgentName(agentId),
          user_id: userId,
          document_id: documentId,
          workflow_id: workflowId,
          status: 'running',
          input_data: input,
          retry_count: 0,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Call agent via API
      const response = await this.callAgent(agentId, input, userId);

      // Update execution with results
      const duration = Date.now() - startTime;
      const { error: updateError } = await this.supabase
        .from('agent_executions')
        .update({
          status: 'completed',
          output_data: response.output,
          duration_ms: duration,
          tokens_used: response.tokens_used,
          cost_usd: response.cost_usd,
          model_used: response.model,
          completed_at: new Date().toISOString(),
        })
        .eq('id', executionId);

      if (updateError) throw updateError;

      console.log(`[v0] Agent ${agentId} completed in ${duration}ms`);

      return {
        id: executionId,
        ...execution,
        output_data: response.output,
        duration_ms: duration,
        status: 'completed',
      };
    } catch (error) {
      console.error(`[v0] Agent ${agentId} failed:`, error);

      // Update execution with failure
      await this.supabase
        .from('agent_executions')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString(),
        })
        .eq('id', executionId);

      throw error;
    }
  }

  /**
   * Execute a workflow (multi-agent sequence)
   */
  async executeWorkflow(
    workflowType: WorkflowType,
    userId: string,
    documentId: string,
    agentSequence: AgentId[]
  ): Promise<AgentWorkflow> {
    console.log(`[v0] Starting ${workflowType} workflow with agents:`, agentSequence);

    // Create workflow record
    const workflowId = crypto.randomUUID();
    const { data: workflow, error: workflowError } = await this.supabase
      .from('agent_workflows')
      .insert({
        id: workflowId,
        user_id: userId,
        document_id: documentId,
        workflow_type: workflowType,
        workflow_status: 'running',
        agents_sequence: agentSequence,
        current_step: 0,
        total_steps: agentSequence.length,
      })
      .select()
      .single();

    if (workflowError) throw workflowError;

    // Build context
    const context = await this.buildContext(userId, documentId);
    let currentOutput: Record<string, any> = {};
    let totalActionsCreated = 0;

    try {
      // Execute agents in sequence
      for (let step = 0; step < agentSequence.length; step++) {
        const agentId = agentSequence[step];
        
        // Update workflow step
        await this.supabase
          .from('agent_workflows')
          .update({ current_step: step })
          .eq('id', workflowId);

        // Prepare input for this agent (use output from previous)
        const agentInput = this.prepareAgentInput(agentId, currentOutput, context);

        // Execute agent
        const execution = await this.executeAgent(agentId, userId, agentInput, documentId, workflowId);

        if (!execution.output_data) throw new Error(`Agent ${agentId} produced no output`);

        currentOutput = execution.output_data;

        // If this is Marco (Advisor), create compliance actions
        if (agentId === 'marco' && execution.output_data.recommendations) {
          const actionCount = await this.createActionsFromRecommendations(
            userId,
            documentId,
            execution.output_data.recommendations,
            agentId
          );
          totalActionsCreated += actionCount;
        }
      }

      // Mark workflow as completed
      const { error: completeError } = await this.supabase
        .from('agent_workflows')
        .update({
          workflow_status: 'completed',
          completed_at: new Date().toISOString(),
          final_output: currentOutput,
          total_actions_created: totalActionsCreated,
        })
        .eq('id', workflowId);

      if (completeError) throw completeError;

      console.log(`[v0] Workflow ${workflowId} completed successfully`);

      return {
        ...workflow,
        workflow_status: 'completed',
        final_output: currentOutput,
        total_actions_created: totalActionsCreated,
        completed_at: new Date().toISOString(),
      } as AgentWorkflow;
    } catch (error) {
      console.error(`[v0] Workflow ${workflowId} failed:`, error);

      // Mark as failed
      await this.supabase
        .from('agent_workflows')
        .update({ workflow_status: 'failed' })
        .eq('id', workflowId);

      throw error;
    }
  }

  /**
   * Build shared context for agents
   */
  private async buildContext(userId: string, documentId?: string): Promise<AgentContext> {
    const context: AgentContext = {
      userId,
      documentId,
      currentPhase: 'extraction',
      timestamp: new Date().toISOString(),
    };

    // Load document if provided
    if (documentId) {
      const { data: doc } = await this.supabase
        .from('documents')
        .select('filename, created_at, document_type')
        .eq('id', documentId)
        .single();

      if (doc) {
        context.documentMetadata = {
          filename: doc.filename,
          uploadedAt: doc.created_at,
          documentType: doc.document_type,
        };
      }
    }

    // Load shared memory
    const { data: memories } = await this.supabase
      .from('agent_memory')
      .select('*')
      .eq('user_id', userId);

    if (memories) {
      context.sharedMemory = memories.reduce((acc, mem) => {
        if (!acc[mem.memory_type]) acc[mem.memory_type] = [];
        acc[mem.memory_type].push(mem);
        return acc;
      }, {} as Record<string, any>);
    }

    return context;
  }

  /**
   * Prepare input for agent based on workflow progress
   */
  private prepareAgentInput(
    agentId: AgentId,
    previousOutput: Record<string, any>,
    context: AgentContext
  ): Record<string, any> {
    // Each agent has specific input requirements
    switch (agentId) {
      case 'sofia':
        return { documentText: context.documentMetadata?.filename, documentType: 'contract' };
      case 'elena':
        return { lastCheckDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() };
      case 'bruno':
        return { obligations: previousOutput.obligations || [] };
      case 'marco':
        return { riskAssessment: previousOutput.riskAssessment || [] };
      case 'laura':
        return { complianceActions: [] };
      case 'kai':
        return { outcomes: [] };
      default:
        return {};
    }
  }

  /**
   * Call agent API
   */
  private async callAgent(
    agentId: AgentId,
    input: Record<string, any>,
    userId: string
  ): Promise<{ output: Record<string, any>; tokens_used: number; cost_usd: number; model: string }> {
    const response = await fetch('/api/agents/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId, input, userId }),
    });

    if (!response.ok) {
      throw new Error(`Agent execution failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Create compliance actions from Marco's recommendations
   */
  private async createActionsFromRecommendations(
    userId: string,
    documentId: string,
    recommendations: any[],
    agentId: AgentId
  ): Promise<number> {
    const actions = recommendations.map((rec: any) => ({
      user_id: userId,
      document_id: documentId,
      title: rec.title,
      description: rec.description,
      action_type: rec.actionType,
      priority: rec.priority,
      status: 'pending' as const,
      due_date: rec.targetCompletionDays
        ? new Date(Date.now() + rec.targetCompletionDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : null,
      created_by_agent_id: agentId,
    }));

    const { error } = await this.supabase.from('compliance_actions').insert(actions);

    if (error) {
      console.error('[v0] Failed to create actions:', error);
      return 0;
    }

    return actions.length;
  }

  /**
   * Get agent display name
   */
  private getAgentName(agentId: AgentId): string {
    const names: Record<AgentId, string> = {
      sofia: 'Sofia (Analyzer)',
      elena: 'Elena (Monitor)',
      bruno: 'Bruno (Risk Assessor)',
      marco: 'Marco (Advisor)',
      laura: 'Laura (Auditor)',
      kai: 'Kai (Learner)',
    };
    return names[agentId];
  }
}

export const orchestrator = new AgentOrchestrator();
