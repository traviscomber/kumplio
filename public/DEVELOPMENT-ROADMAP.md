# BRIGHTSCOPE - DEVELOPMENT ROADMAP 2026

## FASE 1: MVP LICITACIONES (12 SEMANAS)

### Sprint 1-2: Core Infrastructure (Semanas 1-4)

**Objetivo:** Document upload + basic IA extraction

**Backend Tasks:**
```
- [ ] AWS S3 integration for document storage
- [ ] PDF parsing library setup (pdfparse + textract)
- [ ] Document chunking strategy for LLMs
- [ ] OpenAI GPT-4 API integration
- [ ] Error handling + retry logic
- [ ] Logging & monitoring setup
```

**Frontend Tasks:**
```
- [ ] Upload component (drag & drop)
- [ ] File validation (size, format, virus scan)
- [ ] Upload progress indicator
- [ ] Processing status page
- [ ] Error messages & guidance
```

**Database Schema:**
```sql
-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  organization_id UUID,
  filename VARCHAR(255),
  file_type VARCHAR(10),
  file_size INT,
  s3_key VARCHAR(500),
  upload_date TIMESTAMP,
  status ENUM('uploading', 'processing', 'completed', 'error'),
  industry VARCHAR(50),
  created_at TIMESTAMP
);

-- Obligations extracted
CREATE TABLE obligations (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents,
  obligation_text TEXT,
  type ENUM('deadline', 'responsibility', 'requirement', 'risk'),
  severity ENUM('critical', 'high', 'medium', 'low'),
  owner VARCHAR(255),
  deadline DATE,
  evidence_reference TEXT,
  created_at TIMESTAMP
);

-- Compliance Matrix
CREATE TABLE compliance_matrix (
  id UUID PRIMARY KEY,
  document_id UUID,
  finding_id VARCHAR,
  risk_level ENUM('critical', 'high', 'medium', 'low'),
  obligation TEXT,
  responsible VARCHAR(255),
  due_date DATE,
  evidence TEXT,
  action_plan TEXT,
  status ENUM('pending', 'in_progress', 'completed'),
  created_at TIMESTAMP
);
```

### Sprint 3-4: IA Extraction & Matrix (Semanas 5-8)

**IA Extraction Pipeline:**
```python
# 1. Document preprocessing
- Extract text from PDF/DOCX
- Clean & normalize text
- Identify language (Spanish)
- Split into chunks (max 2000 tokens)

# 2. Obligation extraction
- System prompt: Spanish legal document analysis
- Extract: obligations, deadlines, requirements, responsibilities
- Assign risk scores based on keywords
- Cross-reference with regulation database

# 3. Validation layer
- Check for duplicates
- Validate date formats
- Confirm role/responsibility clarity
- Flag ambiguous obligations for human review

# 4. Matrix generation
- Organize by: Finding → Risk → Obligation → Owner → Evidence → Action
- Calculate compliance score
- Identify critical path items
```

**API Endpoints:**
```
POST /api/documents/upload
- Accepts multipart file
- Validates + stores in S3
- Returns document_id + processing URL

GET /api/documents/{id}/status
- Returns processing status
- % complete for long tasks

GET /api/documents/{id}/matrix
- Returns compliance matrix
- Structured JSON format

POST /api/documents/{id}/regenerate
- Re-runs IA analysis
- Useful for corrections

GET /api/documents/{id}/export
- Returns PDF or Excel version
```

### Sprint 5-6: Dashboard & Export (Semanas 9-12)

**Dashboard Components:**
```
- Recent documents list
- Analysis statistics
- Risk heatmap (by severity)
- Compliance score trend
- Export options
```

**Export Functionality:**
```
- PDF: Professional format with branding
- Excel: Editable matrix format
- JSON: For integrations
- CSV: For data import to other systems
```

**Metrics to Track:**
- Document analysis time
- Extraction accuracy
- User satisfaction (NPS)
- Retention rate

---

## FASE 2: MINERÍA + ENTERPRISE (12 SEMANAS)

### Sprint 7-8: Regulatory Database (Semanas 13-16)

**Ley 21.800 Implementation:**
```
- Create regulatory_requirements table
- Map 100+ specific mining requirements
- Cross-reference with obligations extracted
- Flag non-compliance automatically
- Generate audit-ready compliance report
```

