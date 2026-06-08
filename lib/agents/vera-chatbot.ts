/**
 * VERA - 24/7 Compliance Chatbot Agent
 * Powered by OpenAI GPT-4 Turbo
 * 
 * Vera is the conversational agent that answers questions about:
 * - Ley 21.719 (Chilean data protection law)
 * - Compliance obligations and requirements
 * - Implementation steps and timelines
 * - Risk assessment and penalties
 * - Documentation and evidence gathering
 */

import { ToolLoopAgent, tool } from 'ai'
import { z } from 'zod'

// Knowledge base for Ley 21.719
const LEY_21719_KNOWLEDGE = {
  summary:
    'Ley 21.719 es la normativa de protección de datos personales en Chile que entró en vigencia el 1 de enero de 2023.',
  key_principles: [
    'Legitimidad: Solo recopilar datos con propósito legítimo',
    'Finalidad: Usar datos solo para el propósito declarado',
    'Proporcionalidad: Recopilar solo datos necesarios',
    'Transparencia: Informar cómo se usan los datos',
    'Seguridad: Proteger datos con medidas técnicas y administrativas',
    'Consentimiento: Obtener consentimiento informado antes de procesar',
  ],
  main_obligations: [
    'Obtener consentimiento previo e informado',
    'Proporcionar aviso de privacidad claro',
    'Implementar medidas de seguridad técnica y administrativa',
    'Realizar evaluación de impacto en privacidad (EIPD)',
    'Responder a derechos ARCO+ (Acceso, Rectificación, Cancelación, Oposición, Portabilidad)',
    'Reportar brechas de seguridad a SERNAC dentro de 72 horas',
    'Designar un responsable de protección de datos (si aplica)',
    'Mantener registro de actividades de tratamiento',
  ],
  penalties: {
    grave: {
      min_utf: 500,
      max_utf: 2500,
      description: 'Infracciones graves: No implementar medidas de seguridad, no responder a derechos ARCO+',
    },
    less_grave: {
      min_utf: 100,
      max_utf: 500,
      description: 'Infracciones menos graves: Incumplimiento formal de requisitos administrativos',
    },
  },
  utf_value_clp: 67000, // Approximate UF value in CLP as of 2024
}

