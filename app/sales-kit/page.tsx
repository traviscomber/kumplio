'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Copy, Download } from 'lucide-react'
import { useState } from 'react'
import { Footer } from '@/components/footer'

export const dynamic = 'force-dynamic'

const scripts = [
  {
    name: 'Opening - Transporte',
    scenario: 'Initial outreach email',
    text: `Hola [Nombre],

Vi que Labbe es una empresa de logística. Un colega mío en el sector transporte mencionó que maneja 50+ vehículos activos.

Tengo una pregunta: ¿cuántas multas por incumplimiento regulatorio (RT, SOAP, permisos) han recibido en el último año?

La razón pregunto es porque trabajamos con empresas como Labbe que redujeron sus multas de 15/año a CERO en 5 meses usando nuestro sistema KUMPLIO.

¿Vale 15 minutos para mostrar cómo?

[LINK DEMO]`,
  },
  {
    name: 'Objection: "Ya tenemos Excel"',
    scenario: 'Prospect says they manage compliance in Excel',
    text: `Entiendo, muchas empresas comienzan así. La diferencia es que Excel no:

• Monitorea cambios regulatorios 24/7 (Ley 21.719 cambia cada 2-3 meses)
• Calcula el riesgo financiero automáticamente ($1.2M de exposición típicamente)
• Genera planes de acción priorizados (con viabilidad, timeline, responsables)
• Audita si realmente estás cumpliendo (Laura verifica el estado REAL)

Labbe pasó de 52% de obligaciones cumpliéndose a 100% en 3 meses.

¿Tengo 15 minutos para mostrarte la diferencia real?`,
  },
  {
    name: 'Objection: "Muy caro"',
    scenario: 'Prospect mentions budget concerns',
    text: `Aquí está el número: Labbe ahorraba $200K/año en multas. Labbe pagaba $299/mes con nosotros (inicio) = $3,588/año.

Retorno: $200K ahorrados - $3.6K = $196K neto el PRIMER año.

Pero la verdad es: la mayoría comienza con Starter ($99/mes) para mapear obligaciones y medir el impacto real. Luego escalan si ven valor.

¿Empezamos pequeño? 14 días gratis, sin tarjeta.`,
  },
  {
    name: 'Close: Demo transporte',
    scenario: 'Ready to move to demo',
    text: `Perfecto. Te voy a mostrar:

1. Cómo mapeamos las 47 obligaciones específicas del transporte (RT, SOAP, licencias, seguros, etc)
2. Cómo monitoreamos cambios regulatorios automáticamente (no más sorpresas)
3. El plan de acción que creó Labbe (90 días → cumplimiento 100%)
4. Cuánto ahorraría tu empresa en multas

Voy a usar el caso de Labbe como ejemplo real.

¿Lunes a las 14hrs o te viene mejor otra hora?`,
  },
]

const emailTemplates = [
  {
    name: 'Cold Email Inicial',
    subject: 'Labbe pasó de 15 multas a 0 en 5 meses',
    body: `Hola [Nombre],

Trabajo con empresas de transporte que tienen entre 30-300 vehículos activos.

Un colega mencionó que [Empresa] opera en [región]. Supongo que manejan:
- Revisiones técnicas periódicas
- Permisos de circulación vigentes
- Licencias de conducción actualizadas
- Seguros y cobertura legal

Aquí está mi pregunta directa: ¿cuántas multas o infracciones por incumplimiento reciben al año?

Pregunto porque trabajamos con Labbe Logística. Pasaron de 15 multas/año ($200K en infracciones) a CERO en 5 meses.

La solución: nuestro sistema de 7 agentes IA que monitorean, evalúan y previenen incumplimientos automáticamente.

¿Vale 15 minutos?

[LINK DEMO TRANSPORTE]

[Firma]`,
  },
  {
    name: 'Follow-up (Dia 3)',
    subject: '[FOLLOW-UP] Sistema anti-multas para transporte',
    body: `Hola [Nombre],

No sé si recibiste mi email anterior sobre cómo reducir multas regulatorias.

Pensé que podría interesarte porque la mayoría de empresas de transporte que no actúan pierden:
- $200-500K/año en multas y sanciones
- 10-15 horas/semana en compliance manual
- Reputación con clientes (auditorías fallidas)

Labbe fue diferente. En 90 días:
De 15 multas → 0 multas
De $200K expuesto → Controlado
De 15 hrs/sem → 1 hora/mes

No es magia. Solo tecnología.

¿Hablamos?

[LINK DEMO]

[Firma]`,
  },
]

