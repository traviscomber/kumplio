# SST case relevance boundary — 2026-08-09

## Hallazgo productivo

Un probe sintético de Isidora con grounding oficial SST v4 recibió correctamente 21 referencias a `regulatory_document_sections`, pero también recibió una obligación interna de privacidad del mismo proyecto a través de `read_obligations`.

Isidora la identificó como fuera de alcance en su resumen, pero igualmente la incluyó dentro del array `obligations`.

## Frontera corregida

Para `compliance_assessment` Isidora debe exigir relevancia directa con el objeto del caso antes de incorporar registros operativos del proyecto como obligaciones.

Un registro de otro dominio o meramente histórico/interno:

- no se presenta como obligación del caso;
- puede aparecer en `limitations` o `missingInformation` si aporta una reserva útil;
- no altera la aplicabilidad normativa;
- no crea obligaciones tenant, claims ni reglas automáticas.

## Evidencia de comparación

Probe base:
- case `fb66ee2c-81ee-4731-aa7f-7062d0a6eb24`
- run `c0d817de-29ef-4f96-9129-a4ebc5e45816`
- 21 refs regulatorias SST
- 0 claims automáticos
- 0 obligaciones creadas
- 0 reglas de aplicabilidad creadas

La validación posterior al merge debe repetir un caso sintético SST y comprobar que registros de privacidad/protección de datos no aparezcan en `output_payload.obligations`.
