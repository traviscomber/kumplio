-- Add organization_id to projects table
-- This connects projects to organizations instead of just users

ALTER TABLE projects ADD COLUMN IF NOT EXISTS organization_id UUID;

-- Add foreign key constraint
ALTER TABLE projects 
ADD CONSTRAINT fk_projects_organizations
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON projects(organization_id);

-- Update RLS policies to include organization_id filtering
DROP POLICY IF EXISTS projects_select_own ON projects;
DROP POLICY IF EXISTS projects_insert_own ON projects;
DROP POLICY IF EXISTS projects_update_own ON projects;
DROP POLICY IF EXISTS projects_delete_own ON projects;

-- New RLS policies that check organization membership
CREATE POLICY projects_select_own ON projects
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY projects_insert_own ON projects
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY projects_update_own ON projects
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY projects_delete_own ON projects
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );
