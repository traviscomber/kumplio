'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Check, ArrowLeft, Lock, ShieldCheck, Loader2 } from 'lucide-react'

const PLAN_CATALOG: Record<
  string,
  {
    name: string
    priceUF: number
    priceCLP: number
    period: string
    description: string
    features: string[]
  }
> = {
  starter: {
    name: 'Starter',
    priceUF: 3,
    priceCLP: 109590,
    period: '/mes',
    description: 'Para empresas pequeñas (1-50 empleados)',
    features: [
      'Hasta 47 obligaciones mapeadas',
      '1 agente: Isidora (análisis básico)',
      'Alertas de cambios regulatorios',
      'Reportes mensuales',
      'Email support',
    ],
  },
  professional: {
    name: 'Professional',
    priceUF: 8,
    priceCLP: 292240,
    period: '/mes',
    description: 'Para empresas medianas (50-500 empleados)',
    features: [
      '180+ obligaciones mapeadas',
      '4 agentes: Isidora, Rodrigo, Javier, Beatriz',
      'Monitoreo 24/7 de regulaciones chilenas',
      'Evaluación de riesgos en UF/dinero',
      'Planes de acción priorizados 90 días',
      'Support WhatsApp + chat prioritario',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    priceUF: 22,
    priceCLP: 803660,
    period: '/mes',
    description: 'Para empresas grandes (500+ empleados)',
    features: [
      'Obligaciones ilimitadas + personalización',
      'Todos los 7 agentes + Andrés',
      'Auditoría independiente continua',
      'Reportes PDF certificados SERNAGEOMIN',
      'Account manager dedicado + SLA 99.9%',
      'Integración ERP, Contabilidad, RRHH',
    ],
  },
}

const formatCLP = (n: number) => new Intl.NumberFormat('es-CL').format(n)

export function CartContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const planKey = (searchParams.get('plan') || 'professional').toLowerCase()
  const plan = PLAN_CATALOG[planKey] || PLAN_CATALOG.professional

  const [billing, setBilling] = useState<'mensual' | 'anual'>('mensual')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    empresa: '',
    rut: '',
  })

  // 2 meses gratis al pagar anual
  const monthlyUF = plan.priceUF
  const monthlyCLP = plan.priceCLP
  const annualUF = plan.priceUF * 10
  const annualCLP = plan.priceCLP * 10

  const displayUF = billing === 'anual' ? annualUF : monthlyUF
  const displayCLP = billing === 'anual' ? annualCLP : monthlyCLP
  const ivaCLP = Math.round(displayCLP * 0.19)
  const totalCLP = displayCLP + ivaCLP

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Simula creación de orden / checkout
    await new Promise((r) => setTimeout(r, 1400))
    setLoading(false)
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">¡Orden confirmada!</h1>
            <p className="text-muted-foreground">
              Tu plan <span className="text-foreground font-semibold">{plan.name}</span> está
              listo. Te enviamos los detalles de acceso a{' '}
              <span className="text-foreground font-semibold">{form.email}</span>.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <Button size="lg" onClick={() => router.push('/dashboard')}>
              Ir al Dashboard
            </Button>
            <Button size="lg" variant="outline" onClick={() => router.push('/')}>
              Volver al inicio
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-bold">K</span>
            </div>
            <span className="font-bold text-lg">KUMPLIO</span>
          </a>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="w-4 h-4" />
            Pago seguro
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-6xl">
        <button
          onClick={() => router.push('/pricing')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a planes
        </button>

        <h1 className="text-3xl md:text-4xl font-bold mb-2">Finalizar compra</h1>
        <p className="text-muted-foreground mb-10">
          Estás a un paso de activar tu cumplimiento con KUMPLIO.
        </p>

        <div className="grid lg:grid-cols-[1fr_400px] gap-8 items-start">
          {/* LEFT: Billing form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Billing cycle */}
            <section className="rounded-lg border border-border bg-card p-6">
              <h2 className="font-semibold mb-4">Ciclo de facturación</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setBilling('mensual')}
                  className={`text-left rounded-lg border p-4 transition-all ${
                    billing === 'mensual'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Mensual</span>
                    {billing === 'mensual' && <Check className="w-4 h-4 text-primary" />}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    UF {monthlyUF}/mes
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setBilling('anual')}
                  className={`text-left rounded-lg border p-4 transition-all relative ${
                    billing === 'anual'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Anual</span>
                    {billing === 'anual' && <Check className="w-4 h-4 text-primary" />}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    UF {annualUF}/año
                  </p>
                  <span className="inline-block mt-2 text-xs font-semibold text-primary">
                    2 meses gratis
                  </span>
                </button>
              </div>
            </section>

            {/* Account / Billing info */}
            <section className="rounded-lg border border-border bg-card p-6 space-y-4">
              <h2 className="font-semibold">Datos de facturación</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm text-muted-foreground" htmlFor="nombre">
                    Nombre completo
                  </label>
                  <input
                    id="nombre"
                    required
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    placeholder="Juan Pérez"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-muted-foreground" htmlFor="email">
                    Email corporativo
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    placeholder="juan@empresa.cl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-muted-foreground" htmlFor="empresa">
                    Empresa
                  </label>
                  <input
                    id="empresa"
                    required
                    value={form.empresa}
                    onChange={(e) => setForm({ ...form, empresa: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    placeholder="Mi Empresa SpA"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-muted-foreground" htmlFor="rut">
                    RUT empresa
                  </label>
                  <input
                    id="rut"
                    required
                    value={form.rut}
                    onChange={(e) => setForm({ ...form, rut: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    placeholder="76.123.456-7"
                  />
                </div>
              </div>
            </section>

            {/* Payment (mock) */}
            <section className="rounded-lg border border-border bg-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Método de pago</h2>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  Cifrado SSL
                </span>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-muted-foreground" htmlFor="card">
                  Número de tarjeta
                </label>
                <input
                  id="card"
                  required
                  inputMode="numeric"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  placeholder="4242 4242 4242 4242"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm text-muted-foreground" htmlFor="exp">
                    Vencimiento
                  </label>
                  <input
                    id="exp"
                    required
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    placeholder="MM/AA"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-muted-foreground" htmlFor="cvc">
                    CVC
                  </label>
                  <input
                    id="cvc"
                    required
                    inputMode="numeric"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    placeholder="123"
                  />
                </div>
              </div>
            </section>

            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="w-full text-base font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>Pagar ${formatCLP(totalCLP)} CLP</>
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Al confirmar aceptas nuestros{' '}
              <a href="/terms" className="underline hover:text-foreground">
                Términos
              </a>{' '}
              y{' '}
              <a href="/privacy" className="underline hover:text-foreground">
                Política de Privacidad
              </a>
              .
            </p>
          </form>

          {/* RIGHT: Order summary */}
          <aside className="rounded-lg border border-border bg-card p-6 lg:sticky lg:top-8">
            <h2 className="font-semibold mb-4">Resumen del pedido</h2>

            <div className="flex items-start justify-between pb-4 border-b border-border">
              <div>
                <p className="font-semibold">Plan {plan.name}</p>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Facturación {billing}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold">UF {displayUF}</p>
                <p className="text-xs text-muted-foreground">{plan.period}</p>
              </div>
            </div>

            <ul className="space-y-2 py-4 border-b border-border">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{f}</span>
                </li>
              ))}
            </ul>

            <div className="space-y-2 py-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${formatCLP(displayCLP)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">IVA (19%)</span>
                <span>${formatCLP(ivaCLP)}</span>
              </div>
            </div>

            <div className="flex justify-between items-baseline pt-4 border-t border-border">
              <span className="font-semibold">Total</span>
              <div className="text-right">
                <span className="text-2xl font-bold">${formatCLP(totalCLP)}</span>
                <span className="text-sm text-muted-foreground ml-1">CLP</span>
              </div>
            </div>

            <div className="mt-6 rounded-md bg-primary/5 border border-primary/20 p-3 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Garantía de 7 días. Si no estás conforme, te devolvemos el 100%.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
