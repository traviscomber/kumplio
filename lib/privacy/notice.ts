export const PRIVACY_NOTICE = {
  version: '2026-08-03',
  effectiveDate: '2026-08-03',
  route: '/privacy',
  publicUrl: 'https://www.kumplio.app/privacy',
  title: 'Política de Privacidad de Kumplio',
  controllerLabel: 'Kumplio',
  contact: 'privacidad@kumplio.app',
  country: 'Chile',
  scopes: [
    'Navegación y seguridad del sitio',
    'Solicitudes de contacto y demostración',
    'Creación de cuenta, autenticación y workspace',
    'Expedientes, documentos, evidencia y resultados asistidos por IA',
    'Proveedores tecnológicos y transferencias internacionales',
    'Derechos del titular y solicitudes de privacidad',
  ],
  limitations: [
    'El aviso público es general y no reemplaza el mapeo por actividad de tratamiento.',
    'Su existencia no demuestra que todos los destinatarios, subencargados o transferencias estén contractualmente validados.',
    'La sección de conservación no define por sí sola plazos aprobados por categoría de dato.',
    'La eliminación debe demostrarse con evidencia operativa y trazable.',
  ],
} as const

export type PrivacyNoticeSnapshot = typeof PRIVACY_NOTICE