**Regulatory Updates:**
- Automated weekly checks for law changes
- Notification system to customers
- Version control for all regulations
- Audit trail of regulatory changes

### Sprint 9-10: MPD Generator & Compliance Tracker (Semanas 17-20)

**MPD (Modelo de Prevención de Delitos):**
```
- Template for Ley 21.800 MPD
- Risk assessment module
- Control documentation
- Compliance calendar
- Training materials
```

**Compliance Tracker:**
```
- Checklist against Ley 21.719 + Ley 21.800
- Automated status updates
- Deadline reminders
- Evidence collection
- Audit preparation
```

### Sprint 11-12: Integrations & Performance (Semanas 21-24)

**Integrations:**
- Mercado Público API (pull TDRs automatically)
- Integración con correo (send notifications)
- Zapier (connect to other tools)
- Webhook para custom integrations

**Performance:**
- Analysis time: <30 seconds per document
- Dashboard load: <2 seconds
- Search: <500ms for 10,000 documents
- API response: <200ms at p99

---

## FASE 3: CONSTRUCCIÓN + FINANZAS (12 SEMANAS)

### Sprint 13-14: Construction Module (Semanas 25-28)

**Construction-Specific Features:**
```
- EPC contract template library
- Safety compliance (Ley 21.885)
- Stakeholder matrix (contractor, client, supervisory engineer)
- Project timeline with critical path
- Insurance & warranty tracking
- Change order management
```

### Sprint 15-16: Finance Module (Semanas 29-32)

**Finance-Specific Features:**
```
- CMF/SBIF/SFA regulatory mapping
- Financial obligation extraction
- Payment terms analyzer
- Counterparty risk assessment
- Compliance calendar (financial reqs)
- Audit trail (immutable, timestamped)
```

### Sprint 17-18: Admin & Advanced Features (Semanas 33-36)

**Admin Panel:**
```
- User & team management
- Custom workflows
- Advanced reporting
- Data export
- Audit logs
- Integration management
```

---

## TECHNICAL ARCHITECTURE

### Frontend Stack
- Next.js 16 + React 19
- TypeScript
- Tailwind CSS + Shadcn/UI
- SWR for data fetching
- Zustand for state management
- Recharts for data visualization

### Backend Stack
- Node.js + Express/Next.js API routes
- PostgreSQL (Supabase)
- Redis (Upstash) for caching
- Bull for async job queue
- OpenAI + Claude APIs
- AWS S3 for file storage

### Deployment
- Vercel (frontend + serverless functions)
- Supabase (PostgreSQL + Auth)
- AWS S3 (document storage)
- Upstash (Redis cache)
- Sentry (error tracking)

### Monitoring & Observability
- Sentry for error tracking
- PostHog for product analytics
- CloudWatch for AWS monitoring
- Custom dashboards for key metrics

---

## RESOURCES REQUIRED

### Team (Year 1)
- 1x CTO/Lead Engineer (fullstack)
- 2x Backend Engineers
- 1x Frontend Engineer
- 1x ML/IA Engineer (part-time, consultoria)
- 1x Product Manager
- 1x Sales/Biz Dev
- 1x Customer Success

**Total Cost:** ~$350K/year

### Infrastructure (Year 1)
- AWS S3: $500/month
- OpenAI API: $3K-5K/month (at scale)
- Supabase: $1K/month
- Vercel: $500/month
- Monitoring/Tools: $500/month

**Total Infrastructure:** ~$80K/year

### Marketing & Sales (Year 1)
- Content creation: $2K/month
- Paid ads: $3K/month
- Events/partnerships: $2K/month

**Total Marketing:** ~$84K/year

---

## SUCCESS METRICS

### Product Metrics
- Document analysis accuracy: >95%
- System uptime: >99.9%
- Analysis speed: <30 seconds avg
- User satisfaction (NPS): >50

### Business Metrics
- Customer acquisition: 50+ month 1, 100+ month 3
- MRR: $12.5K → $25K → $50K (Y1 progression)
- Customer retention: >90% monthly
- Payback period: <6 months

### Engagement Metrics
- Documents analyzed: 1,000+ by end Y1
- Active users: 500+ by end Y1
- Session duration: >15 minutes avg
- Feature adoption: >70% for core features

