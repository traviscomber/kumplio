-- Sprint 5: Regulatory Database Schema
-- Stores regulations, laws, and compliance requirements for different industries

CREATE TABLE IF NOT EXISTS regulatory_frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country VARCHAR(50) NOT NULL DEFAULT 'Chile',
  industry VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- 'law', 'regulation', 'standard', 'guideline'
  year_enacted INTEGER,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS regulatory_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES regulatory_frameworks(id) ON DELETE CASCADE,
  requirement_code VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100),
  severity VARCHAR(50) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  frequency VARCHAR(100), -- 'daily', 'weekly', 'monthly', 'quarterly', 'annually'
  deadline_days INTEGER,
  resources TEXT[], -- array of helpful links/docs
  compliance_evidence TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS regulation_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id UUID NOT NULL REFERENCES regulatory_requirements(id) ON DELETE CASCADE,
  document_obligation_id UUID,
  mapping_confidence DECIMAL(3,2) DEFAULT 0.5, -- 0.0 to 1.0
  notes TEXT,
  mapped_by VARCHAR(100) DEFAULT 'system',
  mapped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for faster queries
CREATE INDEX idx_regulatory_frameworks_industry ON regulatory_frameworks(industry);
CREATE INDEX idx_regulatory_frameworks_country ON regulatory_frameworks(country);
CREATE INDEX idx_regulatory_requirements_framework ON regulatory_requirements(framework_id);
CREATE INDEX idx_regulatory_requirements_category ON regulatory_requirements(category);
CREATE INDEX idx_regulation_mappings_requirement ON regulation_mappings(requirement_id);

-- RLS Policies
ALTER TABLE regulatory_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulation_mappings ENABLE ROW LEVEL SECURITY;

-- Regulatory frameworks are public (read-only for all users)
CREATE POLICY "Anyone can read regulatory frameworks"
  ON regulatory_frameworks FOR SELECT
  USING (true);

-- Requirements are public (read-only for all users)
CREATE POLICY "Anyone can read regulatory requirements"
  ON regulatory_requirements FOR SELECT
  USING (true);

-- Mappings are user-specific
CREATE POLICY "Users can read their own mappings"
  ON regulation_mappings FOR SELECT
  USING (auth.uid() = auth.uid());

CREATE POLICY "Users can create mappings"
  ON regulation_mappings FOR INSERT
  WITH CHECK (auth.uid() = auth.uid());

-- Insert sample regulations for Chile industries

INSERT INTO regulatory_frameworks (country, industry, title, description, type, year_enacted) VALUES
  ('Chile', 'Minería', 'Ley 21.800 de Seguridad Minera', 'Regulación de seguridad e higiene en la minería', 'law', 2024),
  ('Chile', 'Minería', 'Reglamento de Seguridad Minera', 'Requisitos específicos de seguridad en faenas mineras', 'regulation', 2023),
  ('Chile', 'Construcción', 'Ley 16.744 de Accidentes del Trabajo', 'Seguridad y salud ocupacional en construcción', 'law', 1968),
  ('Chile', 'Construcción', 'NCh 1618 Of. 2009', 'Seguridad contra el fuego en edificios', 'standard', 2009),
  ('Chile', 'Finanzas', 'Ley General de Bancos', 'Regulación del sistema bancario', 'law', 1997),
  ('Chile', 'Finanzas', 'Norma de Cumplimiento de Obligaciones', 'Requisitos de cumplimiento normativo', 'regulation', 2023),
  ('Chile', 'Licitaciones', 'Ley de Compras Públicas', 'Procesos de adquisiciones del estado', 'law', 2003),
  ('Chile', 'Licitaciones', 'Reglamento de Licitaciones', 'Detalles de procedimientos de licitación', 'regulation', 2022);
