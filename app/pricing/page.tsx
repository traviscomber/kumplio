'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import { useRouter } from 'next/navigation'

const plans = [
  {
    name: 'Starter',
    price: '$99',
    period: '/mes',
    description: 'Para empresas pequeñas (1-50 empleados)',
    cta: 'Empezar Gratis',
    highlighted: false,
    outcomes: [
      { text: 'Hasta 47 obligaciones mapeadas', main: true },
      { text: '1 agente: Sofia (análisis básico)', main: false },
      { text: 'Alertas de cambios regulatorios', main: false },
      { text: 'Reportes mensuales', main: false },
      { text: 'Email support', main: false },
    ],
    notIncluded: [
      'Evaluación de riesgos (Bruno)',
      'Planes de acción (Marco)',
      'Auditoría independiente (Laura)',
      'Reportes PDF para reguladores',
    ]
  },
  {
    name: 'Professional',
    price: '$299',
    period: '/mes',
    description: 'Para empresas medianas (50-500 empleados)',
    cta: 'Empezar Gratis',
    highlighted: true,
    badge: 'Más Popular',
    outcomes: [
      { text: '180+ obligaciones mapeadas', main: true },
      { text: '4 agentes: Sofia, Elena, Bruno, Marco', main: false },
      { text: 'Monitoreo 24/7 de regulaciones', main: false },
      { text: 'Evaluación de riesgos en dinero (UF)', main: false },
      { text: 'Planes de acción priorizados (90 días)', main: false },
      { text: 'Priority email + chat support', main: false },
    ],
    notIncluded: [
      'Auditoría independiente (Laura)',
      'Reportes PDF auditables',
      'Integración con sistemas',
    ]
  },
  {
    name: 'Enterprise',
    price: '$799',
    period: '/mes',
    description: 'Para empresas grandes (500+ empleados)',
    cta: 'Contactar Ventas',
    highlighted: false,
    outcomes: [
      { text: '180+ obligaciones + industrias específicas', main: true },
      { text: 'Todos los 7 agentes (Sofia a Catarina)', main: false },
      { text: 'Auditoría independiente continuada (Laura)', main: false },
      { text: 'Reportes PDF 1-click para reguladores', main: false },
      { text: 'Roadmap personalizado (Kai - mejora continua)', main: false },
      { text: 'Account manager dedicado', main: false },
      { text: 'Integración con ERP/contabilidad', main: false },
      { text: 'SLA: 99.9% uptime', main: false },
    ],
    notIncluded: []
  }
]

