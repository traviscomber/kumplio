// Minería Module - Ley 21.800 de Seguridad Minera
// Specialized compliance checker for mining operations

export interface MiningRequirement {
  code: string;
  title: string;
  description: string;
  category: 'seguridad' | 'salud' | 'ambiente' | 'reporte' | 'capacitacion';
  frequency: string;
  evidenceType: string[];
  penalty?: string;
}

export const LEY_21800_REQUIREMENTS: MiningRequirement[] = [
  // Seguridad
  {
    code: 'SEG-001',
    title: 'Plan de Seguridad Integral',
    description: 'Cada empresa minera debe contar con un Plan de Seguridad Integral que incluya identificación de peligros, evaluación de riesgos y medidas de control.',
    category: 'seguridad',
    frequency: 'Anual',
    evidenceType: ['documento_plan', 'certificacion', 'auditoria'],
    penalty: 'UTA 10-50',
  },
  {
    code: 'SEG-002',
    title: 'Sistema de Gestión de Seguridad (SGS)',
    description: 'Implementación de Sistema de Gestión de Seguridad conforme a ISO 45001 o equivalente.',
    category: 'seguridad',
    frequency: 'Permanente',
    evidenceType: ['certificado_iso', 'politica', 'procedimientos'],
    penalty: 'UTA 20-100',
  },
  {
    code: 'SEG-003',
    title: 'Investigación de Incidentes',
    description: 'Todo incidente, accidente o near miss debe ser investigado dentro de 48 horas.',
    category: 'seguridad',
    frequency: 'Por evento',
    evidenceType: ['reporte_investigacion', 'analisis_causalidad', 'acciones_correctivas'],
    penalty: 'UTA 5-20',
  },
  {
    code: 'SEG-004',
    title: 'Equipos de Protección Personal (EPP)',
    description: 'Provisión, mantenimiento y capacitación en uso de EPP apropiado para cada faena.',
    category: 'seguridad',
    frequency: 'Permanente',
    evidenceType: ['registro_epp', 'capacitacion', 'inspeccion_equipos'],
    penalty: 'UTA 3-15',
  },
  {
    code: 'SEG-005',
    title: 'Inspecciones de Seguridad',
    description: 'Realizar inspecciones periódicas de seguridad en todas las áreas de operación.',
    category: 'seguridad',
    frequency: 'Mensual',
    evidenceType: ['reporte_inspeccion', 'fotografias', 'seguimiento_no_conformidades'],
    penalty: 'UTA 5-25',
  },

  // Salud
  {
    code: 'SAL-001',
    title: 'Vigilancia de Salud de Trabajadores',
    description: 'Programa de vigilancia médica incluyendo exámenes ocupacionales iniciales y periódicos.',
    category: 'salud',
    frequency: 'Anual',
    evidenceType: ['registros_medicos', 'examenes_ocupacionales', 'protocolo_vigilancia'],
    penalty: 'UTA 5-20',
  },
  {
    code: 'SAL-002',
    title: 'Identificación de Peligros Químicos',
    description: 'Registro e identificación de todas las sustancias químicas usadas en operaciones.',
    category: 'salud',
    frequency: 'Permanente',
    evidenceType: ['hojas_seguridad_quimicas', 'inventario', 'etiquetado'],
    penalty: 'UTA 3-15',
  },
  {
    code: 'SAL-003',
    title: 'Comité Paritario de Higiene y Seguridad',
    description: 'Conformación y funcionamiento de comité paritario según legislación laboral.',
    category: 'salud',
    frequency: 'Permanente',
    evidenceType: ['acta_constitucion', 'actas_reuniones', 'resoluciones'],
    penalty: 'UTA 10-50',
  },

  // Ambiente
  {
    code: 'AMB-001',
    title: 'Evaluación de Impacto Ambiental',
    description: 'Realizar evaluación ambiental conforme a la legislación ambiental vigente.',
    category: 'ambiente',
    frequency: 'Inicial y cambios significativos',
    evidenceType: ['eia_aprobado', 'permisos_ambientales', 'certificacion'],
    penalty: 'UTA 20-100',
  },
  {
    code: 'AMB-002',
    title: 'Monitoreo Ambiental',
    description: 'Monitoreo de agua, aire y suelo en zonas de operación y potencialmente afectadas.',
    category: 'ambiente',
    frequency: 'Trimestral',
    evidenceType: ['reportes_laboratorio', 'graficos_tendencias', 'certificacion_laboratorio'],
    penalty: 'UTA 5-20',
  },
  {
    code: 'AMB-003',
    title: 'Plan de Cierre de Operaciones',
    description: 'Contar con plan de cierre y remediación de sitios mineros.',
    category: 'ambiente',
    frequency: 'Permanente',
    evidenceType: ['plan_cierre', 'garantias_financieras', 'auditorias'],
    penalty: 'UTA 30-150',
  },

  // Reporte
  {
    code: 'REP-001',
    title: 'Reporte de Accidentes e Incidentes',
    description: 'Reportar a autoridad dentro de plazo establecido según clasificación.',
    category: 'reporte',
    frequency: 'Por evento',
    evidenceType: ['reporte_oficial', 'comprobante_recepcion', 'fotografias_sitio'],
    penalty: 'UTA 5-30',
  },
  {
    code: 'REP-002',
    title: 'Reportes Periódicos a Autoridad',
    description: 'Envío de reportes de cumplimiento normativo a SERNAGEOMIN.',
    category: 'reporte',
    frequency: 'Semestral',
    evidenceType: ['reportes_sernageomin', 'comprobantes_entrega'],
    penalty: 'UTA 3-15',
  },

  // Capacitación
  {
    code: 'CAP-001',
    title: 'Capacitación en Seguridad Minera',
    description: 'Capacitación obligatoria para todos los trabajadores en seguridad minera.',
    category: 'capacitacion',
    frequency: 'Anual',
    evidenceType: ['registro_asistencia', 'evaluaciones', 'certificados_capacitacion'],
    penalty: 'UTA 5-20',
  },
  {
    code: 'CAP-002',
    title: 'Entrenamiento Específico por Puesto',
    description: 'Capacitación específica según puesto de trabajo y riesgos asociados.',
    category: 'capacitacion',
    frequency: 'Inicial + Anual',
    evidenceType: ['registros_entrenamiento', 'evaluaciones_competencia', 'certificados'],
    penalty: 'UTA 3-15',
  },
];

