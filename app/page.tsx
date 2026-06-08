'use client'

import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'
import { ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="bg-background text-foreground">
      {/* NAVIGATION */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          {/* LOGO */}
          <a href="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white text-sm font-bold">K</span>
            </div>
            <span className="font-bold text-lg">KUMPLIO</span>
          </a>

          {/* CENTER LINKS - HIDDEN ON MOBILE */}
          <div className="hidden md:flex items-center gap-8">
            <a href="/pricing" className="text-sm hover:text-primary transition">Precios</a>
            <a href="/demo/transporte" className="text-sm hover:text-primary transition">Transporte</a>
            <a href="/demo/mineria" className="text-sm hover:text-primary transition">Minería</a>
            <a href="/webinars" className="text-sm hover:text-primary transition">Webinars</a>
            <a href="/sales-kit" className="text-sm hover:text-primary transition">Recursos</a>
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
            <Button size="lg" className="text-lg px-8 group/btn" asChild>
              <a href="/demo/transporte" className="flex items-center">
                Demo: Transporte
                <ArrowRight className="ml-3 w-5 h-5 group-hover/btn:translate-x-1 transition-transform duration-300" />
              </a>
            </Button>
            <Button size="lg" className="text-lg px-8 bg-muted text-foreground hover:bg-muted/80 group/btn" asChild>
              <a href="/demo/mineria" className="flex items-center">
                Demo: Minería
                <ArrowRight className="ml-3 w-5 h-5 group-hover/btn:translate-x-1 transition-transform duration-300" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* SYSTEM ARCHITECTURE - IA FIRST */}
      <section className="py-24 px-6 border-t border-border bg-surface-dark/30">
        <div className="container mx-auto max-w-6xl">
          <div className="space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold">Sistema Integral de IA First</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                7 agentes especializados trabajando en orquesta. Cada uno alimenta al siguiente. Razonamiento avanzado más validación cruzada igual cumplimiento garantizado.
              </p>
            </div>

            {/* SYSTEM FLOW */}
            <div className="space-y-4">
              <div className="grid md:grid-cols-5 gap-3 items-center">
                <div className="p-6 rounded-lg border border-border text-center">
                  <p className="font-bold text-primary mb-2">Sofia</p>
                  <p className="text-xs text-muted-foreground">Análisis de Obligaciones</p>
                  <p className="text-2xl font-black text-primary mt-3">47</p>
                </div>
                <div className="text-center text-muted-foreground text-xl">→</div>
                <div className="p-6 rounded-lg border border-border text-center">
                  <p className="font-bold text-primary mb-2">Bruno</p>
                  <p className="text-xs text-muted-foreground">Evaluación de Riesgos</p>
                  <p className="text-2xl font-black text-primary mt-3">$1.2M</p>
                </div>
                <div className="text-center text-muted-foreground text-xl">→</div>
                <div className="p-6 rounded-lg border border-border text-center">
                  <p className="font-bold text-primary mb-2">Marco</p>
                  <p className="text-xs text-muted-foreground">Plan de Acción</p>
                  <p className="text-2xl font-black text-primary mt-3">90 D</p>
                </div>
              </div>

              <div className="p-6 rounded-lg border border-primary/30 bg-primary/5">
                <p className="text-center font-semibold text-sm mb-4">Cross-Agent Learning: Cada agente alimenta al siguiente con insights, validación cruzada y mejora continua</p>
                <div className="grid md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-2">
                    <p className="font-semibold text-primary">Sofia → Bruno</p>
                    <p className="text-muted-foreground">Confidence scores de obligaciones informan cálculo de riesgos</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold text-primary">Bruno → Marco</p>
                    <p className="text-muted-foreground">Riesgos priorizan qué obligaciones atacar primero</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold text-primary">Marco → Laura</p>
                    <p className="text-muted-foreground">Plan de acción genera checklist para auditoría independiente</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold text-primary">Laura → Todos</p>
                    <p className="text-muted-foreground">Gaps identificados reentrenan a todos los agentes del sistema</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7 AGENTES - OUTCOMES */}
      <section className="py-24 px-6 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold mb-4">Los 7 Especialistas IA del Sistema</h2>
          <p className="text-muted-foreground mb-16 max-w-2xl">Cada agente es un experto en su dominio. Juntos forman un sistema de razonamiento ultra-inteligente que aprende de cada decisión.</p>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Sofia */}
            <div className="p-8 rounded-lg border border-border hover:border-primary transition space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold">Sofia</h3>
                  <p className="text-sm text-muted-foreground">Analizadora de Obligaciones</p>
                </div>
                <span className="text-3xl text-muted-foreground">●</span>
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
                <span className="text-3xl text-muted-foreground">●</span>
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
                <span className="text-3xl text-muted-foreground">●</span>
              </div>
              <div className="text-3xl font-black text-primary">$1.2M</div>
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
                <span className="text-3xl text-muted-foreground">●</span>
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
                <span className="text-3xl text-muted-foreground">●</span>
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
                <span className="text-3xl text-muted-foreground">●</span>
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
              <span className="text-3xl text-muted-foreground">●</span>
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
                  <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <p className="font-semibold text-sm">{item.problema}</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="font-semibold text-sm">{item.kumplio}</p>
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
                      <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span>15 multas/año. $200K en infracciones.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span>15 horas/semana en compliance manual</span>
                    </li>
                  </ul>
                </div>
                <div className="border-t pt-4">
                  <p className="text-sm font-semibold text-muted-foreground mb-2">DESPUÉS (KUMPLIO)</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>0 multas. Auditorías limpias.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
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
                      <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span>Riesgo regulatorio: 45/100</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span>Potencial multa: $1.2M</span>
                    </li>
                  </ul>
                </div>
                <div className="border-t pt-4">
                  <p className="text-sm font-semibold text-muted-foreground mb-2">DESPUÉS (90 días)</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>Riesgo: 8/100. Controlado.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>Evitó multa de $1.2M</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TECHNOLOGY: IA FIRST ARCHITECTURE */}
      <section className="py-24 px-6 border-t border-border bg-surface-dark/30">
        <div className="container mx-auto max-w-6xl">
          <div className="space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold">IA First: La Tecnología Detrás del Sistema</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                KUMPLIO no es software que usa IA. Es un sistema architected desde cero con IA como su fundamento.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* REASONING TECHNIQUES */}
              <div className="p-8 rounded-lg border border-border space-y-4">
                <h3 className="font-bold text-xl">Razonamiento Avanzado</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="space-y-1">
                    <p className="font-semibold text-primary">Few-Shot Learning</p>
                    <p className="text-muted-foreground">Cada agente aprende de ejemplos similares a tu caso, no de reglas genéricas.</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="font-semibold text-primary">Analogical Reasoning</p>
                    <p className="text-muted-foreground">Sofia compara tu situación con 1000+ casos históricos extrayendo lecciones aplicables.</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="font-semibold text-primary">Causal Reasoning</p>
                    <p className="text-muted-foreground">Bruno entiende causas raíz del incumplimiento, no solo calcula multas.</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="font-semibold text-primary">Metacognitive Validation</p>
                    <p className="text-muted-foreground">El sistema cuestiona sus propias conclusiones e identifica asunciones débiles.</p>
                  </div>
                </div>
              </div>

              {/* SYSTEM INTELLIGENCE */}
              <div className="p-8 rounded-lg border border-border space-y-4">
                <h3 className="font-bold text-xl">Inteligencia de Sistema</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="space-y-1">
                    <p className="font-semibold text-primary">Multi-Method Validation</p>
                    <p className="text-muted-foreground">Ninguna conclusión depende de un solo agente. Todo se valida por consenso.</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="font-semibold text-primary">Uncertainty Quantification</p>
                    <p className="text-muted-foreground">Cada métrica incluye rangos de confianza y evidencia de apoyo completa.</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="font-semibold text-primary">Reasoning Traces</p>
                    <p className="text-muted-foreground">Auditables por reguladores. Cada decisión tiene su trail de pensamiento completo.</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="font-semibold text-primary">Continuous Learning</p>
                    <p className="text-muted-foreground">Kai recolecta feedback de auditorías y alimenta el sistema. KUMPLIO mejora mensualmente.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* RESULTS */}
            <div className="p-8 rounded-lg border border-primary/30 bg-primary/5">
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div className="space-y-2">
                  <div className="text-3xl font-black text-primary">95%</div>
                  <p className="text-sm text-muted-foreground">Accuracy en análisis de cumplimiento</p>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-black text-primary">5 meses</div>
                  <p className="text-sm text-muted-foreground">ROI promedio desde activación</p>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-black text-primary">40%</div>
                  <p className="text-sm text-muted-foreground">Menos hallucinating que sistemas estándar</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 px-6 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-2xl text-center space-y-8">
          <h2 className="text-5xl font-bold">Un sistema integral de IA. Cumplimiento garantizado.</h2>
          <p className="text-lg opacity-90">Sofia, Bruno, Marco, Elena, Laura, Kai y Catarina analizan, validan y optimizan tu cumplimiento 24/7. El cambio legal no espera. Tampoco deberías.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 bg-black text-white hover:bg-black/80 group/btn font-semibold shadow-lg" asChild>
              <a href="/sign-up" className="flex items-center justify-center">
                Empezar Ahora
                <ArrowRight className="ml-3 w-5 h-5 group-hover/btn:translate-x-1 group-hover/btn:scale-110 transition-all duration-300" />
              </a>
            </Button>
            <Button size="lg" className="text-lg px-8 border-2 border-black text-primary-foreground bg-black/10 hover:bg-black hover:text-primary-foreground group/btn font-semibold" variant="outline" asChild>
              <a href="/demo/transporte" className="flex items-center justify-center">
                Ver Sistema en Acción
              </a>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
