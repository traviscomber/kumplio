import type { Metadata } from 'next'
import Link from 'next/link'
import { Footer } from '@/components/footer'

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description: 'Cómo Kumplio trata y protege los datos personales y la información de las organizaciones usuarias.',
  alternates: { canonical: '/privacy' },
}

const updatedAt = '3 de agosto de 2026'

export default function PrivacyPage() {
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
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Privacidad</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">Política de privacidad</h1>
            <p className="mt-5 text-muted-foreground">Última actualización: {updatedAt}</p>
          </div>
        </section>

        <section className="px-6 py-16">
          <div className="mx-auto max-w-4xl space-y-10 leading-7 text-muted-foreground">
            <LegalSection title="1. Alcance">
              Esta política explica cómo Kumplio by n3uralia trata datos personales asociados al sitio web, cuentas, contactos comerciales y uso de la plataforma. El tratamiento específico de información cargada por una organización también puede regirse por contratos y acuerdos de tratamiento de datos separados.
            </LegalSection>

            <LegalSection title="2. Datos que podemos tratar">
              Podemos tratar datos de cuenta y contacto, como nombre, correo electrónico, empresa, cargo y teléfono; datos de autenticación y seguridad; información de uso y registros técnicos; solicitudes comerciales o de soporte; y documentos, evidencias, decisiones o contenidos que una organización cargue voluntariamente en su workspace.
            </LegalSection>

            <LegalSection title="3. Finalidades">
              Utilizamos los datos para crear y administrar cuentas, prestar el servicio, mantener la seguridad, responder consultas, registrar solicitudes comerciales, mejorar la experiencia, cumplir obligaciones contractuales y legales, y mantener trazabilidad de acciones dentro de la plataforma.
            </LegalSection>

            <LegalSection title="4. Información de organizaciones">
              La información privada de una organización se mantiene separada del conocimiento regulatorio público y de los datos de otras organizaciones. Los usuarios deben contar con autorización suficiente para cargar y tratar información de terceros dentro de Kumplio.
            </LegalSection>

            <LegalSection title="5. Inteligencia artificial">
              Algunas funciones pueden utilizar proveedores de inteligencia artificial para procesar instrucciones o contenidos autorizados. Kumplio procura minimizar los datos enviados y aplicar controles de acceso y revisión humana. La información privada de una organización no se utiliza para entrenar modelos públicos por defecto.
            </LegalSection>

            <LegalSection title="6. Proveedores y transferencias">
              Podemos utilizar proveedores de infraestructura, autenticación, almacenamiento, analítica, correo e inteligencia artificial. Algunos pueden procesar datos fuera de Chile. Seleccionamos proveedores según necesidades operativas y de seguridad, y procuramos establecer condiciones contractuales apropiadas.
            </LegalSection>

            <LegalSection title="7. Conservación">
              Conservamos los datos durante el tiempo necesario para prestar el servicio, mantener seguridad y trazabilidad, cumplir contratos y atender obligaciones legales. Los plazos pueden variar según el tipo de dato, configuración contractual y necesidades de respaldo o auditoría.
            </LegalSection>

            <LegalSection title="8. Seguridad">
              Aplicamos controles razonables de autenticación, autorización, aislamiento por organización, validación de entradas, trazabilidad y revisión de cambios. Ningún sistema puede garantizar seguridad absoluta. Más información está disponible en nuestra <Link href="/security" className="font-semibold text-primary hover:underline">página de seguridad</Link>.
            </LegalSection>

            <LegalSection title="9. Derechos y solicitudes">
              Las personas pueden solicitar información, corrección, eliminación, oposición u otras acciones que correspondan conforme a la legislación aplicable y al contexto del tratamiento. Podemos solicitar antecedentes razonables para verificar identidad y autoridad.
            </LegalSection>

            <LegalSection title="10. Cookies y analítica">
              Utilizamos cookies necesarias para autenticación y funcionamiento. También podemos utilizar analítica para comprender el uso del sitio. La disponibilidad del servicio puede verse afectada si se bloquean cookies estrictamente necesarias.
            </LegalSection>

            <LegalSection title="11. Cambios">
              Podemos actualizar esta política cuando cambien el producto, los proveedores o la legislación. Publicaremos la versión vigente y su fecha de actualización en esta página.
            </LegalSection>

            <LegalSection title="12. Contacto">
              Para consultas o solicitudes de privacidad, escribe a <a href="mailto:info@kumplio.app" className="font-semibold text-primary hover:underline">info@kumplio.app</a>. Kumplio opera desde Santiago, Chile.
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
