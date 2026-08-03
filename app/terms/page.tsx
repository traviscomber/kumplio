import type { Metadata } from 'next'
import Link from 'next/link'
import { Footer } from '@/components/footer'

export const metadata: Metadata = {
  title: 'Términos de servicio',
  description: 'Condiciones de uso de Kumplio y límites de la plataforma.',
  alternates: { canonical: '/terms' },
}

const updatedAt = '3 de agosto de 2026'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-extrabold tracking-[0.18em]">KUMPLIO</Link>
          <Link href="/contact" className="text-sm font-semibold text-primary hover:underline">Contacto</Link>
        </div>
      </header>

      <main>
        <section className="border-b border-border px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Condiciones de uso</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">Términos de servicio</h1>
            <p className="mt-5 text-muted-foreground">Última actualización: {updatedAt}</p>
          </div>
        </section>

        <section className="px-6 py-16">
          <div className="mx-auto max-w-4xl space-y-10 leading-7 text-muted-foreground">
            <LegalSection title="1. Aceptación">
              Al crear una cuenta, contratar un servicio o utilizar Kumplio, aceptas estos términos y la política de privacidad vigente. Si utilizas Kumplio en nombre de una organización, declaras contar con autorización suficiente para obligarla.
            </LegalSection>

            <LegalSection title="2. Servicio">
              Kumplio es una plataforma para organizar conocimiento, obligaciones, controles, evidencia, decisiones, misiones y resultados verificables. Las funcionalidades disponibles pueden variar según el plan, estado del producto, configuración de la organización y contrato aplicable.
            </LegalSection>

            <LegalSection title="3. No reemplaza asesoría profesional">
              Kumplio ayuda a estructurar información y trabajo, pero no reemplaza asesoría jurídica, auditoría independiente, certificación, firma profesional ni decisiones de autoridades o responsables de cumplimiento. La organización conserva la responsabilidad de revisar aplicabilidad, exactitud y decisiones finales.
            </LegalSection>

            <LegalSection title="4. Cuentas y acceso">
              Debes proporcionar información correcta, mantener tus credenciales seguras y notificar accesos no autorizados. Las cuentas son personales. La organización puede administrar membresías y permisos dentro de su workspace.
            </LegalSection>

            <LegalSection title="5. Contenido de la organización">
              La organización conserva los derechos sobre la información que carga. Autoriza a Kumplio y a sus proveedores a procesarla únicamente para prestar, proteger y mantener el servicio conforme a los contratos aplicables. La organización debe contar con derechos y autorizaciones suficientes sobre el contenido cargado.
            </LegalSection>

            <LegalSection title="6. Inteligencia artificial y revisión humana">
              Las salidas de inteligencia artificial pueden contener errores, omisiones o interpretaciones discutibles. Deben revisarse antes de utilizarse para decisiones jurídicas, regulatorias, financieras, laborales, operacionales o de seguridad. Kumplio puede registrar fuentes, supuestos, versiones y revisiones para aumentar trazabilidad.
            </LegalSection>

            <LegalSection title="7. Uso aceptable">
              No puedes utilizar Kumplio para vulnerar derechos, acceder a datos sin autorización, distribuir malware, eludir controles de seguridad, realizar ingeniería inversa indebida, sobrecargar el servicio ni generar contenido ilícito o engañoso.
            </LegalSection>

            <LegalSection title="8. Planes, precios y contratación">
              Los precios públicos se expresan en pesos chilenos y no incluyen IVA, salvo indicación distinta. El alcance, límites, soporte, facturación, renovación y cancelación se regirán por la oferta o contrato aceptado. Los proyectos Enterprise requieren una propuesta específica.
            </LegalSection>

            <LegalSection title="9. Disponibilidad y cambios">
              Kumplio puede modificar, suspender o retirar funciones por mantenimiento, seguridad, evolución del producto o dependencias externas. Procuraremos comunicar cambios materiales cuando corresponda. No se garantiza disponibilidad ininterrumpida salvo que exista un acuerdo de nivel de servicio separado.
            </LegalSection>

            <LegalSection title="10. Seguridad y respaldo">
              Aplicamos medidas razonables para proteger el servicio, pero ningún sistema es infalible. La organización debe mantener sus propios procedimientos de continuidad, revisión y respaldo cuando la criticidad de su operación lo requiera.
            </LegalSection>

            <LegalSection title="11. Propiedad intelectual">
              Kumplio, su software, diseño, modelos operativos, marca y documentación pertenecen a n3uralia o a sus licenciantes. Estos términos no transfieren propiedad intelectual, salvo el derecho limitado de uso durante la vigencia del servicio contratado.
            </LegalSection>

            <LegalSection title="12. Terminación">
              El acceso puede suspenderse por incumplimiento grave, riesgo de seguridad, uso ilícito o falta de pago conforme al contrato. La exportación, conservación y eliminación de datos se manejarán según el plan, contrato, política de privacidad y obligaciones aplicables.
            </LegalSection>

            <LegalSection title="13. Responsabilidad">
              En la máxima medida permitida por la ley, Kumplio no responde por decisiones adoptadas sin revisión profesional, información incorrecta proporcionada por usuarios, pérdida indirecta, lucro cesante o actuaciones de terceros. Cualquier límite específico de responsabilidad deberá constar en el contrato aplicable.
            </LegalSection>

            <LegalSection title="14. Ley aplicable">
              Estos términos se rigen por las leyes de la República de Chile. Las controversias se resolverán conforme al contrato aplicable y, a falta de una regla especial, ante los tribunales competentes de Santiago de Chile.
            </LegalSection>

            <LegalSection title="15. Contacto">
              Para consultas contractuales o sobre estos términos, escribe a <a href="mailto:info@kumplio.app" className="font-semibold text-primary hover:underline">info@kumplio.app</a>.
            </LegalSection>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-2xl font-bold text-foreground">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  )
}
