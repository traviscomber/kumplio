-- KUMPLIO Agent System Database Schema
-- Comprehensive agent infrastructure for autonomous compliance management

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Agent Executions: Track all agent runs and their outputs
CREATE TABLE IF NOT EXISTS agent_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id VARCHAR(50) NOT NULL, -- sofia, elena, bruno, marco, laura, kai
  agent_name VARCHAR(100) NOT NULL,
  document_id UUID,
  user_id UUID NOT NULL,
  
  -- Execution metadata
  status VARCHAR(20) NOT NULL, -- pending, running, completed, failed, retrying
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration_ms INTEGER,
  
  -- Input and output
  input_data JSONB NOT NULL, -- What was sent to the agent
  output_data JSONB, -- What the agent returned
  error_message TEXT,
  
  -- Performance tracking
  tokens_used INTEGER,
  cost_usd DECIMAL(10, 6),
  model_used VARCHAR(100),
  
  -- Context and metadata
  workflow_id VARCHAR(100), -- Links to parent workflow
  retry_count INTEGER DEFAULT 0,
  parent_execution_id UUID, -- For chained executions
  
  CONSTRAINT fk_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_parent FOREIGN KEY (parent_execution_id) REFERENCES agent_executions(id) ON DELETE SET NULL
);

-- Compliance Actions: Track execution of recommendations
CREATE TABLE IF NOT EXISTS compliance_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  document_id UUID,
  
  -- Action details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  action_type VARCHAR(50) NOT NULL, -- deadline, risk_mitigation, process_change, documentation
  priority VARCHAR(20) NOT NULL, -- critical, high, medium, low
  
  -- Status tracking
  status VARCHAR(20) NOT NULL, -- pending, in_progress, completed, overdue, dismissed
  due_date DATE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  
  -- Compliance reference
  ley_article VARCHAR(50), -- E.g. "21.719 Art. 5"
  penalty_uf_min INTEGER,
  penalty_uf_max INTEGER,
  
  -- Assignment
  assigned_to_user_id UUID,
  assigned_at TIMESTAMP,
  
  -- Source
  created_by_agent_id VARCHAR(50), -- Which agent suggested this
  recommendation_id UUID, -- Link to original recommendation
  
  -- Notes and updates
  notes TEXT,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL,
  CONSTRAINT fk_assigned_to FOREIGN KEY (assigned_to_user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Agent Learning: Track outcomes to improve recommendations
CREATE TABLE IF NOT EXISTS agent_learning_outcomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Link to original action
  compliance_action_id UUID NOT NULL,
  agent_id VARCHAR(50) NOT NULL,
  
  -- Outcome metrics
  was_executed BOOLEAN NOT NULL, -- Did user follow the recommendation?
  completion_time_days INTEGER,
  execution_quality DECIMAL(3, 2), -- 0.0 to 1.0 score
  
  -- Feedback
  user_feedback TEXT,
  effectiveness_rating INTEGER, -- 1-5 scale
  
  -- Follow-up risks
  follow_up_risks_identified TEXT,
  new_actions_created INTEGER DEFAULT 0,
  
  -- Timestamp
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_action FOREIGN KEY (compliance_action_id) REFERENCES compliance_actions(id) ON DELETE CASCADE
);

-- Regulatory Changes: Track updates to regulations for Elena agent
CREATE TABLE IF NOT EXISTS regulatory_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Change metadata
  regulation_name VARCHAR(255) NOT NULL,
  ley_article VARCHAR(50), -- E.g. "21.719 Art. 5"
  change_type VARCHAR(50) NOT NULL, -- new_obligation, penalty_update, deadline_change, new_regulation
  
  -- Change details
  description TEXT NOT NULL,
  impact_summary TEXT,
  implementation_date DATE,
  
  -- For affected users
  affected_users_count INTEGER DEFAULT 0,
  alert_sent BOOLEAN DEFAULT FALSE,
  alert_sent_at TIMESTAMP,
  
  -- Source and tracking
  source_url VARCHAR(500),
  source_type VARCHAR(50), -- gobierno.cl, diariooficial, other
  discovered_at TIMESTAMP NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMP,
  
  -- Vector embedding for similarity search
  change_embedding vector(1536),
  
  CONSTRAINT unique_regulation_date UNIQUE (regulation_name, implementation_date, change_type)
);

