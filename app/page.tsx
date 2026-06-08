'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="bg-background text-foreground">
      {/* NAVIGATION */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white text-sm font-bold">K</span>
            </div>
            <span className="font-bold text-lg">KUMPLIO</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/sign-in" className="text-sm hover:text-primary transition">Acceder</a>
            <Button size="sm" asChild>
              <a href="/sign-up">Empezar</a>
            </Button>
          </div>
        </div>
      </nav>

      {/* HERO - DIRECTO Y SECO */}
      <section className="pt-32 pb-24 px-6">
        <div className="container mx-auto max-w-3xl text-center space-y-8">
          <h1 className="text-6xl md:text-7xl font-black tracking-tight leading-tight">
            Controla tu Cumplimiento Legal
            <br />
            <span className="text-primary">Antes Que Te Controle La Ley</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            7 agentes IA analizan obligaciones, monitorean regulaciones, cuantifican riesgos en dinero, y generan planes de acción ejecutables.
            <br />
            <span className="font-semibold">Para transporte, minería, y cualquier empresa que deba cumplir.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" className="text-lg px-8" asChild>
              <a href="/demo/transporte">
                Demo: Transporte
                <ArrowRight className="ml-2 w-5 h-5" />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8" asChild>
              <a href="/demo/mineria">
                Demo: Minería
                <ArrowRight className="ml-2 w-5 h-5" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* 7 AGENTES - OUTCOMES */}
      <section className="py-24 px-6 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold mb-16">7 Agentes IA. 7 Especialistas.</h2>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Sofia */}
            <div className="p-8 rounded-lg border border-border hover:border-primary transition space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold">Sofia</h3>
                  <p className="text-sm text-muted-foreground">Analizadora de Obligaciones</p>
                </div>
                <span className="text-3xl">📄</span>
              </div>
              <div className="text-3xl font-black text-primary">47</div>
              <p className="text-sm">Obligaciones identificadas en tu negocio</p>
              <p className="text-xs text-muted-foreground">Transporte: RT, SOAP, permisos, seguros • Minería: SONAMI, seguridad, ambiental</p>
            </div>

            {/* Elena */}
            <div className="p-8 rounded-lg border border-border hover:border-primary transition space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold">Elena</h3>
                  <p className="text-sm text-muted-foreground">Monitora Regulatoria</p>
                </div>
                <span className="text-3xl">👁️</span>
              </div>
              <div className="text-3xl font-black text-primary">24/7</div>
              <p className="text-sm">Cambios legales en tu inbox al instante</p>
              <p className="text-xs text-muted-foreground">Ley 21.719, resoluciones SEREMI, cambios regulatorios</p>
            </div>

            {/* Bruno */}
            <div className="p-8 rounded-lg border border-border hover:border-primary transition space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold">Bruno</h3>
                  <p className="text-sm text-muted-foreground">Evaluador de Riesgos</p>
                </div>
                <span className="text-3xl">⚠️</span>
              </div>
              <div className="text-3xl font-black text-red-600">$1.2M</div>
              <p className="text-sm">Exposición financiera si incumples</p>
              <p className="text-xs text-muted-foreground">Multas, sanciones, cierres operacionales</p>
            </div>

            {/* Marco */}
            <div className="p-8 rounded-lg border border-border hover:border-primary transition space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold">Marco</h3>
                  <p className="text-sm text-muted-foreground">Asesor de Cumplimiento</p>
                </div>
                <span className="text-3xl">💡</span>
              </div>
              <div className="text-3xl font-black text-primary">90 Días</div>
              <p className="text-sm">Plan de acción ejecutable</p>
              <p className="text-xs text-muted-foreground">Hitos mensuales, responsables, recursos</p>
            </div>

            {/* Laura */}
            <div className="p-8 rounded-lg border border-border hover:border-primary transition space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold">Laura</h3>
                  <p className="text-sm text-muted-foreground">Auditora de Cumplimiento</p>
                </div>
                <span className="text-3xl">✓</span>
              </div>
              <div className="text-3xl font-black text-primary">52%</div>
              <p className="text-sm">De tus obligaciones cumpliéndose realmente</p>
              <p className="text-xs text-muted-foreground">Auditoría independiente, verificación real</p>
            </div>

            {/* Kai */}
            <div className="p-8 rounded-lg border border-border hover:border-primary transition space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold">Kai</h3>
                  <p className="text-sm text-muted-foreground">Aprendizaje Continuo</p>
                </div>
                <span className="text-3xl">🧠</span>
              </div>
              <div className="text-3xl font-black text-primary">+5%</div>
              <p className="text-sm">Mejora en accuracy cada mes</p>
              <p className="text-xs text-muted-foreground">Sistema que aprende y se optimiza</p>
            </div>
          </div>

          {/* Catarina - Full width */}
          <div className="p-8 rounded-lg border border-border hover:border-primary transition space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold">Catarina</h3>
                <p className="text-sm text-muted-foreground">Reportera Legal</p>
              </div>
              <span className="text-3xl">📋</span>
            </div>
            <div className="text-3xl font-black text-primary">1 Click</div>
            <p className="text-sm">PDF listo para reguladores</p>
            <p className="text-xs text-muted-foreground">Compilar evidencia, reportes auditables para inspecciones</p>
          </div>
        </div>
      </section>

      {/* COMPARATIVA - EXCEL VS KUMPLIO */}
      <section className="py-24 px-6 bg-card border-t border-border">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-4xl font-bold mb-16">Excel vs KUMPLIO</h2>

          <div className="space-y-4">
            {[
              { problema: "Vencimientos que se pasan", kumplio: "Alertas 30/15/5 días automáticas" },
              { problema: "Cambios legales que no ves", kumplio: "Monitoreo 24/7 en tiempo real" },
              { problema: "Riesgos sin cuantificar", kumplio: "Exposición en dinero (UF, $/día)" },
              { problema: "Recomendaciones vagas", kumplio: "Plan ejecutable mes a mes" },
              { problema: "Sin auditoría independiente", kumplio: "Verificación objetiva de Laura" },
              { problema: "Reportes manuales para reguladores", kumplio: "PDF listo en 1 click" },
            ].map((item, i) => (
              <div key={i} className="grid md:grid-cols-2 gap-8 p-6 rounded-lg border border-border">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="font-semibold text-sm">{item.problema}</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="font-semibold text-sm text-green-700">{item.kumplio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CASOS DE USO */}
      <section className="py-24 px-6 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold mb-16">Casos de Uso Reales</h2>

          {/* TRANSPORTE */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-primary uppercase mb-2">Caso: Transporte</p>
                <h3 className="text-3xl font-bold">Labbe Logística</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">ANTES (Excel)</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <span>15 multas/año. $200K en infracciones.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <span>15 horas/semana en compliance manual</span>
                    </li>
                  </ul>
                </div>
                <div className="border-t pt-4">
                  <p className="text-sm font-semibold text-muted-foreground mb-2">DESPUÉS (KUMPLIO)</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>0 multas. Auditorías limpias.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>0.5 horas/semana. ROI: 5 meses.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="bg-card p-8 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground mb-1">47 Obligaciones en Transporte</p>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div><p className="font-semibold">Revisión Técnica</p><p className="text-muted-foreground">Cada 6 meses</p></div>
                <div><p className="font-semibold">SOAP</p><p className="text-muted-foreground">Anual</p></div>
                <div><p className="font-semibold">Licencia Conducción</p><p className="text-muted-foreground">Vigencia</p></div>
                <div><p className="font-semibold">Permiso Circulación</p><p className="text-muted-foreground">Anual</p></div>
              </div>
            </div>
          </div>

          {/* MINERÍA */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="bg-card p-8 rounded-lg border border-border md:order-2">
              <p className="text-sm text-muted-foreground mb-1">180+ Obligaciones en Minería</p>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div><p className="font-semibold">Seguridad Ocupacional</p><p className="text-muted-foreground">DS 40</p></div>
                <div><p className="font-semibold">Ambiental</p><p className="text-muted-foreground">RCA aprobada</p></div>
                <div><p className="font-semibold">Derechos Humanos</p><p className="text-muted-foreground">Protocolo SONAMI</p></div>
                <div><p className="font-semibold">Tributario</p><p className="text-muted-foreground">Royalties, IVA</p></div>
              </div>
            </div>
            <div className="space-y-6 md:order-1">
              <div>
                <p className="text-sm font-semibold text-primary uppercase mb-2">Caso: Minería</p>
                <h3 className="text-3xl font-bold">Goldcorp Chile</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">ANTES (Alto riesgo)</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <span>Riesgo regulatorio: 45/100</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <span>Potencial multa: $1.2M</span>
                    </li>
                  </ul>
                </div>
                <div className="border-t pt-4">
                  <p className="text-sm font-semibold text-muted-foreground mb-2">DESPUÉS (90 días)</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Riesgo: 8/100. Controlado.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Evitó multa de $1.2M</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 px-6 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-2xl text-center space-y-8">
          <h2 className="text-5xl font-bold">Los 7 agentes de KUMPLIO están listos.</h2>
          <p className="text-lg opacity-90">Los cambios legales no esperan. Tampoco las multas.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8" asChild>
              <a href="/sign-up">Empezar Ahora</a>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <a href="/demo/transporte">Ver Demo</a>
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border py-12 px-6 bg-card">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <p className="font-semibold mb-3">Producto</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/demo/transporte" className="hover:text-foreground transition">Transporte</a></li>
                <li><a href="/demo/mineria" className="hover:text-foreground transition">Minería</a></li>
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