const objectionHandling = [
  {
    objection: '"¿Cómo sé que funciona?"',
    response: 'Tengo 2 empresas como referencia (Labbe, Goldcorp). Pero mejor: te doy acceso gratis 14 días. Tú auditas, no me crees a mí.',
  },
  {
    objection: '"Somos pequeños, no aplica"',
    response: 'Labbe comenzó con 30 vehículos. Hoy tiene 150. Comenzó con Starter ($99), escaló a Professional ($299). Sin riesgos.',
  },
  {
    objection: '"Nuestro abogado maneja esto"',
    response: 'Un abogado es reactivo (defiende multas después). Somos proactivos (prevenimos la multa ANTES). Se complementan, no compiten.',
  },
  {
    objection: '"¿Qué pasa si tengo una inspección mañana?"',
    response: 'Catarina (nuestro agente legal) te genera reportes PDF en 1 click listos para reguladores. Auditables, creíbles, completos.',
  },
]

export default function OutreachPage() {
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          {/* LOGO */}
          <a href="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white text-sm font-bold">K</span>
            </div>
            <span className="font-bold text-lg">KUMPLIO</span>
          </a>

          {/* CENTER LINKS */}
          <div className="hidden md:flex items-center gap-8">
            <a href="/" className="text-sm hover:text-primary transition">Inicio</a>
            <a href="/pricing" className="text-sm hover:text-primary transition">Precios</a>
            <a href="/demo/transporte" className="text-sm hover:text-primary transition">Transporte</a>
            <a href="/demo/mineria" className="text-sm hover:text-primary transition">Minería</a>
            <a href="/sales-kit" className="text-sm font-semibold text-primary">Recursos</a>
          </div>

          {/* RIGHT BUTTONS */}
          <div className="flex items-center gap-4">
            <a href="/sign-in" className="text-sm hover:text-primary transition">Acceder</a>
            <Button size="sm" asChild>
              <a href="/sign-up">Empezar</a>
            </Button>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-32 pb-24 px-6">
        <div className="container mx-auto max-w-4xl text-center space-y-4">
          <Badge className="w-fit mx-auto">Para SDRs y Sales Reps</Badge>
          <h1 className="text-5xl md:text-6xl font-bold">Argumentario KUMPLIO</h1>
          <p className="text-xl text-muted-foreground">
            Scripts, email templates, y manejo de objeciones para vender KUMPLIO de forma efectiva.
          </p>
        </div>
      </section>

      {/* Scripts Section */}
      <section className="px-6 py-24 border-t border-border">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">Llamadas Telefónicas: Scripts</h2>
          <div className="space-y-6">
            {scripts.map((script) => (
              <div key={script.name} className="bg-card border border-border rounded-lg p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-lg">{script.name}</h3>
                    <p className="text-sm text-muted-foreground">{script.scenario}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(script.text, script.name)}
                    className="text-muted-foreground hover:text-primary transition"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
                <pre className="bg-secondary p-4 rounded text-xs overflow-x-auto text-foreground whitespace-pre-wrap break-words font-mono">
                  {script.text}
                </pre>
                {copied === script.name && (
                  <p className="text-xs text-green-600 font-semibold">Copiado al clipboard</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Email Templates */}
      <section className="px-6 py-24 border-t border-border">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">Email Templates</h2>
          <div className="space-y-6">
            {emailTemplates.map((email) => (
              <div key={email.name} className="bg-card border border-border rounded-lg p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{email.name}</h3>
                    <p className="text-sm text-muted-foreground">Asunto: {email.subject}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(email.body, email.name)}
                    className="text-muted-foreground hover:text-primary transition"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
                <pre className="bg-secondary p-4 rounded text-xs overflow-x-auto text-foreground whitespace-pre-wrap break-words font-mono">
                  {email.body}
                </pre>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Objection Handling */}
      <section className="px-6 py-24 border-t border-border">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">Manejo de Objeciones</h2>
          <div className="space-y-6">
            {objectionHandling.map((item, idx) => (
              <div key={idx} className="bg-card border border-border rounded-lg p-6 space-y-3">
                <h3 className="font-bold text-red-600">{item.objection}</h3>
                <p className="text-foreground">{item.response}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="px-6 py-24 border-t border-border">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">Recursos Descargables</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <a
              href="/resources/sales-deck.pdf"
              className="flex items-center justify-between p-6 rounded-lg border border-border hover:border-primary bg-card hover:bg-primary/5 transition"
            >
              <div>
                <p className="font-semibold">Sales Deck PDF</p>
                <p className="text-sm text-muted-foreground">Presentación de 20 slides</p>
              </div>
              <Download className="w-5 h-5 text-muted-foreground" />
            </a>
            <a
              href="/resources/case-studies.pdf"
              className="flex items-center justify-between p-6 rounded-lg border border-border hover:border-primary bg-card hover:bg-primary/5 transition"
            >
              <div>
                <p className="font-semibold">Case Studies</p>
                <p className="text-sm text-muted-foreground">Labbe + Goldcorp en detalle</p>
              </div>
              <Download className="w-5 h-5 text-muted-foreground" />
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
