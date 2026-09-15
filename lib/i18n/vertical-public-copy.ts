import type { PublicLocale } from '@/lib/i18n/public-routing'

export const VERTICAL_SLUGS = ['proteccion-de-datos', 'mineria', 'transporte', 'construccion', 'salud', 'agroindustria'] as const
export type VerticalSlug = (typeof VERTICAL_SLUGS)[number]

export const VERTICAL_IMAGES: Record<VerticalSlug, string> = {
  'proteccion-de-datos': '/brand/kumplio-hero-compliance.webp',
  mineria: '/brand/kumplio-mining.webp',
  transporte: '/brand/kumplio-transport.webp',
  construccion: '/brand/kumplio-construction.webp',
  salud: '/brand/kumplio-healthcare.webp',
  agroindustria: '/brand/kumplio-agribusiness.webp',
}

export const VERTICAL_IMAGE_POSITIONS: Record<VerticalSlug, string> = {
  'proteccion-de-datos': '64% center', mineria: '55% center', transporte: '58% center',
  construccion: '68% center', salud: '72% center', agroindustria: '58% center',
}

export type VerticalCopy = {
  name: string
  metadataTitle: string
  metadataDescription: string
  eyebrow: string
  heroQuestion: string
  heroSupport: string
  exampleInput: string
  checks: string[]
  exampleResult: string
  workflow: string[]
  outcomes: Array<{ title: string; description: string }>
  note: string
  back: string
  cta: string
}

