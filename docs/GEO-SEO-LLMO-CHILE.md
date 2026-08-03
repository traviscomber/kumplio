# Kumplio — GEO, SEO y LLMO para Chile

Última revisión: 3 de agosto de 2026.

## Objetivo

Posicionar a Kumplio como la referencia chilena en software de cumplimiento normativo, inteligencia regulatoria y preparación operativa para la Ley 21.719, mientras se presenta a n3uralia como la empresa que desarrolla el producto y como alternativa para sistemas más amplios.

## Separación de marcas

### Kumplio

Debe capturar búsquedas relacionadas con:

- software de cumplimiento normativo en Chile;
- plataforma de compliance;
- software para la Ley 21.719;
- obligaciones, controles y evidencia;
- derechos de titulares;
- encargados y proveedores;
- evaluaciones de impacto;
- modelo de prevención de infracciones.

### n3uralia

Debe capturar búsquedas relacionadas con:

- inteligencia artificial aplicada;
- automatización empresarial;
- sistemas multiagente;
- software fullstack;
- inteligencia operacional;
- integraciones y modernización de sistemas.

### Regla visual

La relación no debe dominar la interfaz de Kumplio.

- usar una sola mención visible «Powered by n3uralia» en el footer;
- mantener una página factual `/powered-by-n3uralia`;
- evitar banners, dos logos compitiendo o mensajes promocionales repetidos;
- mantener la relación fuerte en metadata, JSON-LD, enlaces y atribución técnica.

## Arquitectura de intención

### Transaccional

- `/software-cumplimiento-chile`
- `/features/ley-21719`
- `/pricing`
- `/enterprise`
- `/contact`

### Comparación y evaluación

- `/use-cases`
- `/demo`
- `/faq`
- `/about`
- `/security`

### Autoridad temática

- `/resources/cumplimiento-normativo`
- `/resources/ley-21719`
- `/resources/ley-21719/principios-proteccion-datos`
- `/resources/ley-21719/derechos-titulares`
- `/resources/ley-21719/encargados-proveedores`
- `/resources/ley-21719/evaluacion-impacto`
- `/resources/ley-21719/modelo-prevencion`

## Recursos para buscadores y modelos

- `/robots.txt`
- `/sitemap.xml`
- `/feed.xml`
- `/llms.txt`
- `/llms-full.txt`
- `/kumplio.json`
- JSON-LD para Organization, Brand, SoftwareApplication, WebSite, Article, FAQPage y BreadcrumbList.

`llms.txt` es una capa complementaria de contexto. No reemplaza HTML rastreable, enlaces internos, contenido de calidad, sitemap ni datos estructurados.

## Variables de entorno

```text
GOOGLE_SITE_VERIFICATION=
INDEXNOW_KEY=
INDEXNOW_SECRET=
```

La clave IndexNow se publica en `/indexnow-key.txt`. El endpoint protegido es `POST /api/indexnow` con:

```http
Authorization: Bearer <INDEXNOW_SECRET>
Content-Type: application/json
```

```json
{
  "urls": [
    "https://kumplio.app/software-cumplimiento-chile",
    "https://kumplio.app/resources/ley-21719"
  ]
}
```

## Activación después del deploy

1. Verificar `https://kumplio.app` en Google Search Console.
2. Enviar `https://kumplio.app/sitemap.xml`.
3. Inspeccionar y solicitar rastreo de las páginas prioritarias.
4. Configurar Bing Webmaster Tools e importar la propiedad desde Search Console cuando corresponda.
5. Configurar IndexNow y enviar solamente URLs nuevas, modificadas o eliminadas.
6. Validar JSON-LD con Rich Results Test y Schema Markup Validator.
7. Confirmar que Vercel, WAF o protección de bots no bloqueen Googlebot, Bingbot, OAI-SearchBot, ClaudeBot ni PerplexityBot.
8. Revisar que las páginas públicas devuelvan HTTP 200 sin autenticación, CAPTCHA o desafío JavaScript.
9. Revisar títulos, descripciones, canonicals y enlaces internos desde la versión móvil.
10. Ejecutar `npm run check:discovery` en CI.

## Enlace inverso desde n3uralia.com

El repositorio de n3uralia no está disponible en la conexión actual. El sitio debe incorporar manualmente:

1. una ficha de Kumplio en proyectos o casos en producción;
2. un enlace desde la sección «Legal y compliance» o «Servicios regulados»;
3. una descripción factual: «Kumplio es el producto de cumplimiento normativo desarrollado por n3uralia»;
4. enlace canónico a `https://kumplio.app`;
5. datos estructurados que relacionen a n3uralia como creator/provider y a Kumplio como SoftwareApplication o Product;
6. UTM sugerido: `utm_source=n3uralia&utm_medium=referral&utm_campaign=kumplio_product`.

## Medición

Crear segmentos de referencia para:

- `chatgpt.com`;
- Perplexity;
- Bing / Copilot;
- Google organic;
- n3uralia referral;
- backlinks de medios, estudios jurídicos, asociaciones y partners.

Medir por landing:

- impresiones y clics;
- consultas posicionadas en Chile;
- páginas citadas por motores de IA;
- formularios iniciados y enviados;
- creación de cuenta;
- primer workspace;
- primera misión;
- leads derivados a n3uralia.

## Cadencia editorial sugerida

Publicar contenido solamente cuando exista fuente y revisión suficiente.

### Prioridad 1

- bases de licitud;
- incidentes y seguridad;
- transferencias internacionales;
- decisiones automatizadas y perfiles;
- inventario de actividades de tratamiento;
- privacidad desde el diseño y por defecto.

### Prioridad 2

- guía por tamaño de empresa;
- checklist para proveedores;
- guía para áreas de personas;
- guía para SaaS y empresas tecnológicas;
- guía para servicios financieros;
- guía para salud.

Cada recurso debe incluir:

- respuesta directa;
- fundamento legal;
- fuente oficial;
- fecha de revisión;
- pasos de implementación;
- evidencia esperada;
- límites;
- enlaces a guías relacionadas;
- CTA proporcional.

## Controles editoriales

No publicar como hecho:

- clientes sin autorización;
- ahorros o ROI sin evidencia;
- porcentajes de cumplimiento opacos;
- certificaciones no obtenidas;
- conclusiones jurídicas automáticas;
- funciones que todavía están solamente en roadmap;
- fechas, multas o plazos sin fuente y versión verificadas.