export interface ComplianceCheckResult {
  requirementCode: string;
  status: 'cumplido' | 'incumplido' | 'parcial' | 'no_aplica';
  percentage: number;
  notes?: string;
  evidenceCount: number;
  lastVerified?: string;
}

export function evaluateMiningCompliance(
  obligations: any[],
  industry: string
): ComplianceCheckResult[] {
  if (industry !== 'Minería') {
    return [];
  }

  const results: ComplianceCheckResult[] = [];

  for (const req of LEY_21800_REQUIREMENTS) {
    // Find matching obligations for this requirement
    const matchingObligations = obligations.filter(o =>
      o.obligation_text?.toLowerCase().includes(req.code.toLowerCase()) ||
      o.obligation_text?.toLowerCase().includes(req.title.toLowerCase())
    );

    if (matchingObligations.length === 0) {
      results.push({
        requirementCode: req.code,
        status: 'incumplido',
        percentage: 0,
        evidenceCount: 0,
      });
      continue;
    }

    // Calculate compliance score based on evidence
    const avgEvidenceCount = matchingObligations.reduce(
      (sum, o) => sum + (o.evidence_reference ? 1 : 0),
      0
    ) / matchingObligations.length;

    let status: ComplianceCheckResult['status'] = 'cumplido';
    let percentage = 100;

    if (avgEvidenceCount === 0) {
      status = 'incumplido';
      percentage = 0;
    } else if (avgEvidenceCount < 3) {
      status = 'parcial';
      percentage = Math.round((avgEvidenceCount / 3) * 100);
    }

    results.push({
      requirementCode: req.code,
      status,
      percentage,
      evidenceCount: matchingObligations.length,
    });
  }

  return results;
}

export function getMiningCategoryStats(complianceResults: ComplianceCheckResult[]) {
  const categoryStats = {
    seguridad: { total: 0, cumplidos: 0, percentage: 0 },
    salud: { total: 0, cumplidos: 0, percentage: 0 },
    ambiente: { total: 0, cumplidos: 0, percentage: 0 },
    reporte: { total: 0, cumplidos: 0, percentage: 0 },
    capacitacion: { total: 0, cumplidos: 0, percentage: 0 },
  };

  complianceResults.forEach(result => {
    const requirement = LEY_21800_REQUIREMENTS.find(r => r.code === result.requirementCode);
    if (!requirement) return;

    const cat = requirement.category;
    categoryStats[cat].total += 1;

    if (result.status === 'cumplido') {
      categoryStats[cat].cumplidos += 1;
    }
  });

  // Calculate percentages
  Object.keys(categoryStats).forEach(key => {
    const cat = categoryStats[key as keyof typeof categoryStats];
    if (cat.total > 0) {
      cat.percentage = Math.round((cat.cumplidos / cat.total) * 100);
    }
  });

  return categoryStats;
}

export function getRequirementsByCategory(category: string): MiningRequirement[] {
  return LEY_21800_REQUIREMENTS.filter(r => r.category === category);
}