export default function PricingPage() {
  const router = useRouter()

  return (
    <div className="bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white text-sm font-bold">K</span>
            </div>
            <span className="font-bold text-lg">KUMPLIO</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm hover:text-primary transition">Inicio</a>
            <Button size="sm" variant="outline" asChild>
              <a href="/sign-in">Acceder</a>
            </Button>
          </div>
        </div>
      </nav>

      {/* PRICING SECTION */}
      <section className="pt-32 pb-24 px-6">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="text-center space-y-4 mb-16">
            <h1 className="text-5xl md:text-6xl font-bold">Planes Simples y Claros</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Elige el plan que mejor se adapta a tu empresa. Todos incluyen acceso a la plataforma KUMPLIO completa.
            </p>
          </div>

          {/* Pricing Grid */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-lg border transition-all ${
                  plan.highlighted
                    ? 'border-primary bg-primary/5 lg:scale-105 shadow-lg'
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-6">
                    <Badge className="bg-primary">{plan.badge}</Badge>
                  </div>
                )}

                <div className="p-8 space-y-8">
                  {/* Plan Name & Price */}
                  <div className="space-y-3">
                    <h2 className="text-2xl font-bold">{plan.name}</h2>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black">{plan.price}</span>
                      <span className="text-sm text-muted-foreground">{plan.period}</span>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Button
                    className="w-full"
                    variant={plan.highlighted ? 'default' : 'outline'}
                    onClick={() => router.push('/sign-up')}
                  >
                    {plan.cta}
                  </Button>

                  {/* Included Features */}
                  <div className="border-t pt-8 space-y-4">
                    <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Incluido en {plan.name}
                    </p>
                    <ul className="space-y-3">
                      {plan.outcomes.map((outcome, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${outcome.main ? 'text-primary' : 'text-green-600'}`} />
                          <span className={outcome.main ? 'font-semibold text-base' : 'text-sm text-muted-foreground'}>
                            {outcome.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Not Included */}
                  {plan.notIncluded.length > 0 && (
                    <div className="border-t pt-4">
                      <p className="text-xs text-muted-foreground mb-2">No incluido:</p>
                      <ul className="space-y-1">
                        {plan.notIncluded.map((item, idx) => (
                          <li key={idx} className="text-xs text-muted-foreground line-through">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Comparison Table */}
          <div className="mt-20 border-t pt-16">
            <h3 className="text-3xl font-bold mb-8">Comparativa Completa</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-4 font-semibold">Feature</th>
                    <th className="text-center py-4 px-4 font-semibold">Starter</th>
                    <th className="text-center py-4 px-4 font-semibold">Professional</th>
                    <th className="text-center py-4 px-4 font-semibold">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'Agentes disponibles', starter: '1', pro: '4', ent: '7' },
                    { feature: 'Obligaciones mapeadas', starter: '47', pro: '180+', ent: '180+ (personalizado)' },
                    { feature: 'Monitoreo regulatorio', starter: 'No', pro: '24/7', ent: '24/7' },
                    { feature: 'Evaluación de riesgos', starter: 'No', pro: 'Sí', ent: 'Sí' },
                    { feature: 'Planes de acción', starter: 'No', pro: 'Sí (3 fases)', ent: 'Sí (personalizado)' },
                    { feature: 'Auditoría independiente', starter: 'No', pro: 'No', ent: 'Sí (continuada)' },
                    { feature: 'Reportes para reguladores', starter: 'Básicos', pro: 'Sí', ent: 'PDF auditables' },
                    { feature: 'Usuarios', starter: '1', pro: '5', ent: 'Ilimitados' },
                    { feature: 'Support', starter: 'Email', pro: 'Email + Chat', ent: 'Account Manager' },
                    { feature: 'SLA', starter: '95%', pro: '99%', ent: '99.9%' },
                  ].map((row, idx) => (
                    <tr key={idx} className="border-b border-border hover:bg-card/50 transition">
                      <td className="py-4 px-4 font-medium">{row.feature}</td>
                      <td className="text-center py-4 px-4 text-muted-foreground">{row.starter}</td>
                      <td className="text-center py-4 px-4 text-muted-foreground">{row.pro}</td>
                      <td className="text-center py-4 px-4 font-semibold">{row.ent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-20 border-t pt-16">
            <h3 className="text-3xl font-bold mb-8">Preguntas Frecuentes</h3>
            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  q: '¿Puedo cambiar de plan después?',
                  a: 'Sí. Puedes upgrade o downgrade en cualquier momento. Los cambios se reflejan en tu próximo ciclo de facturación.'
                },
                {
                  q: '¿Hay período de prueba?',
                  a: 'Sí. 14 días gratis para todos los planes. No se requiere tarjeta de crédito.'
                },
                {
                  q: '¿Qué es el SLA?',
                  a: 'Es el acuerdo de nivel de servicio. Garantizamos disponibilidad mínima de la plataforma.'
                },
                {
                  q: '¿Puedo tener más usuarios?',
                  a: 'En Professional y Enterprise sí. En Starter está limitado a 1 usuario, pero puedes contactarnos para más.'
                },
              ].map((faq, idx) => (
                <div key={idx} className="space-y-2">
                  <h4 className="font-semibold">{faq.q}</h4>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Final CTA */}
          <div className="mt-20 bg-primary/5 border border-primary/20 rounded-lg p-12 text-center space-y-6">
            <h3 className="text-3xl font-bold">¿No estás seguro cuál plan es el correcto?</h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Contáctanos. Te ayudamos a elegir el plan perfecto según el tamaño de tu empresa y necesidades específicas.
            </p>
            <Button size="lg" asChild>
              <a href="/contact">Hablar con un especialista</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6 bg-card">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <p className="font-semibold mb-3">Producto</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/" className="hover:text-foreground transition">Inicio</a></li>
                <li><a href="/pricing" className="hover:text-foreground transition">Pricing</a></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-3">Legal</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition">Privacidad</a></li>
                <li><a href="#" className="hover:text-foreground transition">Términos</a></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-3">Empresa</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition">Sobre n3uralia</a></li>
              </ul>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">© 2026 KUMPLIO by n3uralia.com</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
