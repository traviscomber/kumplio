-- Phase 4: Workflow Engine Database Schema
-- Setup tables for workflow definitions, executions, and monitoring

-- 1. Workflow Definitions table
CREATE TABLE IF NOT EXISTS workflow_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  definition JSONB NOT NULL,
  is_template BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- 2. Workflow Executions table
CREATE TABLE IF NOT EXISTS workflow_executions (
  id VARCHAR(50) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workflow_id UUID REFERENCES workflow_definitions(id) ON DELETE SET NULL,
  definition JSONB NOT NULL,
  state VARCHAR(20) NOT NULL DEFAULT 'pending',
  steps JSONB NOT NULL DEFAULT '[]',
  start_time TIMESTAMP NOT NULL DEFAULT NOW(),
  end_time TIMESTAMP,
  error TEXT,
  metadata JSONB,
  total_cost NUMERIC(10, 4) DEFAULT 0.00,
  duration_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Workflow Step Results table
CREATE TABLE IF NOT EXISTS workflow_step_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id VARCHAR(50) NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
  step_id VARCHAR(100) NOT NULL,
  agent_name VARCHAR(100) NOT NULL,
  state VARCHAR(20) NOT NULL DEFAULT 'pending',
  input JSONB NOT NULL,
  output JSONB,
  error TEXT,
  retries INTEGER DEFAULT 0,
  start_time TIMESTAMP NOT NULL DEFAULT NOW(),
  end_time TIMESTAMP,
  duration_ms INTEGER,
  cost NUMERIC(10, 4) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Workflow Errors table
CREATE TABLE IF NOT EXISTS workflow_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id VARCHAR(50) NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
  step_id VARCHAR(100),
  error_type VARCHAR(100) NOT NULL,
  error_message TEXT NOT NULL,
  retry_count INTEGER DEFAULT 0,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Workflow Schedules table
CREATE TABLE IF NOT EXISTS workflow_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  cron_expression VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_run_at TIMESTAMP,
  next_run_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. Workflow Templates table
CREATE TABLE IF NOT EXISTS workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  definition JSONB NOT NULL,
  icon VARCHAR(50),
  category VARCHAR(100),
  tags VARCHAR(255)[] DEFAULT ARRAY[]::varchar[],
  is_official BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  usage_count INTEGER DEFAULT 0
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_user_id ON workflow_definitions(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_user_id ON workflow_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_state ON workflow_executions(state);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_created_at ON workflow_executions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_step_results_execution_id ON workflow_step_results(execution_id);
CREATE INDEX IF NOT EXISTS idx_workflow_step_results_agent_name ON workflow_step_results(agent_name);
CREATE INDEX IF NOT EXISTS idx_workflow_errors_execution_id ON workflow_errors(execution_id);
CREATE INDEX IF NOT EXISTS idx_workflow_schedules_user_id ON workflow_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_schedules_next_run_at ON workflow_schedules(next_run_at);

-- Row Level Security (RLS) Policies

-- Workflow Definitions RLS
ALTER TABLE workflow_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workflow definitions" 
  ON workflow_definitions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create workflow definitions"
  ON workflow_definitions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workflow definitions"
  ON workflow_definitions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workflow definitions"
  ON workflow_definitions FOR DELETE
  USING (auth.uid() = user_id);

-- Workflow Executions RLS
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workflow executions"
  ON workflow_executions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create workflow executions"
  ON workflow_executions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workflow executions"
  ON workflow_executions FOR UPDATE
  USING (auth.uid() = user_id);

-- Workflow Step Results RLS
ALTER TABLE workflow_step_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view step results of their executions"
  ON workflow_step_results FOR SELECT
  USING (
    execution_id IN (
      SELECT id FROM workflow_executions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert step results to their executions"
  ON workflow_step_results FOR INSERT
  WITH CHECK (
    execution_id IN (
      SELECT id FROM workflow_executions WHERE user_id = auth.uid()
    )
  );

-- Workflow Errors RLS
ALTER TABLE workflow_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view errors for their executions"
  ON workflow_errors FOR SELECT
  USING (
    execution_id IN (
      SELECT id FROM workflow_executions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert errors for their executions"
  ON workflow_errors FOR INSERT
  WITH CHECK (
    execution_id IN (
      SELECT id FROM workflow_executions WHERE user_id = auth.uid()
    )
  );

-- Workflow Schedules RLS
ALTER TABLE workflow_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workflow schedules"
  ON workflow_schedules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create workflow schedules"
  ON workflow_schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workflow schedules"
  ON workflow_schedules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workflow schedules"
  ON workflow_schedules FOR DELETE
  USING (auth.uid() = user_id);

-- Workflow Templates (No RLS - Public read, admin write)
ALTER TABLE workflow_templates DISABLE ROW LEVEL SECURITY;

-- Seed official workflow templates
INSERT INTO workflow_templates (name, description, definition, category, tags, is_official)
VALUES (
  'Full Compliance Analysis',
  'Complete 6-agent analysis pipeline: Extract → Monitor → Assess Risk → Recommend → Audit → Learn',
  '{"name": "Full Compliance Analysis", "steps": [{"id": "extract", "agentName": "sofia", "inputs": {"documentText": "$document"}}, {"id": "monitor", "agentName": "elena", "inputs": {}}, {"id": "risk", "agentName": "bruno", "inputs": {"obligations": "$.extract.output.obligations"}}, {"id": "recommend", "agentName": "marco", "inputs": {"riskAssessment": "$.risk.output"}}, {"id": "audit", "agentName": "laura", "inputs": {"recommendations": "$.recommend.output"}}, {"id": "learn", "agentName": "kai", "inputs": {"executionResult": "$.audit.output"}}]}',
  'Analysis',
  ARRAY['comprehensive', 'all-agents', 'detailed'],
  TRUE
),
(
  'Quick Compliance Scan',
  'Fast 3-agent pipeline: Extract → Assess Risk → Prioritize',
  '{"name": "Quick Compliance Scan", "steps": [{"id": "extract", "agentName": "sofia", "inputs": {"documentText": "$document"}}, {"id": "risk", "agentName": "bruno", "inputs": {"obligations": "$.extract.output.obligations"}}, {"id": "recommend", "agentName": "marco", "inputs": {"riskAssessment": "$.risk.output"}}]}',
  'Analysis',
  ARRAY['fast', 'quick', 'essential'],
  TRUE
),
(
  'Regulatory Monitoring',
  'Monitor Ley 21.719 changes and generate alerts',
  '{"name": "Regulatory Monitoring", "steps": [{"id": "monitor", "agentName": "elena", "inputs": {}}, {"id": "risk", "agentName": "bruno", "inputs": {"regulatoryChanges": "$.monitor.output"}}, {"id": "recommend", "agentName": "marco", "inputs": {"riskAssessment": "$.risk.output"}}]}',
  'Monitoring',
  ARRAY['regulatory', 'monitoring', 'alerts'],
  TRUE
);

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON workflow_definitions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON workflow_executions TO authenticated;
GRANT SELECT, INSERT ON workflow_step_results TO authenticated;
GRANT SELECT, INSERT ON workflow_errors TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON workflow_schedules TO authenticated;
GRANT SELECT ON workflow_templates TO authenticated;