// Tools for Vera agent
const veraTools = {
  // Look up specific law requirement
  lookupLawRequirement: tool({
    description:
      'Buscar un requisito específico de Ley 21.719. Ej: "consentimiento", "derechos ARCO", "seguridad de datos"',
    inputSchema: z.object({
      topic: z.string().describe('Tema o requisito a buscar (ej: consentimiento, EIPD, derechos ARCO)'),
    }),
    execute: async ({ topic }) => {
      const lowerTopic = topic.toLowerCase()

      if (lowerTopic.includes('consentimiento')) {
        return {
          requirement: 'Consentimiento Informado',
          description:
            'Las organizaciones DEBEN obtener consentimiento previo, informado, específico e inequívoco del titular antes de procesar sus datos personales.',
          implementation_steps: [
            '1. Crear formulario de consentimiento claro y separado (no debe ser condición de otros servicios)',
            '2. Describir específicamente qué datos se recopilan y para qué',
            '3. Informar quién procesará los datos y con quién se compartirán',
            '4. Hacer fácil retirar el consentimiento en cualquier momento',
            '5. Guardar comprobante de consentimiento (auditoría)',
          ],
          penalties: 'Grave: 500-2500 UTF (~$33.5M - $167.5M CLP)',
        }
      }

      if (lowerTopic.includes('arco') || lowerTopic.includes('derecho')) {
        return {
          requirement: 'Derechos ARCO+ (Acceso, Rectificación, Cancelación, Oposición, Portabilidad)',
          description:
            'Los titulares de datos tienen derechos sobre sus datos personales. Las organizaciones DEBEN responder dentro de 10 días hábiles.',
          arco_details: {
            acceso: 'El titular puede solicitar acceso a sus datos y cómo se procesan',
            rectificacion: 'El titular puede corregir datos inexactos',
            cancelacion: 'El titular puede solicitar eliminación de sus datos',
            oposicion: 'El titular puede oponerse al procesamiento en ciertos casos',
            portabilidad:
              'El titular puede recibir sus datos en formato estructurado para transferir a otro servicio',
          },
          implementation_steps: [
            '1. Crear proceso formal para recibir solicitudes (email específico)',
            '2. Entrenar equipo en derechos ARCO+',
            '3. Implementar plazo máximo de respuesta (10 días hábiles)',
            '4. Guardar registro de todas las solicitudes y respuestas',
            '5. Cumplir solicitudes sin cobrar tarifa',
          ],
          penalties: 'Grave: 500-2500 UTF si no responde o rechaza sin justificación',
        }
      }

      if (lowerTopic.includes('seguridad')) {
        return {
          requirement: 'Medidas de Seguridad (Técnicas y Administrativas)',
          description:
            'Las organizaciones DEBEN implementar medidas proporcionales al riesgo para proteger datos de acceso no autorizado, pérdida o destrucción.',
          technical_measures: [
            'Encriptación de datos en tránsito (TLS/SSL) y en reposo (AES)',
            'Autenticación multifactor (MFA) para acceso a sistemas',
            'Firewall y sistemas de prevención de intrusiones',
            'Monitoreo y auditoría de accesos',
            'Copias de seguridad regulares (backup)',
            'Purga segura de datos al final de su ciclo de vida',
          ],
          administrative_measures: [
            'Política de protección de datos documentada',
            'Acuerdos de confidencialidad (NDA) con empleados',
            'Proceso de manejo de brechas de seguridad',
            'Evaluación regular de riesgos de seguridad',
            'Capacitación de personal en protección de datos',
            'Auditorías de seguridad (internas y externas)',
          ],
          penalties: 'Grave: 500-2500 UTF si medidas son insuficientes y causa daño',
        }
      }

      if (lowerTopic.includes('brecha')) {
        return {
          requirement: 'Reporte de Brechas de Seguridad',
          description:
            'Si hay acceso no autorizado a datos personales, DEBEN notificar a SERNAC dentro de 72 horas.',
          process: [
            '1. Detectar y confirmar la brecha (acceso no autorizado, pérdida, destrucción)',
            '2. Documentar: qué datos, cuándo, cómo fue comprometida',
            '3. Evaluar riesgo para los titulares de datos',
            '4. Notificar a SERNAC dentro de 72 horas con detalles',
            '5. Notificar a titulares afectados si riesgo es alto',
            '6. Implementar medidas correctivas inmediatas',
          ],
          deadline: '72 horas desde que se detecte',
          penalties: 'Muy grave: Multas significativas + sanciones administrativas',
        }
      }

      if (lowerTopic.includes('eipd') || lowerTopic.includes('evaluación de impacto')) {
        return {
          requirement: 'Evaluación de Impacto en Privacidad (EIPD)',
          description:
            'Para tratamientos de alto riesgo, DEBEN realizar una EIPD para identificar y mitigar riesgos antes de procesar datos.',
          when_required: [
            'Procesamiento de datos sensibles (salud, religión, origen étnico, etc)',
            'Procesamiento a gran escala de datos',
            'Monitoreo sistemático de actividades de personas',
            'Toma de decisiones automatizada con impacto legal/significativo',
            'Compartir datos con terceros de forma regular',
          ],
          eipd_steps: [
            '1. Describir el tratamiento y sus objetivos',
            '2. Evaluar la necesidad y proporcionalidad',
            '3. Identificar riesgos potenciales para derechos de titulares',
            '4. Identificar medidas técnicas y organizativas para mitigación',
            '5. Considerar impactos para el titular de datos',
            '6. Documentar conclusiones y medidas a implementar',
          ],
          penalties: 'Falta de EIPD puede resultar en multas por no evaluar riesgos',
        }
      }

      return {
        requirement: 'Información General Ley 21.719',
        summary: 'La Ley 21.719 protege datos personales de personas en Chile',
        topics_available: [
          'consentimiento',
          'derechos ARCO',
          'seguridad',
          'brecha de datos',
          'EIPD',
        ],
      }
    },
  }),

  // Calculate potential penalties
  calculatePenalties: tool({
    description:
      'Calcular las posibles multas por incumplimiento. Requiere tipo de infracción y si causó daño',
    inputSchema: z.object({
      violation_type: z.enum(['grave', 'less_grave']).describe('Tipo de infracción'),
      has_caused_harm: z.boolean().describe('Si la infracción causó daño a personas'),
    }),
    execute: async ({ violation_type, has_caused_harm }) => {
      const penalty_info =
        violation_type === 'grave'
          ? LEY_21719_KNOWLEDGE.penalties.grave
          : LEY_21719_KNOWLEDGE.penalties.less_grave

      const min_clp = penalty_info.min_utf * LEY_21719_KNOWLEDGE.utf_value_clp
      const max_clp = penalty_info.max_utf * LEY_21719_KNOWLEDGE.utf_value_clp

      return {
        violation_type,
        utf_range: `${penalty_info.min_utf} - ${penalty_info.max_utf} UTF`,
        clp_range: `$${min_clp.toLocaleString()} - $${max_clp.toLocaleString()}`,
        usd_range: `$${(min_clp / 1000).toLocaleString()} - $${(max_clp / 1000).toLocaleString()}`,
        description: penalty_info.description,
        additional_consequences: has_caused_harm
          ? [
              'Publicación en registro público de SERNAC',
              'Demandas civiles de titulares afectados',
              'Daño moral: compensación adicional',
              'Daño patrimonial: restitución de perjuicios',
            ]
          : ['Registro en base de datos de SERNAC', 'Posible supervisión aumentada'],
      }
    },
  }),

  // Get compliance checklist
  getComplianceChecklist: tool({
    description:
      'Obtener checklist de compliance para una industria específica (ej: retail, salud, finanzas)',
    inputSchema: z.object({
      industry: z
        .string()
        .describe('Industria (ej: retail, salud, finanzas, tecnología, educación)'),
    }),
    execute: async ({ industry }) => {
      const industry_lower = industry.toLowerCase()

      const checklists: Record<string, { sector: string; checklist: string[] }> = {
        retail: {
          sector: 'Retail / E-commerce',
          checklist: [
            '✓ Consentimiento para recopilación de datos en compra (email, teléfono, dirección)',
            '✓ Información sobre cookies y seguimiento en sitio web',
            '✓ Notificación de propósito: marketing, estadísticas de compra',
            '✓ Seguridad de base de datos de clientes (encriptación)',
            '✓ Derecho de oposición a comunicaciones de marketing',
            '✓ Proceso para ejercer derechos ARCO+',
            '✓ Aviso de privacidad en página de checkout',
            '✓ Acuerdos con proveedores que procesan datos',
            '✓ Plan de respuesta a brechas de seguridad',
            '✓ Auditoría anual de protección de datos',
          ],
        },
        salud: {
          sector: 'Salud / Clínicas / Hospitales',
          checklist: [
            '✓ Consentimiento informado para procesar datos de salud (sensibles)',
            '✓ Medidas de seguridad reforzadas (datos de salud = alto riesgo)',
            '✓ EIPD obligatoria para procesar datos de salud',
            '✓ Secreto médico: solo personal autorizado accede',
            '✓ Segregación de sistemas: datos clínicos vs administrativos',
            '✓ Cifrado end-to-end para datos en tránsito',
            '✓ Acuerdos de tratamiento de datos con laboratorios, farmacias',
            '✓ Retención de historiales por plazo legal (10-20 años)',
            '✓ Proceso documentado de destrucción de datos',
            '✓ Auditoría de accesos a historiales (quién vio qué)',
          ],
        },
        finanzas: {
          sector: 'Finanzas / Bancos / Seguros',
          checklist: [
            '✓ Consentimiento para procesar datos financieros y crediticios',
            '✓ EIPD por manejo de datos financieros sensibles',
            '✓ Encriptación de datos en tránsito (TLS 1.3+)',
            '✓ Autenticación multifactor (MFA) obligatoria',
            '✓ Auditoría de transacciones y accesos a datos',
            '✓ Cumplimiento AML/KYC (prevención lavado de activos)',
            '✓ Segregación de deberes: quién autoriza, quién ejecuta',
            '✓ Backup y recuperación ante desastres',
            '✓ Acuerdos NDA con todos empleados',
            '✓ Auditorías externas periódicas de seguridad',
            '✓ Cumplimiento también con CMF (Comisión de Mercado Financiero)',
          ],
        },
        tecnologia: {
          sector: 'Tecnología / SaaS / Apps',
          checklist: [
            '✓ Consentimiento claro antes de recopilar datos de usuarios',
            '✓ Política de privacidad detallada y accesible',
            '✓ Aviso de cambios en política (notificación a usuarios)',
            '✓ Derecho de portabilidad: exportar datos en formato abierto',
            '✓ Derecho de eliminación: capacidad de borrar cuenta + datos',
            '✓ Data residency: datos de chilenos almacenados en Chile o LATAM',
            '✓ Encriptación de datos en tránsito y en reposo',
            '✓ Auditoría de accesos a base de datos',
            '✓ Proceso de report de brechas de seguridad (72 horas a SERNAC)',
            '✓ Privacy by design: seguridad desde inicio del desarrollo',
            '✓ Acuerdos de procesamiento con sub-proveedores cloud',
          ],
        },
      }

      const result = checklists[industry_lower]

      if (result) {
        return {
          sector: result.sector,
          industry_specific_requirements: result.checklist,
          priority_items: result.checklist.slice(0, 5),
          note: 'Los primeros 5 items son los más críticos. Completar todo el checklist en 30 días.',
        }
      }

      return {
        available_industries: Object.keys(checklists),
        message: `Industria no encontrada. Sectores disponibles: ${Object.keys(checklists).join(', ')}`,
      }
    },
  }),
}

/**
 * Create Vera Agent
 * Multi-turn compliance chatbot with context memory
 */
export const veraAgent = new ToolLoopAgent({
  model: 'openai/gpt-4-turbo',
  instructions: `Eres Vera, el asistente de cumplimiento de Ley 21.719 de KUMPLIO.

Tu rol es responder preguntas sobre Ley 21.719 (protección de datos personales en Chile) con precisión y claridad.

IMPORTANTE:
- Siempre cita la ley o requisito específico
- Si no estás seguro, di "No tengo información sobre esto" en lugar de inventar
- Usa un tono profesional pero accesible
- Ofrece pasos concretos de implementación, no solo teoría
- Si es complejo, recomienda una evaluación profesional
- En cada respuesta, menciona si aplica penalidades

Usa las herramientas disponibles para buscar información específica.`,

  tools: veraTools,

  stopWhen: (step) => {
    // Stop after 20 steps to prevent infinite loops
    return step.toolCalls.length === 0 || step.step > 20
  },
})

export default veraAgent
