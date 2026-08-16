# Kumplio — Auditoría de superficie pública al cierre — 16 de agosto de 2026

Estado: **CURRENT CODE CLEAN · SEARCH INDEX DEBT OBSERVED**

Esta auditoría forma parte del cierre técnico. Su objetivo es distinguir contenido público vigente de huellas históricas todavía visibles en índices externos.

## Código vigente revisado

### `/about`

`app/about/page.tsx` utiliza `ABOUT_PUBLIC_COPY` desde `lib/i18n/institutional-public-copy.ts`.

El copy vigente:

- explica trazabilidad, revisión humana y evidencia operativa;
- declara expresamente que Kumplio no reemplaza asesoría jurídica ni auditoría independiente;
- no contiene claims históricos de “50 empresas”, “0 multas”, “89%”, Labbe, “34 obligaciones” ni monitoreo “24/7”.

### Footer

`components/footer.tsx` conserva el posicionamiento vigente de resolución guiada, foco Chile/Ley 21.719, evidencia, trazabilidad y revisión humana.

La relación con n3uralia se presenta mediante un único `Powered by n3uralia`, sin claim de certificación o respaldo institucional.

### Rutas legacy

`app/sales-kit/page.tsx` no existe en `main`.

`next.config.mjs` mantiene redirect permanente:

```text
/sales-kit → /software-cumplimiento-chile
/demo/transporte → /use-cases
/demo/mineria → /use-cases
```

Por lo tanto, una aparición de copy antiguo de `/sales-kit` en un buscador no representa contenido servido por el código vigente.

## Hallazgo externo

Durante la auditoría se observaron resultados/index snippets históricos asociados a páginas antiguas, incluyendo claims que ya están prohibidos por el contrato público actual.

Clasificación:

**deuda de indexación/caché externa**, no regresión detectada en `main`.

No se justifica modificar copy vigente limpio únicamente para perseguir un snippet histórico. La remediación correcta es mantener redirects/canónicas/IndexNow y evitar que esos claims puedan reaparecer en código o discovery surfaces actuales.

## Claims legacy que deben permanecer prohibidos

- “50 empresas” como validación comercial no acreditada;
- “0 multas”;
- “89%” de reducción no respaldada;
- referencias Labbe de 15 → 0 multas;
- “34 obligaciones identificadas” como claim fijo;
- “cumplimiento 100%”;
- “monitorea cambios regulatorios 24/7” si no existe contrato operacional que lo demuestre;
- exposición exacta en UF sin cálculo y evidencia aplicable.

## Criterio de cierre

La superficie pública se considera **apta para cierre técnico** si:

1. esos claims no existen en código vigente;
2. las URLs legacy tienen retiro/redirect permanente cuando corresponde;
3. discovery surfaces canónicas no los reproducen;
4. cualquier aparición residual se trata como deuda de índice externo;
5. futuras PRs mantienen los guardrails de claims.

## Resultado

> **No se detectó una razón para reabrir desarrollo de producto por la huella legacy observada. El código público actual revisado está alineado con el estándar de claims defendibles; queda únicamente deuda de reindexación externa.**
