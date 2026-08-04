# Evidence AI, Risk Intelligence y Benchmark v1

## Evidence AI

`evidence_ai_assessments` guarda evaluaciones generadas por IA separadas del registro canónico `evidence`.

Garantías:

- toda evaluación nace en `pending_review`;
- no modifica `evidence.validation_status`;
- conserva hash de entrada, versión de prompt, modelo, scores, problemas detectados y razonamiento estructurado;
- una persona puede aceptar, rechazar o superseder la evaluación;
- el mismo contenido y versión de análisis no se duplica.

Dimensiones iniciales: relevancia, suficiencia, completitud, vigencia e integridad.

## Risk Intelligence

`dynamic_risk_scores` mantiene snapshots versionados y explicables para riesgos u obligaciones empresariales.

Factores v1:

- riesgo inherente;
- efectividad de controles;
- confianza de evidencia;
- incidentes;
- presión regulatoria.

`calculate_dynamic_risk_score_v1` calcula el residual y clasifica su severidad, pero no cambia controles, obligaciones ni planes automáticamente.

## Benchmark sectorial

`compliance_benchmark_snapshots` almacena estadísticas agregadas por industria, tamaño, país, métrica y período.

Privacidad:

- no almacena nombres de empresas en la cohorte;
- un benchmark solo puede publicarse cuando `cohort_size >= minimum_cohort_size`;
- el mínimo por defecto es 5 y nunca puede ser inferior a 3;
- cohortes insuficientes quedan `withheld`;
- `organization_benchmark_results` muestra a cada organización únicamente su valor, percentil y distancia a la mediana.

No se cargaron benchmarks sintéticos. Las cohortes se generarán cuando exista volumen real suficiente.

## Seguridad

Las cuatro tablas tienen RLS habilitado, no permiten acceso directo a `PUBLIC`, `anon` ni `authenticated`, y se operan desde backend con `service_role`.