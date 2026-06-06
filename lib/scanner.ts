import { createClient } from '@supabase/supabase-js'

interface VulnerabilityFinding {
  title: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  category: 'sast' | 'dependency' | 'config' | 'data-protection' | 'access-control'
  cve_id?: string
  remediation: string
}

interface ScanResult {
  findings: VulnerabilityFinding[]
  score: number
  timestamp: Date
}

// Simple SAST scanner - checks for common vulnerabilities
export function performSASTScan(code: string): VulnerabilityFinding[] {
  const findings: VulnerabilityFinding[] = []

  // SQL Injection patterns
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

  // Hardcoded secrets
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

  // Missing input validation
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

  // Weak cryptography
  if (/md5|sha1|crypt/i.test(code) && !/hmac/i.test(code)) {
    findings.push({
      title: 'Criptografía débil detectada',
      description: 'Se utiliza un algoritmo de hash débil o deprecado',
      severity: 'high',
      category: 'data-protection',
      remediation: 'Usa SHA-256, SHA-512 o bcrypt para funciones criptográficas',
    })
  }

  // Missing authentication/authorization checks
  if (
    /app\.get\s*\(\s*['"]/i.test(code) &&
    !/(requireAuth|middleware|auth\(|jwt)/i.test(code)
  ) {
    findings.push({
      title: 'Endpoint sin autenticación detectado',
      description: 'Se encontró un endpoint HTTP sin verificación de autenticación',
      severity: 'high',
      category: 'access-control',
      remediation: 'Implementa middleware de autenticación en todos los endpoints',
    })
  }

  // Insecure random generation
  if (/Math\.random|random\(\)/i.test(code) && /token|session|password/i.test(code)) {
    findings.push({
      title: 'Generación de números aleatorios insegura',
      description: 'Se utiliza Math.random para generar valores de seguridad',
      severity: 'high',
      category: 'data-protection',
      remediation: 'Usa crypto.randomBytes o un CSPRNG para valores críticos de seguridad',
    })
  }

  // CORS misconfiguration
  if (/\*|Access-Control-Allow-Origin/i.test(code)) {
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

// Dependency scan - simulates checking for known vulnerabilities
export function performDependencyScan(dependencies: Record<string, string>): VulnerabilityFinding[] {
  const findings: VulnerabilityFinding[] = []

  // Common vulnerable packages (mock data)
  const vulnerablePackages: Record<string, { version: string; vulnerability: string; severity: 'critical' | 'high' | 'medium' | 'low' | 'info' }[]> = {
    'lodash': [
      {
        version: '<4.17.21',
        vulnerability: 'Prototype Pollution en _.zipObjectDeep',
        severity: 'high',
      },
    ],
    'axios': [
      {
        version: '<0.21.1',
        vulnerability: 'Acceso inseguro a datos de otros hosts',
        severity: 'medium',
      },
    ],
    'express': [
      {
        version: '<4.17.1',
        vulnerability: 'Vulnerabilidad de caché abierto',
        severity: 'medium',
      },
    ],
  }

  for (const [pkg, vulns] of Object.entries(vulnerablePackages)) {
    if (dependencies[pkg]) {
      const version = dependencies[pkg]
      for (const vuln of vulns) {
        // Simple version comparison (not real semver)
        if (version.replace(/[^0-9]/g, '') < vuln.version.replace(/[^0-9]/g, '')) {
          findings.push({
            title: `Vulnerabilidad en dependencia: ${pkg}`,
            description: `${vuln.vulnerability} (versión actual: ${version})`,
            severity: vuln.severity,
            category: 'dependency',
            remediation: `Actualiza ${pkg} a una versión más reciente`,
          })
        }
      }
    }
  }

  return findings
}

// Configuration scan - checks for common misconfigurations
export function performConfigScan(config: Record<string, any>): VulnerabilityFinding[] {
  const findings: VulnerabilityFinding[] = []

  // Check for debug mode in production
  if (config.debug === true && config.environment === 'production') {
    findings.push({
      title: 'Modo de depuración habilitado en producción',
      description: 'El modo de depuración expone información sensible en ambiente de producción',
      severity: 'high',
      category: 'config',
      remediation: 'Deshabilita el modo de depuración en producción',
    })
  }

  // Check for default credentials
  if (
    config.database?.password === 'password' ||
    config.admin?.username === 'admin'
  ) {
    findings.push({
      title: 'Credenciales por defecto detectadas',
      description: 'Se utilizan credenciales por defecto que son públicamente conocidas',
      severity: 'critical',
      category: 'access-control',
      remediation: 'Cambia todas las credenciales a valores únicos y fuertes',
    })
  }

  // Check for insecure SSL configuration
  if (config.ssl?.enabled === false && config.environment === 'production') {
    findings.push({
      title: 'SSL/TLS no está habilitado en producción',
      description: 'Las comunicaciones no están encriptadas',
      severity: 'critical',
      category: 'config',
      remediation: 'Habilita SSL/TLS para todas las comunicaciones',
    })
  }

  // Check for missing security headers
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

// Data protection compliance check
export function performDataProtectionScan(): VulnerabilityFinding[] {
  const findings: VulnerabilityFinding[] = []

  // These are general compliance recommendations for Ley 21.719
  findings.push({
    title: 'Política de retención de datos',
    description: 'Debe existir una política clara de retención y disposición de datos personales',
    severity: 'high',
    category: 'data-protection',
    remediation: 'Implementa políticas de retención según Ley 21.719',
  })

  findings.push({
    title: 'Cifrado de datos en tránsito',
    description: 'Todos los datos personales en tránsito deben estar cifrados',
    severity: 'high',
    category: 'data-protection',
    remediation: 'Usa HTTPS/TLS para todas las comunicaciones de datos personales',
  })

  findings.push({
    title: 'Cifrado de datos en reposo',
    description: 'Los datos personales sensibles deben estar cifrados en la base de datos',
    severity: 'high',
    category: 'data-protection',
    remediation: 'Implementa cifrado de base de datos para datos personales',
  })

  findings.push({
    title: 'Registro de auditoría',
    description: 'Se debe mantener un registro de acceso a datos personales',
    severity: 'medium',
    category: 'data-protection',
    remediation: 'Implementa logging de auditoría para acceso a datos sensibles',
  })

  return findings
}

export async function saveScanResults(
  supabase: ReturnType<typeof createClient>,
  projectId: string,
  findings: VulnerabilityFinding[]
): Promise<void> {
  for (const finding of findings) {
    await supabase
      .from('vulnerabilities')
      .insert([{
        project_id: projectId,
        title: finding.title,
        description: finding.description,
        severity: finding.severity,
        category: finding.category,
        cve_id: finding.cve_id,
        remediation: finding.remediation,
        status: 'open',
      }])
  }

  // Calculate compliance score
  const criticalCount = findings.filter(f => f.severity === 'critical').length
  const highCount = findings.filter(f => f.severity === 'high').length
  const mediumCount = findings.filter(f => f.severity === 'medium').length

  // Score formula: 100 - (critical*20 + high*10 + medium*5)
  const score = Math.max(0, 100 - (criticalCount * 20 + highCount * 10 + mediumCount * 5))

  await supabase
    .from('projects')
    .update({ compliance_score: score, last_scan_date: new Date() })
    .eq('id', projectId)

  // Save scan history
  await supabase
    .from('scan_history')
    .insert([{
      project_id: projectId,
      vulnerability_count: findings.length,
      critical_count: criticalCount,
      high_count: highCount,
      compliance_score: score,
      scan_type: 'full',
      status: 'completed',
    }])
}
