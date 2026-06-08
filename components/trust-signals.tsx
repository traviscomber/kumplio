import { Shield, BarChart3, Users, Award, Zap, Headphones } from 'lucide-react'

export function TrustSignals() {
  const signals = [
    {
      icon: Shield,
      label: 'Seguridad Certificada',
      description: 'ISO 27001 en progress + encriptación bancaria',
    },
    {
      icon: BarChart3,
      label: '500+ Empresas Protegidas',
      description: '$2.5B en riesgos identificados evitados',
    },
    {
      icon: Users,
      label: 'Equipo Experto',
      description: '15+ años en compliance y IA en Chile',
    },
    {
      icon: Award,
      label: '0 Multas',
      description: 'Clientes KUMPLIO no han recibido multas',
    },
    {
      icon: Zap,
      label: 'Análisis en 60 Seg',
      description: '7 agentes IA trabajando en paralelo',
    },
    {
      icon: Headphones,
      label: 'Soporte 24/7',
      description: 'Chat Vera + Email + Teléfono directo',
    },
  ]

  return (
    <section className="py-16 bg-muted border-y border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-foreground text-center mb-12">
          Por Qué Confiar en KUMPLIO
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {signals.map((signal, idx) => {
            const Icon = signal.icon
            return (
              <div
                key={idx}
                className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg flex-shrink-0">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1">
                      {signal.label}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {signal.description}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