-- Agent Memory: Shared context across agent executions
CREATE TABLE IF NOT EXISTS agent_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  document_id UUID,
  
  -- Memory types
  memory_type VARCHAR(50) NOT NULL, -- risk_pattern, obligation_pattern, company_context, user_preference
  memory_key VARCHAR(255) NOT NULL,
  memory_value JSONB NOT NULL,
  
  -- Confidence and decay
  confidence_score DECIMAL(3, 2), -- 0.0 to 1.0
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMP,
  usage_count INTEGER DEFAULT 0,
  
  -- Expiration for time-sensitive data
  expires_at TIMESTAMP,
  
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL,
  CONSTRAINT unique_memory UNIQUE (user_id, memory_type, memory_key)
);

-- Agent Workflows: Orchestrate multi-agent sequences
CREATE TABLE IF NOT EXISTS agent_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  document_id UUID NOT NULL,
  
  -- Workflow definition
  workflow_type VARCHAR(50) NOT NULL, -- document_analysis, daily_monitoring, risk_assessment, compliance_audit
  workflow_status VARCHAR(20) NOT NULL, -- scheduled, running, completed, failed, paused
  
  -- Execution tracking
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Agent sequence
  agents_sequence TEXT[] NOT NULL, -- ['sofia', 'bruno', 'marco']
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER NOT NULL,
  
  -- Results
  final_output JSONB,
  total_actions_created INTEGER DEFAULT 0,
  
  -- Configuration
  auto_repeat BOOLEAN DEFAULT FALSE,
  repeat_interval VARCHAR(50), -- daily, weekly, monthly
  next_scheduled_run TIMESTAMP,
  
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_executions_user ON agent_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_executions_status ON agent_executions(status);
CREATE INDEX IF NOT EXISTS idx_agent_executions_agent_id ON agent_executions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_executions_created ON agent_executions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_compliance_actions_user ON compliance_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_actions_status ON compliance_actions(status);
CREATE INDEX IF NOT EXISTS idx_compliance_actions_due_date ON compliance_actions(due_date);
CREATE INDEX IF NOT EXISTS idx_compliance_actions_priority ON compliance_actions(priority);

CREATE INDEX IF NOT EXISTS idx_regulatory_changes_ley ON regulatory_changes(ley_article);
CREATE INDEX IF NOT EXISTS idx_regulatory_changes_discovery ON regulatory_changes(discovered_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_memory_user ON agent_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_memory_type ON agent_memory(memory_type);
CREATE INDEX IF NOT EXISTS idx_agent_memory_confidence ON agent_memory(confidence_score DESC);

CREATE INDEX IF NOT EXISTS idx_workflows_user ON agent_workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON agent_workflows(workflow_status);
CREATE INDEX IF NOT EXISTS idx_workflows_next_run ON agent_workflows(next_scheduled_run);

-- Enable RLS for all tables
ALTER TABLE agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_learning_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_workflows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agent_executions
CREATE POLICY agent_executions_user_isolation ON agent_executions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY agent_executions_user_insert ON agent_executions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for compliance_actions
CREATE POLICY compliance_actions_user_isolation ON compliance_actions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY compliance_actions_user_insert ON compliance_actions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for agent_memory
CREATE POLICY agent_memory_user_isolation ON agent_memory
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY agent_memory_user_insert ON agent_memory
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for agent_workflows
CREATE POLICY agent_workflows_user_isolation ON agent_workflows
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY agent_workflows_user_insert ON agent_workflows
  FOR INSERT WITH CHECK (auth.uid() = user_id);