const es: Record<VerticalSlug, VerticalCopy> = {
  'proteccion-de-datos': {
    name: 'Protección de Datos', metadataTitle: 'Kumplio Protección de Datos | Ley 21.719 y gestión de evidencia', metadataDescription: 'Organiza tratamientos, responsables, proveedores, brechas y evidencia para prepararte frente a la Ley 21.719 con revisión humana.', eyebrow: 'Kumplio Protección de Datos · Ley 21.719',
    heroQuestion: '¿Sabes qué datos personales usa tu empresa, dónde están y qué debes corregir?', heroSupport: 'Relaciona tratamientos, sistemas, proveedores y responsables antes de priorizar brechas y preparar evidencia.',
    exampleInput: 'Datos de clientes, trabajadores y postulantes repartidos entre sistemas internos y proveedores.', checks: ['Finalidad y base propuesta', 'Ubicación, acceso y responsable', 'Proveedores y transferencias', 'Brechas y evidencia disponible'], exampleResult: 'Un inventario verificable, brechas priorizadas y un plan de preparación frente a la Ley 21.719.',
    workflow: ['Tratamiento', 'Requisito', 'Documento', 'Verificación', 'Estado', 'Acción'], outcomes: [{ title: 'Entiende el alcance', description: 'Visualiza qué datos se usan, para qué y quién participa.' }, { title: 'Prioriza brechas', description: 'Separa lo urgente de la información que todavía falta.' }, { title: 'Demuestra el avance', description: 'Conserva responsables, revisión y evidencia de cada corrección.' }],
    note: 'Kumplio organiza el análisis y señala decisiones que requieren validación profesional. No reemplaza asesoría legal ni certifica cumplimiento total.', back: 'Volver a áreas', cta: 'Revisar mi empresa',
  },
  mineria: {
    name: 'Minería', metadataTitle: 'Kumplio Minería | Cumplimiento documental de personas y contratistas', metadataDescription: 'Relaciona personas, contratistas, credenciales, inducciones, vencimientos y evidencia específica de cada faena.', eyebrow: 'Kumplio Minería',
    heroQuestion: '¿Puede esta persona entrar a esta faena hoy?', heroSupport: 'Conecta cada trabajador y contratista con las exigencias concretas de la faena, sus documentos y su vigencia.',
    exampleInput: 'Trabajador de un contratista asignado a una faena con requisitos de ingreso propios.', checks: ['Credenciales e identidad', 'Certificaciones e inducción', 'Requisitos del contratista', 'Vencimientos y evidencia de faena'], exampleResult: 'Habilitación visible, requisitos faltantes y la próxima acción antes del ingreso.',
    workflow: ['Persona', 'Requisito de faena', 'Credencial', 'Verificación', 'Habilitación', 'Acción'], outcomes: [{ title: 'Ingreso claro', description: 'Identifica quién está listo y quién necesita atención.' }, { title: 'Vigencia controlada', description: 'Anticipa certificados e inducciones próximos a vencer.' }, { title: 'Evidencia por faena', description: 'Mantiene el respaldo asociado a la operación correcta.' }],
    note: 'La habilitación depende del contexto real y de la revisión de la persona responsable de la operación.', back: 'Volver a áreas', cta: 'Revisar mi operación',
  },
  transporte: {
    name: 'Transporte', metadataTitle: 'Kumplio Transporte | Documentos, conductores y flota', metadataDescription: 'Relaciona conductores, vehículos, licencias, seguros, autorizaciones, requisitos y vencimientos en una ruta trazable.', eyebrow: 'Kumplio Transporte',
    heroQuestion: '¿Puede este conductor operar este vehículo hoy?', heroSupport: 'Reúne la relación conductor–vehículo–servicio para comprobar documentos, autorizaciones y vencimientos antes de operar.',
    exampleInput: 'Conductor asignado a un vehículo y servicio con documentación repartida entre distintas áreas.', checks: ['Licencia y habilitaciones', 'Documentos del vehículo', 'Seguro y autorizaciones', 'Requisitos y vencimientos'], exampleResult: 'Estado operacional visible y acciones concretas para resolver cada bloqueo.',
    workflow: ['Conductor y vehículo', 'Requisito', 'Documento', 'Verificación', 'Estado', 'Acción'], outcomes: [{ title: 'Asignación clara', description: 'Comprueba la combinación concreta antes del servicio.' }, { title: 'Vencimientos visibles', description: 'Anticipa documentos que pueden detener la operación.' }, { title: 'Historial trazable', description: 'Conserva qué se revisó, cuándo y con qué respaldo.' }],
    note: 'Kumplio estructura la revisión; la empresa mantiene la decisión operacional y la validación de cada requisito.', back: 'Volver a áreas', cta: 'Revisar mi operación',
  },
  construccion: {
    name: 'Construcción', metadataTitle: 'Kumplio Construcción | Personas, contratistas y obras', metadataDescription: 'Organiza habilitaciones, contratistas, documentos y evidencia específica de cada obra.', eyebrow: 'Kumplio Construcción',
    heroQuestion: '¿Quién está habilitado para entrar y trabajar en esta obra?', heroSupport: 'Relaciona personas, empresas y frentes de trabajo con los requisitos y respaldos que cada proyecto exige.',
    exampleInput: 'Cuadrilla de un subcontratista que cambia de obra y debe acreditar requisitos distintos.', checks: ['Identidad y vínculo contractual', 'Inducciones y certificaciones', 'Requisitos de la obra', 'Documentos y vencimientos'], exampleResult: 'Lista de habilitados, bloqueos concretos y responsables de resolverlos.',
    workflow: ['Persona o empresa', 'Requisito de obra', 'Documento', 'Verificación', 'Habilitación', 'Acción'], outcomes: [{ title: 'Control por obra', description: 'Evita asumir que una habilitación sirve en todos los proyectos.' }, { title: 'Responsables visibles', description: 'Asigna cada pendiente a quien puede resolverlo.' }, { title: 'Cierre respaldado', description: 'Conserva evidencia y revisión de cada corrección.' }],
    note: 'La plataforma no sustituye la evaluación técnica, preventiva o legal aplicable a cada obra.', back: 'Volver a áreas', cta: 'Revisar mi proyecto',
  },
  salud: {
    name: 'Salud', metadataTitle: 'Kumplio Salud | Accesos, datos sensibles y evidencia', metadataDescription: 'Relaciona personas, accesos, datos sensibles, proveedores, requisitos y evidencia con revisión humana.', eyebrow: 'Kumplio Salud',
    heroQuestion: '¿Quién puede acceder a estos datos y qué evidencia lo respalda?', heroSupport: 'Ordena accesos, finalidades, sistemas y terceros para hacer visible qué está autorizado y qué requiere atención.',
    exampleInput: 'Equipo interno y proveedor tecnológico con acceso a información sensible de pacientes.', checks: ['Rol y necesidad de acceso', 'Finalidad y autorización', 'Sistema y proveedor', 'Registro y evidencia vigente'], exampleResult: 'Accesos explicables, brechas visibles y acciones priorizadas con respaldo.',
    workflow: ['Persona o proveedor', 'Requisito de acceso', 'Evidencia', 'Verificación', 'Estado', 'Acción'], outcomes: [{ title: 'Acceso explicable', description: 'Relaciona quién accede, por qué y bajo qué control.' }, { title: 'Brechas visibles', description: 'Detecta permisos o respaldos que necesitan revisión.' }, { title: 'Decisión trazable', description: 'Conserva evidencia sin reemplazar el criterio responsable.' }],
    note: 'Kumplio no emite diagnósticos clínicos ni reemplaza evaluaciones legales, sanitarias o de seguridad.', back: 'Volver a áreas', cta: 'Revisar mi organización',
  },
  agroindustria: {
    name: 'Agroindustria', metadataTitle: 'Kumplio Agroindustria | Personas, proveedores e instalaciones', metadataDescription: 'Coordina personas, proveedores, instalaciones, requisitos, documentos y evidencia antes de operar.', eyebrow: 'Kumplio Agroindustria',
    heroQuestion: '¿Qué personas, proveedores o instalaciones necesitan atención antes de operar?', heroSupport: 'Conecta el trabajo de campo, plantas y terceros con requisitos concretos, vigencias y evidencia de resolución.',
    exampleInput: 'Proveedor crítico que debe ingresar a una instalación con un certificado próximo a vencer.', checks: ['Persona, proveedor e instalación', 'Requisito aplicable', 'Certificado y vigencia', 'Responsable y evidencia'], exampleResult: 'Qué puede operar, qué está bloqueado y qué debe resolverse primero.',
    workflow: ['Entidad', 'Requisito', 'Certificado', 'Verificación', 'Estado', 'Acción'], outcomes: [{ title: 'Operación conectada', description: 'Relaciona campo, planta y terceros sin perder contexto.' }, { title: 'Prioridad concreta', description: 'Distingue bloqueos operacionales de pendientes menores.' }, { title: 'Evidencia reutilizable', description: 'Evita solicitar otra vez respaldos vigentes y aprobados.' }],
    note: 'Las obligaciones varían según actividad, instalación y contexto; la revisión humana sigue siendo necesaria.', back: 'Volver a áreas', cta: 'Revisar mi operación',
  },
}

