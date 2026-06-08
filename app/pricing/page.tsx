'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'

export const dynamic = 'force-dynamic'

const plans = [
  {
    name: 'Starter',
    price: 'UF 3',
    usdPrice: '$110',
    period: '/mes',
    description: 'Para empresas pequeñas (1-50 empleados)',
    example: 'Transporte básico, análisis de obligaciones',
    cta: 'Empezar Gratis',
    highlighted: false,
    outcomes: [
      { text: 'Hasta 47 obligaciones mapeadas (Transporte)', main: true },
      { text: '1 agente: Isidora (análisis básico)', main: false },
      { text: 'Alertas de cambios regulatorios', main: false },
      { text: 'Reportes mensuales', main: false },
      { text: 'Email support', main: false },
    ],
    notIncluded: [
      'Evaluación de riesgos (Javier)',
      'Planes de acción (Beatriz)',
      'Auditoría independiente (Verónica)',
      'Reportes PDF certificados',
    ]
  },
  {
    name: 'Professional',
    price: 'UF 8',
    usdPrice: '$290',
    period: '/mes',
    description: 'Para empresas medianas (50-500 empleados)',
    example: 'Transporte y minería - Caso Labbe & Goldcorp',
    cta: 'Empezar Gratis',
    highlighted: true,
    badge: 'Más Popular',
    outcomes: [
      { text: '180+ obligaciones mapeadas', main: true },
      { text: '4 agentes: Isidora, Rodrigo, Javier, Beatriz', main: false },
      { text: 'Monitoreo 24/7 de regulaciones chilenas', main: false },
      { text: 'Evaluación de riesgos en UF/dinero', main: false },
      { text: 'Planes de acción priorizados 90 días', main: false },
      { text: 'Support WhatsApp + chat prioritario', main: false },
    ],
    notIncluded: [
      'Auditoría independiente (Verónica)',
      'Reportes PDF SERNAGEOMIN',
      'Integración ERP',
    ]
  },
  {
    name: 'Enterprise',
    price: 'UF 22',
    usdPrice: '$800',
    period: '/mes',
    description: 'Para empresas grandes (500+ empleados)',
    example: 'Minería: Risk 52→8, $1.2M evitados en 90 días',
    cta: 'Contactar Ventas',
    highlighted: false,
    outcomes: [
      { text: 'Obligaciones ilimitadas + personalización', main: true },
      { text: 'Todos los 7 agentes + Andrés (mejora continua)', main: false },
      { text: 'Auditoría independiente continua', main: false },
      { text: 'Reportes PDF certificados SERNAGEOMIN', main: false },
      { text: 'Roadmap personalizado + mejora mensual', main: false },
      { text: 'Account manager dedicado + SLA 99.9%', main: false },
      { text: 'Integración ERP, Contabilidad, RRHH', main: false },
    ],
    notIncluded: []
  }
]

