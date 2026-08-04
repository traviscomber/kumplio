import type { SupabaseClient } from '@supabase/supabase-js'

export interface VulnerabilityFinding {
  title: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  category: 'sast' | 'dependency' | 'config' | 'data-protection' | 'access-control'
  cve_id?: string
  remediation: string
}

type AppSupabaseClient = SupabaseClient<any, any, any>

export function performSASTScan(code: string): VulnerabilityFinding[] {
  const findings: VulnerabilityFinding[] = []

  if (
    /query\s*=\s*['"]\s*\+\s*user/i.test(code) ||
    /sql\s*=\s*['"]\s*\+\s*\w+/i.test(code) ||
    /SELECT.*\+.*user/i.test(code)
  ) {
    findings.push({
      title: 'Posible SQL Injection',
      description: 'Se detectó concatenación directa de variables en consultas SQL',
      severity: 'critical',
      category: 'sast',
      remediation: 'Usa consultas parametrizadas o prepared statements',
    })
  }

  if (
    /api[_-]?key\s*=\s*['"](sk_|pk_|AIza)/i.test(code) ||
    /password\s*=\s*['"]\w+['"];/i.test(code) ||
    /SECRET\s*=\s*['"]\w{32,}['"];/i.test(code)
  ) {
    findings.push({
      title: 'Secretos hardcodeados detectados',
      description: 'Se encontraron claves API o contraseñas en el código fuente',
      severity: 'critical',
      category: 'data-protection',
      remediation: 'Usa variables de entorno o servicios de gestión de secretos',
    })
  }

  if (
    /JSON\.parse\s*\(\s*user/i.test(code) ||
    /eval\s*\(/i.test(code) ||
    /innerHTML\s*=\s*user/i.test(code)
  ) {
    findings.push({
      title: 'Validación de entrada insuficiente',
      description: 'Se detectó procesamiento de entrada no validada',
      severity: 'high',
      category: 'sast',
      remediation: 'Implementa validación y sanitización de entrada robusta',
    })
  }

  if (/md5|sha1|crypt/i.test(code) && !/hmac/i.test(code)) {
    findings.push({
      title: 'Criptografía débil detectada',
      description: 'Se utiliza un algoritmo de hash débil o deprecado',
      severity: 'high',
      category: 'data-protection',
      remediation: 'Usa SHA-256, SHA-512 o bcrypt para funciones criptográficas',
    })
  }

  if (/app\.get\s*\(\s*['"]/i.test(code) && !/(requireAuth|middleware|auth\(|jwt)/i.test(code)) {
    findings.push({
      title: 'Endpoint sin autenticación detectado',
      description: 'Se encontró un endpoint HTTP sin verificación de autenticación',
      severity: 'high',
      category: 'access-control',
      remediation: 'Implementa middleware de autenticación en todos los endpoints',
    })
  }

  if (/Math\.random|random\(\)/i.test(code) && /token|session|password/i.test(code)) {
    findings.push({
      title: 'Generación de números aleatorios insegura',
      description: 'Se utiliza Math.random para generar valores de seguridad',
      severity: 'high',
      category: 'data-protection',
      remediation: 'Usa crypto.randomBytes o un CSPRNG para valores críticos de seguridad',
    })
  }

  if (/Access-Control-Allow-Origin\s*[:=]\s*['"]\*/i.test(code)) {
    findings.push({
      title: 'CORS potencialmente inseguro',
      description: 'Se detectó CORS configurado de manera muy permisiva',
      severity: 'medium',
      category: 'config',
      remediation: 'Configura CORS solo para dominios específicos de confianza',
    })
  }

  return findings
}

export function performDependencyScan(dependencies: Record<string, string>): VulnerabilityFinding[] {
  const findings: VulnerabilityFinding[] = []
  const vulnerablePackages: Record<string, Array<{
    version: string
    vulnerability: string
    severity: VulnerabilityFinding['severity']
  }>> = {
    lodash: [{
      version: '<4.17.21',
      vulnerability: 'Prototype Pollution en _.zipObjectDeep',
      severity: 'high',
    }],
    axios: [{
      version: '<0.21.1',
      vulnerability: 'Acceso inseguro a datos de otros hosts',
      severity: 'medium',
    }],
    express: [{
      version: '<4.17.1',
      vulnerability: 'Vulnerabilidad de caché abierto',
      severity: 'medium',
    }],
  }

  for (const [packageName, vulnerabilities] of Object.entries(vulnerablePackages)) {
    const installedVersion = dependencies[packageName]
    if (!installedVersion) continue

    for (const vulnerability of vulnerabilities) {
      if (installedVersion.replace(/[^0-9]/g, '') < vulnerability.version.replace(/[^0-9]/g, '')) {
        findings.push({
          title: `Vulnerabilidad en dependencia: ${packageName}`,
          description: `${vulnerability.vulnerability} (versión actual: ${installedVersion})`,
          severity: vulnerability.severity,
          category: 'dependency',
          remediation: `Actualiza ${packageName} a una versión más reciente`,
        })
      }
    }
  }

  return findings
}

export function performConfigScan(config: Record<string, any>): VulnerabilityFinding[] {
  const findings: VulnerabilityFinding[] = []

  if (config.debug === true && config.environment === 'production') {
    findings.push({
      title: 'Modo de depuración habilitado en producción',
      description: 'El modo de depuración expone información sensible en ambiente de producción',
      severity: 'high',
      category: 'config',
      remediation: 'Deshabilita el modo de depuración en producción',
    })
  }

  if (config.database?.password === 'password' || config.admin?.username === 'admin') {
    findings.push({
      title: 'Credenciales por defecto detectadas',
      description: 'Se utilizan credenciales por defecto que son públicamente conocidas',
      severity: 'critical',
      category: 'access-control',
      remediation: 'Cambia todas las credenciales a valores únicos y fuertes',
    })
  }

  if (config.ssl?.enabled === false && config.environment === 'production') {
    findings.push({
      title: 'SSL/TLS no está habilitado en producción',
      description: 'Las comunicaciones no están encriptadas',
      severity: 'critical',
      category: 'config',
      remediation: 'Habilita SSL/TLS para todas las comunicaciones',
    })
  }

  if (!config.securityHeaders?.['Strict-Transport-Security']) {
    findings.push({
      title: 'Headers de seguridad faltantes',
      description: 'No se configuraron headers HSTS de seguridad',
      severity: 'medium',
      category: 'config',
      remediation: 'Configura Strict-Transport-Security y otros headers de seguridad',
    })
  }

  return findings
}

export function performDataProtectionScan(): VulnerabilityFinding[] {
  return [
    {
      title: 'Política de retención de datos',
      description: 'Debe existir una política clara de retención y disposición de datos personales',
      severity: 'high',
      category: 'data-protection',
      remediation: 'Implementa políticas de retención según Ley 21.719',
    },
    {
      title: 'Cifrado de datos en tránsito',
      description: 'Todos los datos personales en tránsito deben estar cifrados',
      severity: 'high',
      category: 'data-protection',
      remediation: 'Usa HTTPS/TLS para todas las comunicaciones de datos personales',
    },
    {
      title: 'Cifrado de datos en reposo',
      description: 'Los datos personales sensibles deben estar cifrados en la base de datos',
      severity: 'high',
      category: 'data-protection',
      remediation: 'Implementa cifrado de base de datos para datos personales',
    },
    {
      title: 'Registro de auditoría',
      description: 'Se debe mantener un registro de acceso a datos personales',
      severity: 'medium',
      category: 'data-protection',
      remediation: 'Implementa logging de auditoría para acceso a datos sensibles',
    },
  ]
}

export async function saveScanResults(
  supabase: AppSupabaseClient,
  projectId: string,
  findings: VulnerabilityFinding[],
): Promise<void> {
  if (findings.length > 0) {
    const { error: findingsError } = await supabase
      .from('vulnerabilities')
      .insert(findings.map((finding) => ({
        project_id: projectId,
        title: finding.title,
        description: finding.description,
        severity: finding.severity,
        category: finding.category,
        cve_id: finding.cve_id || null,
        remediation: finding.remediation,
        status: 'open',
      })))

    if (findingsError) throw findingsError
  }

  const criticalCount = findings.filter((finding) => finding.severity === 'critical').length
  const highCount = findings.filter((finding) => finding.severity === 'high').length
  const mediumCount = findings.filter((finding) => finding.severity === 'medium').length
  const score = Math.max(0, 100 - (criticalCount * 20 + highCount * 10 + mediumCount * 5))
  const scannedAt = new Date().toISOString()

  const { error: projectError } = await supabase
    .from('projects')
    .update({ compliance_score: score, last_scan_date: scannedAt })
    .eq('id', projectId)

  if (projectError) throw projectError

  const { error: historyError } = await supabase
    .from('scan_history')
    .insert({
      project_id: projectId,
      vulnerability_count: findings.length,
      critical_count: criticalCount,
      high_count: highCount,
      compliance_score: score,
      scan_type: 'full',
      status: 'completed',
      scan_date: scannedAt,
    })

  if (historyError) throw historyError
}