const englishNames: Record<VerticalSlug, string> = { 'proteccion-de-datos': 'Data Protection', mineria: 'Mining', transporte: 'Transport', construccion: 'Construction', salud: 'Healthcare', agroindustria: 'Agribusiness' }
const englishQuestions: Record<VerticalSlug, string> = {
  'proteccion-de-datos': 'Do you know what personal data your company uses, where it lives and what needs fixing?',
  mineria: 'Can this person enter this mining site today?',
  transporte: 'Can this driver operate this vehicle today?',
  construccion: 'Who is cleared to enter and work on this construction site?',
  salud: 'Who can access this data and what evidence supports it?',
  agroindustria: 'Which people, vendors or facilities need attention before operating?',
}
const englishSupport: Record<VerticalSlug, string> = {
  'proteccion-de-datos': 'Connect processing activities, systems, vendors and owners before prioritizing gaps for Chilean Law 21.719.',
  mineria: 'Connect each worker and contractor to site-specific requirements, documents, inductions and validity.',
  transporte: 'Bring the driver–vehicle–service relationship together to check licences, insurance, authorizations and expirations.',
  construccion: 'Connect people, companies and work fronts to the requirements and evidence each project demands.',
  salud: 'Organize access, purposes, systems and third parties to show what is authorized and what needs attention.',
  agroindustria: 'Connect field, plant and third-party work to concrete requirements, validity and resolution evidence.',
}
const en = Object.fromEntries(VERTICAL_SLUGS.map((slug) => [slug, {
  name: englishNames[slug],
  metadataTitle: `Kumplio ${englishNames[slug]} | Operational compliance and evidence`,
  metadataDescription: englishSupport[slug],
  eyebrow: `Kumplio ${englishNames[slug]}`,
  heroQuestion: englishQuestions[slug],
  heroSupport: englishSupport[slug],
  exampleInput: 'A real operating situation with information distributed across people, documents and systems.',
  checks: ['Entity and operating context', 'Applicable requirement', 'Current document or evidence', 'Validity, owner and missing information'],
  exampleResult: 'A visible status, concrete blockers and the next accountable action.',
  workflow: ['Entity', 'Requirement', 'Evidence', 'Verification', 'Status', 'Action'],
  outcomes: [{ title: 'Understand', description: 'See the exact operating context and applicable requirements.' }, { title: 'Resolve', description: 'Prioritize missing information, blockers and accountable actions.' }, { title: 'Demonstrate', description: 'Preserve evidence, human review and the history of each correction.' }],
  note: 'Kumplio structures the work and preserves human review. It does not certify compliance or replace professional judgment.',
  back: 'Back to areas',
  cta: 'Review my operation',
}])) as Record<VerticalSlug, VerticalCopy>

export const VERTICAL_PUBLIC_COPY: Record<PublicLocale, Record<VerticalSlug, VerticalCopy>> = { es, en }

export function isVerticalSlug(value: string): value is VerticalSlug {
  return VERTICAL_SLUGS.includes(value as VerticalSlug)
}
