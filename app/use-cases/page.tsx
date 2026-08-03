import Link from 'next/link'
import { ArrowRight, Building2, ClipboardCheck, FileKey, Scale, ShieldCheck, Truck, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'

export const metadata = {
  title: 'Casos de uso',
  description: 'Ejemplos de cómo Kumplio transforma conocimiento disperso en misiones, decisiones y resultados verificables.',
}

const cases = [
  { icon: ShieldCheck, area: 'Protección de datos', problem: 'Políticas, contratos y tratamientos dispersos sin una visión común de brechas y responsables.', result: 'Una misión de adecuación con obligaciones priorizadas, evidencia esperada, responsables y criterios de avance.', journey: ['Reunir fuentes y documentos', 'Identificar obligaciones aplicables', 'Relacionar brechas y controles', 'Ejecutar un plan verificable'], href: '/features/ley-21719' },
  { icon: ClipboardCheck, area: 'Preparación de auditoría', problem: 'Semanas buscando archivos, versiones y responsables antes de poder responder al auditor.', result: 'Un espacio de trabajo que reúne controles, evidencias, decisiones pendientes y trazabilidad de cada hallazgo.', journey: ['Definir alcance', 'Revisar evidencia disponible', 'Detectar faltantes', 'Coordinar correcciones y aprobación'], href: '/demo' },
  { icon: Truck, area: 'Evaluación de proveedores', problem: 'Contratos, riesgos y evaluaciones repartidos entre planillas, correos y diferentes áreas.', result: 'Una misión por proveedor con documentos relacionados, riesgos, decisiones y seguimiento de compromisos.', journey: ['Consolidar antecedentes', 'Evaluar riesgo', 'Solicitar evidencia', 'Decidir y registrar fundamento'], href: '/enterprise' },
  { icon: FileKey, area: 'Contratos y obligaciones', problem: 'Compromisos contractuales que se conocen tarde o dependen de la memoria de una persona.', result: 'Obligaciones conectadas con responsables, fechas, controles y evidencia de cumplimiento.', journey: ['Leer contrato', 'Extraer compromisos', 'Asignar responsables', 'Crear seguimiento recurrente'], href: '/enterprise' },
  { icon: Users, area: 'Políticas y personas', problem: 'Cambios de política difíciles de comunicar, implementar y demostrar en toda la organización.', result: 'Una misión de implementación con destinatarios, entregables, confirmaciones y evidencia consolidada.', journey: ['Comparar versiones', 'Detectar impacto', 'Coordinar comunicación', 'Demostrar implementación'], href: '/enterprise' },
  { icon: Scale, area: 'Cambios normativos', problem: 'La organización recibe alertas, pero no sabe con precisión qué procesos o documentos debe revisar.', result: 'Una recomendación explicada que puede transformarse en una misión contextual y trazable.', journey: ['Detectar el cambio', 'Verificar fuente y vigencia', 'Relacionar impacto', 'Crear misión de implementación'], href: '/demo' },
]

export default function UseCasesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNav />
      <main>
        <section className="border-b border-white/10 px-5 pb-20 pt-36 sm:px-8 md:pb-28 md:pt-44 lg:px-12">
          <div className="mx-auto max-w-[1240px]">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-xs font-bold text-primary"><Building2 className="h-4 w-4" /> Casos de uso</div>
            <h1 className="mt-7 max-w-5xl text-balance text-5xl font-extrabold leading-[1.06] tracking-[-0.04em] sm:text-6xl">El valor no está en almacenar más información. Está en terminar mejor el trabajo.</h1>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-white/60">Estos escenarios muestran cómo Kumplio conecta contexto, decisiones y ejecución. Son ejemplos de uso, no testimonios ni resultados de clientes reales.</p>
          </div>
        </section>
        <section className="px-5 py-20 sm:px-8 lg:px-12"><div className="mx-auto grid max-w-[1240px] gap-6 lg:grid-cols-2">
          {cases.map(({ icon: Icon, area, problem, result, journey, href }) => (
            <article key={area} className="flex flex-col rounded-3xl border border-white/10 bg-card p-6 sm:p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-6 w-6" /></div>
              <h2 className="mt-6 text-2xl font-extrabold">{area}</h2>
              <div className="mt-6 grid gap-5 sm:grid-cols-2"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-white/35">Problema</p><p className="mt-2 text-sm leading-7 text-white/55">{problem}</p></div><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Resultado esperado</p><p className="mt-2 text-sm font-semibold leading-7">{result}</p></div></div>
              <div className="mt-7 border-t border-white/10 pt-6"><p className="text-xs font-bold uppercase tracking-[0.16em] text-white/35">Recorrido</p><div className="mt-4 grid gap-2 sm:grid-cols-2">{journey.map((step, index) => <div key={step} className="flex gap-3 rounded-xl bg-white/[0.03] p-3 text-sm text-white/60"><span className="font-bold text-primary">{index + 1}</span>{step}</div>)}</div></div>
              <Link href={href} className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">Explorar este recorrido <ArrowRight className="h-4 w-4" /></Link>
            </article>
          ))}
        </div></section>
        <section className="border-t border-white/10 bg-[#0d131e] px-5 py-24 text-center sm:px-8 lg:px-12"><h2 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">¿Tu caso no cabe en una solución estándar?</h2><p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/55">Enterprise Studio permite diseñar procesos, integraciones y experiencias específicas sin contaminar el núcleo de Kumplio.</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Button size="lg" asChild className="h-13 rounded-xl px-8 font-bold"><Link href="/enterprise">Conocer Enterprise <ArrowRight className="ml-2 h-4 w-4" /></Link></Button><Button size="lg" variant="outline" asChild className="h-13 rounded-xl border-white/15 bg-transparent px-8 font-semibold"><Link href="/demo">Abrir demo</Link></Button></div></section>
      </main>
      <Footer />
    </div>
  )
}

function PublicNav() {
  return <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#111723]/90 backdrop-blur-xl"><div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12"><Link href="/" className="font-extrabold tracking-[0.2em]">KUMPLIO</Link><div className="hidden items-center gap-7 md:flex"><Link href="/enterprise" className="text-sm text-white/65 hover:text-white">Enterprise</Link><Link href="/demo" className="text-sm text-white/65 hover:text-white">Demo</Link><Link href="/pricing" className="text-sm text-white/65 hover:text-white">Planes</Link></div><Button asChild className="rounded-xl font-bold"><Link href="/sign-up">Comenzar</Link></Button></div></nav>
}
