# KUMPLIO Redesign Strategy - Ultra-Professional, Agent-Centric

## Current Analysis
- DocuFleet modelo: Pain Point → Solution → Outcomes → Cases de uso → Pricing
- Limpio, directo, sin narrativa innecesaria
- ROI clara para cada industria
- El problema está en el primer párrafo

## KUMPLIO Positioning: "El Control Legal Que Las Empresas Necesitan"

### Competencia Actual
- DocuFleet: Compliance documental (pasivo, documentos)
- KUMPLIO: Compliance ACTIVO (análisis, riesgos, recomendaciones)

### Diferencial
- 7 agentes IA especializados en compliance (no solo clasificación de docs)
- Análisis de RIESGOS + Recomendaciones accionables
- Monitoreo regulatorio (cambios leyes, regulaciones)
- Auditoría de cumplimiento (verificación real)

## Estructura Nueva

### Header Hero
```
Controla tu Cumplimiento Legal Antes Que Te Controle La Ley

Transporte: Cero multas. Operaciones 24/7. Auditorías listas.
Minería: Riesgos identificados. Regulaciones monitoreadas. Sanciones evitadas.

[Demo] [Empezar]
```

### 7 Agentes - Lo que hace cada uno (OUTCOMES)

1. **Sofia** (Analyzer)
   - OUTCOME: Toda obligación legal en tu negocio identificada
   - Ejemplo Transporte: Identifica 47 requisitos (RT, SOAP, seguros, licencias)
   - Ejemplo Minería: Mapea 180+ obligaciones (SONAMI, seguridad, ambiental)

2. **Elena** (Regulatory Monitor)
   - OUTCOME: Cambios regulatorios en tu inbox 24 horas después de publicarse
   - Ejemplo Transporte: Alerta cuando Ley 21.520 cambia
   - Ejemplo Minería: Monitorea Ley 21.715, Protocolo de Derechos Humanos

3. **Bruno** (Risk Assessor)
   - OUTCOME: Riesgos en dinero: ¿Cuánto puedes perder si incumples?
   - Ejemplo Transporte: "Si no tienes RT: 200 UF multa. Operación detenida = $500K/día"
   - Ejemplo Minería: "Incumplimiento seguridad: 300-500 UF + cierre operaciones"

4. **Marco** (Compliance Advisor)
   - OUTCOME: Plan de acción mes-a-mes para cumplir
   - Ejemplo Transporte: "Paso 1 (mes 1): Renovar RT. Paso 2: Auditoría SOAP"
   - Ejemplo Minería: "Implementar sistema de RRHH en 90 días"

5. **Laura** (Compliance Auditor)
   - OUTCOME: Verificación independiente: ¿Qué está fallando realmente?
   - Ejemplo Transporte: "52% de tu flota tiene documentos vencidos"
   - Ejemplo Minería: "5 incumplimientos críticos encontrados"

6. **Kai** (Continuous Learning)
   - OUTCOME: Sistema que mejora cada mes con tu data
   - Automatiza tareas repetitivas
   - Aprende de cambios legales

7. **Catarina** (NEW - Legal Reporter)
   - OUTCOME: Reportes auditables para reguladores
   - Compila evidencia de cumplimiento
   - Descarga PDF listo para inspecciones

## UI/UX Principles - SECO

1. **Una métrica por pantalla** (no dashboard abarrotado)
2. **CTA clara**: Acción → Resultado (no features vagas)
3. **Ejemplos específicos**: Siempre por industria, con números
4. **Color estratégico**: Rojo (riesgo), Verde (ok), Amarillo (atención)
5. **Tipografía**: Títulos grandes (70px), números claros, texto corto
6. **Sin iconos decorativos**: Solo iconos que comunican acción

## Landing Page Estructura

### Section 1: Problem + Hook
- Headline: "Controla tu Cumplimiento Legal Antes Que Te Controle La Ley"
- Subheading: "7 agentes IA que analizan, monitorean, y recomiendan. No solo documentos."
- CTA: [Ver Demo en Tu Industria]

### Section 2: 7 Agentes - Outcomes
Grid 7 cards:
- Cada card: 1 métrica (ej: "47 obligaciones identificadas")
- Subtitle: Qué hace
- Example: Transporte O Minería
- CTA: Ver en acción

### Section 3: Comparativa - KUMPLIO vs Status Quo
```
| Problema | Con Excel | Con KUMPLIO |
|----------|-----------|------------|
| Vencimientos que se pasan | ✗ | ✓ Alertas 30/15/5 días |
| Cambios legales que no ves | ✗ | ✓ Monitor en tiempo real |
| Riesgos sin cuantificar | ✗ | ✓ En dinero: UF/día de operación |
| Recomendaciones ad-hoc | ✗ | ✓ Plan de acción ejecutable |
```

### Section 4: Casos de Uso - Outcomes Reales
#### Caso Transporte
- Empresa: Labbe (ficción para demo)
- Antes: 15 multas/año, $200K en infracciones
- Ahora: 0 multas, auditorías lisas
- Tiempo: 3 horas/semana en compliance → 0.5 horas

#### Caso Minería  
- Empresa: Goldcorp (ficción para demo)
- Antes: Riesgo regulatorio 45/100
- Ahora: Riesgo 8/100
- Economía: Evitó multa de $1.2M

### Section 5: Pricing (Simple)
```
Por agente (paga solo lo que usas)
- Sofia (Analysis): $200/mes
- Elena (Monitor): $300/mes
- Bruno (Risk): $250/mes
- Marco (Advisor): $400/mes
- Laura (Audit): $350/mes
- Kai (Learning): $150/mes
- Catarina (Reports): $200/mes

Total: $1,850/mes
O Bundle COMPLETO: $999/mes (46% descuento)
```

### Section 6: Trust
- Banco Estado integrado (verificar)
- Supabase enterprise security
- Conforme a Ley 21.719
- Auditoría SOC 2 (roadmap)

## Color Palette - Profesional y Legal
- Primary: Azul marino (#001F3F) - Autoridad legal
- Accent: Rojo (#DC2626) - Riesgo/Alerta
- Success: Verde (#15803D) - Cumplimiento
- Neutral: Gris (#111827) - Fondo
- White: Blanco (#FFFFFF) - Limpieza

## Typography
- H1: 72px, 900 weight (headlines)
- H2: 48px, 700 weight (agentes)
- H3: 32px, 600 weight (outcomes)
- Body: 16px, 400 weight, 1.6 line height
- Números: 24px, 700 weight (métricas)

## Omitir Completamente
- Decoraciones
- Gradientes
- Animaciones innecesarias
- Textos sobre textos
- Iconos sin propósito
- Jargon técnico que no sea vendedor

## Estructura de Archivos

```
app/
├── page.tsx (NEW - Landing principal)
├── demo/
│   ├── transporte/page.tsx (Demo Transporte)
│   └── mineria/page.tsx (Demo Minería)
components/
├── landing/
│   ├── hero.tsx
│   ├── agents-grid.tsx
│   ├── comparison.tsx
│   ├── case-studies.tsx
│   ├── pricing.tsx
│   └── trust.tsx
```

## Success Metrics
- Landing: CTR > 8% a "Ver Demo"
- Demo pages: Tiempo promedio > 3 min
- Conversión: 15% de visitors a sign-up
- SAC: < $50/cliente (Ley 21.719 es justo legal, high LTV)
