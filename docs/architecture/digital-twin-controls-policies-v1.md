# Digital Twin, Control Library and Policy Library v1

## Objetivo

Esta capa convierte el perfil empresarial de Kumplio en un modelo operacional reutilizable y conecta obligaciones con controles y documentos canónicos.

## 1. Company Digital Twin

Entidades materializadas por organización:

- `organization_processes`
- `organization_assets`
- `organization_datasets`
- `organization_vendors`

Relaciones:

- proceso usa activo;
- proceso trata dataset;
- activo almacena dataset;
- proveedor entrega u opera activo.

Las entidades conservan criticidad, responsable, estado de ciclo de vida y atributos extensibles. Los activos y datasets distinguen tratamiento de datos personales, datos sensibles, transferencias internacionales, retención y base jurídica.

## 2. Biblioteca universal de controles

Entidades:

- `control_catalog`
- `control_catalog_versions`
- `control_catalog_obligation_links`
- `organization_control_catalog_links`

El catálogo es global y versionado. Las tablas `controls` existentes siguen representando instancias operativas por organización. Una instancia solo se vincula a una versión canónica mediante `organization_control_catalog_links`.

La primera cohorte contiene ocho controles candidatos de privacidad. Todos permanecen en `draft` y requieren revisión humana antes de ser aprobados o instanciados.

## 3. Biblioteca de políticas

Entidades:

- `policy_catalog`
- `policy_catalog_versions`
- `policy_catalog_obligation_links`
- `organization_policy_instances`

Cada plantilla posee secciones estructuradas, placeholders obligatorios, instrucciones de generación y versionado. Las políticas organizacionales nacen en estado `draft`; publicación y aprobación son acciones humanas explícitas.

La primera cohorte contiene ocho documentos candidatos de privacidad, incluyendo política general, derechos de titulares, incidentes, retención, encargados, evaluación de impacto, aviso de privacidad y DPA.

## Seguridad

Todas las tablas tienen RLS habilitado y están cerradas para `PUBLIC`, `anon` y `authenticated`. Solo `service_role` puede leer o escribir hasta que se implementen políticas de membresía organizacional.

## Principios

1. No duplicar controles por cada norma.
2. No generar políticas publicadas automáticamente.
3. Mantener catálogo global separado de instancias por empresa.
4. Versionar todo contenido reutilizable.
5. Exigir revisión humana antes de activar, aprobar o publicar.
