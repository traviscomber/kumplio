# ADR-005 — Motor de Misiones y orquestación exclusiva del backend

- Estado: Aceptada
- Fecha: 2026-08-02
- Mercado: Chile

## Contexto

Kumplio ya dispone de expedientes auditables, workflows agentic, etapas, ejecuciones, artefactos, Grafo Nacional, Memoria Organizacional y evidencia. La experiencia de producto evoluciona hacia objetivos que el usuario entiende como **Misiones**.

## Decisión

1. `compliance_cases` permanece como expediente técnico y auditable.
2. `agent_workflows`, `agent_workflow_stages` y `agent_runs` permanecen como motor de ejecución agentic.
3. `missions` agrega la capa de objetivo, prioridad, estado, coordinación y outcome.
4. Los playbooks declaran capacidades requeridas; no fijan nombres de agentes.
5. `agent_capabilities` permite sustituir o especializar agentes sin versionar nuevamente el playbook.
6. La interfaz nunca asigna etapas ni coordina agentes directamente.
7. Todas las transiciones críticas se ejecutan mediante servicios transaccionales privados.
8. Los resultados importantes requieren revisión humana antes de presentarse como aprobados.

## Consecuencias positivas

- evita duplicar expedientes y workflows;
- desacopla playbooks de modelos y agentes concretos;
- habilita misiones sectoriales sin nuevos módulos;
- conserva trazabilidad y aislamiento multiempresa;
- permite que la interfaz se enfoque en outcomes.

## Límites

- una misión no certifica cumplimiento;
- un resultado propuesto no es una decisión aprobada;
- no se cierra una misión solo por porcentaje de avance;
- la coordinación no puede depender del estado local de React.

## Lenguaje visible

- `case` / expediente técnico → **Misión** cuando la experiencia está orientada al objetivo;
- `workflow` → **Flujo interno**, no visible como concepto principal;
- `capability` → **Capacidad**;
- `result` → **Resultado**;
- toda interfaz permanece en español de Chile.
