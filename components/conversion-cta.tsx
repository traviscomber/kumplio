import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle, Zap } from 'lucide-react'

export function ConversionCTA() {
  return (
    <section className="py-20 px-6 bg-gradient-to-r from-primary/10 via-primary/5 to-background border-y border-border">
      <div className="max-w-4xl mx-auto">
        <div className="text-center space-y-8">
          <div className="inline-block px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <p className="text-sm font-semibold text-primary flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Oferta Especial: Diagnóstico Gratis + Consulta
            </p>
          </div>

          <h2 className="text-4xl font-bold text-foreground">
            Comienza tu Cumplimiento Hoy
          </h2>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            No esperes a diciembre. Miles de empresas ya analizan su cumplimiento. 
            Tu análisis personalizado te toma solo 2 minutos y es 100% confidencial.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mt-8">
            {/* Free Diagnosis Option */}
            <div className="bg-card border border-border rounded-lg p-6 text-left">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground">Plan Gratuito</h3>
              </div>
              <ul className="space-y-2 mb-6 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  Análisis 1 documento
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  Reporte de vulnerabilidades
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  Acceso 30 días
                </li>
              </ul>
              <Button asChild className="w-full">
                <a href="/sign-up">Comenzar Gratis</a>
              </Button>
            </div>

            {/* Pro Option */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30 rounded-lg p-6 text-left relative overflow-hidden">
              <div className="absolute top-4 right-4 px-3 py-1 bg-primary text-white text-xs font-bold rounded-full">
                Recomendado
              </div>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground">Plan Pro</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                <span className="font-bold text-foreground">UF 8/mes</span> • Facturación mensual
              </p>
              <ul className="space-y-2 mb-6 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  Documentos ilimitados
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  7 agentes IA especializados
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  Vera AI Coach 24/7
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  Dashboard de métricas
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  Soporte prioritario
                </li>
              </ul>
              <Button size="lg" asChild className="w-full group">
                <a href="/sign-up">
                  Empezar Pro
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition" />
                </a>
              </Button>
            </div>
          </div>

          {/* Social Proof Footer */}
          <div className="pt-8 border-t border-border/50">
            <p className="text-sm text-muted-foreground mb-4">
              Empresas que ya confían en KUMPLIO
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-muted-foreground">
              <span className="px-3 py-1 bg-muted rounded-full">Banco Santander</span>
              <span className="px-3 py-1 bg-muted rounded-full">Ripley</span>
              <span className="px-3 py-1 bg-muted rounded-full">Sodimac</span>
              <span className="px-3 py-1 bg-muted rounded-full">Mariscos Iquique</span>
              <span className="px-3 py-1 bg-muted rounded-full">+40 más</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
