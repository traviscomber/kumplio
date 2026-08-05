# Kumplio Product Canon 1.0

## 1. Propósito

Kumplio convierte información compleja en decisiones claras, trabajo ejecutable y memoria verificable.

La promesa central es:

> Entender qué requiere atención, decidir con evidencia y demostrar lo realizado.

Kumplio no compite por tener más módulos. Compite por reducir incertidumbre, tiempo perdido y riesgo.

## 2. Audiencias

### Personas

Personas naturales que necesitan entender contratos, derechos, obligaciones, impuestos, patrimonio, trabajo, familia o vida digital.

Promesa:

> Entiende qué te afecta y qué puedes hacer antes de que se convierta en un problema.

### Empresas

Organizaciones que necesitan detectar cambios, comprender impacto, coordinar trabajo y conservar evidencia.

Promesa:

> Tu organización siempre sabe qué requiere atención y cuál es el siguiente paso.

### Profesionales

Abogados, contadores, auditores, consultores, DPO, prevencionistas y especialistas que atienden múltiples clientes.

Promesa:

> Atiende más clientes con mayor consistencia, trazabilidad y tiempo disponible.

### Industrias

Sectores regulados que requieren conocimiento especializado: salud, financiero, minería, construcción, educación, transporte, retail, agro y tecnología.

Promesa:

> Opera con conocimiento específico del sector sin reconstruir el cumplimiento desde cero.

## 3. Prioridad comercial

1. Empresas.
2. Profesionales.
3. Personas mediante soluciones concretas.
4. Industrias mediante verticales especializadas.

La existencia de las cuatro audiencias no significa lanzar todo al mismo tiempo.

## 4. Arquitectura pública del sitio

La navegación pública debe organizarse por quién obtiene valor:

- Personas
- Empresas
- Profesionales
- Industrias
- Recursos
- Precios

No se organiza por arquitectura interna, motores, agentes o tablas.

## 5. Clasificaciones de valor

### Personas

- Vida digital y datos personales
- Trabajo
- Patrimonio
- Impuestos
- Familia
- Consumo y contratos

### Empresas

- Recursos Humanos
- Protección de Datos
- Tributario
- Seguridad y prevención
- Operaciones
- Proveedores
- Riesgos y auditoría
- Gobierno y directorio

### Profesionales

- Abogados
- Contadores
- Auditores
- Consultores
- DPO y privacidad
- Cumplimiento
- Prevención de riesgos

### Industrias

- Salud
- Financiero
- Minería
- Construcción
- Educación
- Transporte
- Retail
- Agro
- Tecnología

## 6. Modelo mental del producto

El usuario no navega por módulos. Navega por decisiones.

Flujo principal:

Fuente → cambio → impacto → decisión → trabajo → resultado → memoria

La interfaz debe esconder la complejidad técnica y mostrar únicamente lo necesario para actuar.

## 7. Experiencias maestras

### Morning Brief

En menos de tres minutos, el usuario entiende:

- qué cambió;
- qué requiere atención;
- cuánto tiempo tomará;
- qué está bajo control.

### Decision Workspace

Una pantalla, una decisión. Debe responder:

- por qué aparece;
- qué cambió;
- qué impacto tiene;
- qué pasa si no se actúa;
- qué evidencia existe;
- qué se recomienda;
- quién decide.

### Organization Memory

Cada decisión conserva:

- responsable;
- fecha;
- fundamento;
- evidencia;
- resultado;
- aprendizaje;
- precedente reutilizable.

## 8. Fuentes y conocimiento

Una fuente solo entra si cumple al menos dos de estos criterios:

- aporta contexto relevante;
- ahorra trabajo manual;
- habilita una decisión;
- mejora trazabilidad;
- reduce riesgo.

Prioridad inicial de fuentes oficiales chilenas:

- Diario Oficial
- BCN / LeyChile
- Dirección del Trabajo
- SII
- Tesorería General de la República
- CMF
- SUSESO
- Superintendencia del Medio Ambiente
- SEA
- SEC
- Superintendencia de Salud
- Superintendencia de Pensiones
- SUBTEL
- ChileCompra / Mercado Público
- Consejo para la Transparencia

Las fuentes se integran por valor de decisión, no por cantidad.

## 9. Lenguaje

Usar:

- qué cambió;
- qué afecta;
- qué requiere atención;
- qué evidencia existe;
- qué decisión corresponde;
- qué quedó resuelto;
- qué aprendimos.

Evitar en la primera capa:

- dashboard;
- GRC;
- agentes;
- embeddings;
- pipelines;
- arquitectura;
- inteligencia organizacional;
- ejecución verificable sin contexto.

La tecnología se explica después del valor.

## 10. Reglas de diseño

- Una pantalla, una pregunta principal.
- Una acción primaria por pantalla.
- La evidencia antes que la opinión.
- La persona mantiene el control.
- La complejidad vive en el sistema, no en la interfaz.
- Todo resultado relevante debe poder explicarse.
- Todo cambio debe reducir fricción, riesgo o tiempo.
- Si una función no mejora una decisión, no entra.

## 11. Qué no promete Kumplio

- No declara automáticamente que una persona u organización cumple.
- No reemplaza asesoría jurídica, contable, técnica ni auditoría independiente.
- No presenta una recomendación como verdad sin fuentes y contexto.
- No automatiza decisiones sensibles sin revisión humana.

## 12. Criterio de cierre

La versión comercial inicial está lista cuando:

- la propuesta se entiende en menos de 30 segundos;
- Morning Brief funciona con datos reales;
- una decisión puede resolverse de extremo a extremo;
- la evidencia queda trazable;
- onboarding, permisos, estados vacíos y errores son claros;
- Vercel está estable;
- Supabase aplica aislamiento por organización;
- existe una demostración realista y un recorrido de venta;
- no quedan funciones críticas simuladas.

## 13. Filtro para cualquier cambio

Antes de aprobar una funcionalidad, responder:

1. ¿Quién obtiene valor?
2. ¿Qué problema concreto resuelve?
3. ¿Qué decisión mejora?
4. ¿Qué elimina o simplifica?
5. ¿Puede explicarse con evidencia?
6. ¿Es necesaria para vender u operar la versión actual?

Si las respuestas no son claras, el cambio queda fuera del producto.
