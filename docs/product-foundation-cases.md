# KUMPLIO Product Foundation — Centro de Casos

## Objetivo

Organizar el producto alrededor de expedientes de cumplimiento y no solamente alrededor de tablas o módulos independientes.

## Alcance de este incremento

- Ruta privada `/cases` con listado de expedientes activos.
- Creación guiada de casos con título, alcance, prioridad y ámbito asociado.
- API autenticada `POST /api/cases` con validación de organización y proyecto.
- Ruta privada `/cases/[caseId]` con contexto, métricas y ruta del expediente.
- Acceso directo desde la navegación principal del workspace.

## Flujo inicial

1. Crear un caso.
2. Asociarlo opcionalmente a un proyecto o ámbito existente.
3. Cargar fuentes y documentos.
4. Ejecutar análisis de agentes.
5. Relacionar controles, evidencia, riesgos y acciones.
6. Revisar resultados y aprobar decisiones.

## Próximos incrementos

- Edición de alcance, propietario, estado y fecha objetivo.
- Filtros por estado, prioridad y responsable.
- Vista integrada de documentos y artefactos dentro del caso.
- Inicio de workflows multiagente desde la ficha del expediente.
- Timeline de eventos, revisiones y decisiones.
- Informes ejecutivos y técnicos por caso.