export default function PricingPage() {
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
            <a href="/pricing" className="text-sm font-semibold text-primary">Precios</a>
            <a href="/demo/transporte" className="text-sm hover:text-primary transition">Transporte</a>
            <a href="/demo/mineria" className="text-sm hover:text-primary transition">Minería</a>
            <a href="/webinars" className="text-sm hover:text-primary transition">Webinars</a>
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

      {/* PRICING SECTION */}
      <section className="pt-32 pb-24 px-6">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="text-center space-y-4 mb-16">
            <h1 className="text-5xl md:text-6xl font-bold">Planes en UF - Precios Chile</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Elige el plan que se adapta a tu empresa. Todos incluyen acceso a la plataforma KUMPLIO completa.
            </p>
            <p className="text-sm text-muted-foreground">UF Valor: $36.53 (Aproximado Julio 2026)</p>
          </div>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {plans.map((plan, idx) => (
              <div
                key={idx}
                className={`relative rounded-lg border p-8 transition-all ${
                  plan.highlighted
                    ? 'border-primary bg-primary/5 md:scale-105 shadow-lg'
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-6">
                    <Badge className="bg-primary">{plan.badge}</Badge>
                  </div>
                )}

                {/* Plan Name & Price */}
                <div className="space-y-3 mb-8">
                  <h2 className="text-2xl font-bold">{plan.name}</h2>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                  {plan.usdPrice && (
                    <p className="text-xs text-muted-foreground">≈ {plan.usdPrice}/mes (USD)</p>
                  )}
                  {plan.example && (
                    <p className="text-xs text-primary pt-2 font-semibold italic">{plan.example}</p>
                  )}
                </div>

                {/* CTA Button */}
                <Button
                  className="w-full mb-8"
                  variant={plan.highlighted ? 'default' : 'outline'}
                  onClick={() => router.push('/sign-up')}
                >
                  {plan.cta}
                </Button>

                {/* Included Features */}
                <div className="border-t pt-8 space-y-4 mb-8">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Incluido en {plan.name}
                  </p>
                  <ul className="space-y-3">
                    {plan.outcomes.map((outcome, oidx) => (
                      <li key={oidx} className="flex items-start gap-3">
                        <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${outcome.main ? 'text-primary' : 'text-green-600'}`} />
                        <span className={outcome.main ? 'font-semibold text-sm' : 'text-sm text-muted-foreground'}>
                          {outcome.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Not Included */}
                {plan.notIncluded.length > 0 && (
                  <div className="space-y-3 border-t pt-8">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      No incluido
                    </p>
                    <ul className="space-y-2">
                      {plan.notIncluded.map((item, nidx) => (
                        <li key={nidx} className="text-xs text-muted-foreground">
                          • {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ROI Section */}
          <div className="bg-card border border-border rounded-lg p-8 mb-16">
            <h2 className="text-2xl font-bold mb-8">ROI Estimado por Industria</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Transporte (Labbe Logística)</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold">Antes:</span> UF 600/año en multas, 15 hrs/sem</p>
                  <p><span className="font-semibold">Plan:</span> Professional (UF 8/mes = UF 96/año)</p>
                  <p><span className="font-semibold">Ahorro:</span> UF 504/año (~$18,400 USD)</p>
                  <p><span className="font-semibold text-green-600">ROI: 5 meses</span></p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Minería (Goldcorp Chile)</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold">Antes:</span> UF 5,000+ exposición, Risk 52/100</p>
                  <p><span className="font-semibold">Plan:</span> Enterprise (UF 22/mes = UF 264/año)</p>
                  <p><span className="font-semibold">Ahorro:</span> UF 4,736/año (~$173K USD)</p>
                  <p><span className="font-semibold text-green-600">ROI: 2 meses</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">Preguntas Frecuentes</h2>
            <div className="space-y-6">
              {[
                {
                  q: '¿Incluye capacitación?',
                  a: 'Sí, todos los planes incluyen onboarding completo y acceso a webinars de capacitación. Enterprise incluye training personalizado.'
                },
                {
                  q: '¿Puedo cambiar de plan?',
                  a: 'Sí, puedes cambiar en cualquier momento. Si subes de plan pagas la diferencia prorrateada. Si bajas, se ajusta al siguiente ciclo.'
                },
                {
                  q: '¿Qué pasa después del trial gratis?',
                  a: 'El trial es de 14 días sin tarjeta requerida. Si decides no continuar, simplemente no te cobramos. Si continúas, se activa tu suscripción mensual.'
                },
                {
                  q: '¿Cómo se factua?',
                  a: 'Facturamos mensualmente en UF. Puedes pagar por transferencia bancaria o tarjeta de crédito. Emitimos factura electrónica completa.'
                }
              ].map((item, idx) => (
                <div key={idx} className="border-b pb-4">
                  <p className="font-semibold mb-2">{item.q}</p>
                  <p className="text-sm text-muted-foreground">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-2xl text-center space-y-8">
          <h2 className="text-4xl font-bold">¿Listo para empezar?</h2>
          <p className="text-lg opacity-90">14 días gratis. Sin tarjeta de crédito. Acceso completo a todos los agentes.</p>
          <Button size="lg" className="bg-primary-foreground text-primary hover:bg-white/90" asChild>
            <a href="/sign-up">Comienza tu prueba gratis</a>
          </Button>
        </div>
      </section>
    </div>
  )
}
