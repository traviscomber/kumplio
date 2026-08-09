import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  deriveSstOutcomeSignals,
  parseDtDs44LandingPage,
  parseSusesoCircularIndexPage,
  parseSusesoCircularPage,
} from '../supabase/functions/sst-ds44-bootstrap/core.mjs'

const dtHtml = `
<html><body>
<h2>¿Cuáles son los principales instrumentos de la Gestión Preventiva que regula este Decreto?</h2>
<ul>
<li>Matriz de Identificación de Peligros y Evaluación de Riesgos</li>
<li>Programa de Trabajo en Prevención de Riesgos Laborales</li>
<li>Información y formación en seguridad y salud en el trabajo</li>
<li>Consulta y participación de las personas trabajadoras en la gestión preventiva</li>
<li>Plan de Gestión para la reducción de Riesgos de emergencias, catástrofes o desastres en los lugares de trabajo</li>
<li>Sistema de Gestión de Seguridad y Salud en el Trabajo</li>
<li>Comités Paritarios de Higiene y Seguridad</li>
<li>Departamentos de Prevención de Riesgos</li>
<li>Reglamentos Internos</li>
<li>Mapas de Riesgos</li>
<li>Instrumentos de Gestión Preventiva para entidades empleadoras de menor tamaño</li>
</ul>
<a href="/files/ds44.pdf">Texto del Decreto N°44</a>
<a href="/files/formulario-fiscalizacion.pdf">Formulario Único de Fiscalización para el DS N°44</a>
<a href="/files/tipificador.pdf">Tipificador Infraccional de la Dirección del Trabajo</a>
<a href="/files/guia-identificacion-evaluacion-riesgos.pdf">Guía para la identificación y evaluación de riesgos en los lugares de trabajo</a>
<a href="/files/mapas-riesgos.pdf">Guía para la elaboración de mapas de riesgos laborales</a>
<a href="/files/epp.pdf">Guía para la gestión de elementos de protección personal</a>
</body></html>`

const dt = parseDtDs44LandingPage(dtHtml)
assert.equal(dt.instruments.length, 11)
assert.ok(dt.resources.some((item) => item.resourceType === 'inspection_form'))
assert.ok(dt.resources.some((item) => item.resourceType === 'infraction_typifier'))
assert.ok(dt.resources.some((item) => item.resourceType === 'risk_assessment_guidance'))
assert.ok(dt.resources.every((item) => item.url.startsWith('https://www.dt.gob.cl/')))

const indexHtml = `
<html><body>
<div><p>20/03/2026</p><a href="/612/w3-article-776436.html">Circular 3914</a><p>Coordinación y cooperación de la actividad preventiva entre entidades empleadoras que comparten un lugar de trabajo. D.S. N°44.</p></div>
<div><p>07/02/2025</p><a href="/612/w3-article-745100.html">Circular 3858</a><p>Comités Paritarios de Higiene y Seguridad en el sector público.</p></div>
<div><p>27/01/2025</p><a href="/612/w3-article-744080.html">Circular 3855</a><p>Capacitaciones, gestión de riesgos e incidentes peligrosos conforme al D.S. N°44.</p></div>
<div><p>15/01/2025</p><a href="/612/w3-article-743800.html">Circular 3854</a><p>Registros vinculados a Ley Karin.</p></div>
<div><p>10/01/2025</p><a href="/612/w3-article-743600.html">Circular 3850</a><p>Actividades de prevención de riesgos profesionales.</p></div>
</body></html>`

const discoveries = parseSusesoCircularIndexPage(indexHtml)
assert.equal(discoveries.length, 5)
assert.equal(discoveries[0].circularNumber, '3914')
assert.equal(discoveries.find((item) => item.circularNumber === '3855')?.ds44Hint, true)
assert.equal(discoveries.find((item) => item.circularNumber === '3850')?.sstRelevant, true)
assert.equal(discoveries.find((item) => item.circularNumber === '3854')?.ds44Hint, false)
assert.ok(discoveries.every((item) => item.detailUrl.startsWith('https://www.suseso.cl/')))

const circular3855 = parseSusesoCircularPage(`
<html><body><h1>Circular 3855</h1>
<p>Fecha: 27 de enero de 2025</p>
<p>Materia: Imparte instrucciones sobre las capacitaciones y el registro de la información de la gestión de riesgos y de los incidentes peligrosos.</p>
<p>Tema: LEY N°16.744</p>
<p>Destinatario: ORGANISMOS ADMINISTRADORES DEL SEGURO DE LA LEY N°16.744</p>
<p>Observación: Vigencia desde el 1 de febrero de 2025.</p>
<p>Acción: Instruye</p>
<p>Fuentes: Ley N°16.744; D.S. N°44, de 2023, del Ministerio del Trabajo y Previsión Social.</p>
<p>Departamento(s): INTENDENCIA DE SEGURIDAD Y SALUD EN EL TRABAJO - REGULACIÓN</p>
</body></html>`, 'https://www.suseso.cl/612/w3-article-744080.html')

assert.equal(circular3855.circularNumber, '3855')
assert.equal(circular3855.publicationDate, '2025-01-27')
assert.equal(circular3855.ds44Related, true)
assert.equal(circular3855.sstRelevant, true)
assert.match(circular3855.subject, /capacitaciones/i)

const signals = deriveSstOutcomeSignals({ dt, suseso: [circular3855] })
assert.equal(signals.inspectionReadiness, true)
assert.equal(signals.riskManagementEvidence, true)
assert.equal(signals.ds44OperationalGuidanceCount, 1)
assert.equal(signals.sstSupervisoryGuidanceCount, 1)
assert.ok(signals.candidateOutcomes.includes('inspection_gap_analysis'))
assert.ok(signals.candidateOutcomes.includes('training_records_incident_controls'))
assert.ok(signals.candidateOutcomes.includes('sst_supervisory_update'))

const outcomeCatalog = JSON.parse(await readFile(new URL('../data/sst-ds44-outcomes.v1.json', import.meta.url), 'utf8'))
assert.equal(outcomeCatalog.version, 1)
assert.equal(outcomeCatalog.outcomes.length, 11)
assert.ok(outcomeCatalog.statusModel.includes('human_reviewed'))
assert.ok(outcomeCatalog.statusModel.includes('evidenced'))
assert.match(outcomeCatalog.sourcePolicy.rule, /never promoted to a legal obligation/i)
assert.ok(outcomeCatalog.outcomes.every((item) => item.evidenceCandidates.length > 0 && item.artifactCandidates.length > 0))

assert.throws(
  () => parseSusesoCircularPage('<h1>Circular 1</h1>', 'https://example.com/circular'),
  /sst_suseso_host_not_allowed/,
)

console.log('SST DS44/SUSESO fixtures passed')
