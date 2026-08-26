import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, CheckCircle2, FileCheck2, FolderKanban, SearchCheck, ShieldCheck, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Cómo se resuelve un caso con Kumplio',
  description: 'Recorre cómo Kumplio transforma una situación regulatoria, contractual o de cumplimiento en una decisión, un plan y evidencia de cierre.',
}

const steps = [
  { label: 'Situación', title: 'Explicas lo que necesitas resolver.', description: 'No debes elegir un módulo ni conocer el nombre exacto de la obligación. Puedes describir el problema con tus propias palabras.', example: '“Un cliente me está exigiendo demostrar cómo protegemos sus datos.”', icon: SearchCheck },
  { label: 'Expediente', title: 'Kumplio organiza el caso y sus antecedentes.', description: 'El objetivo, los documentos, las fuentes y las preguntas abiertas quedan reunidos en un expediente vivo.', example: 'El sistema distingue lo aportado por el usuario, lo recuperado desde fuentes y lo que todavía falta confirmar.', icon: FolderKanban },
  { label: 'Equipo', title: 'Analiza, resuelve y revisa con responsabilidades claras.', description: 'Isidora analiza obligaciones y contexto; Verónica convierte brechas en controles, evidencia y acciones; Julieta realiza una revisión independiente antes de una decisión sensible.', example: 'Cuando el caso lo requiere, Kumplio activa capacidades adicionales para riesgo, cambio regulatorio, planificación o análisis histórico.', icon: Users },
  { label: 'Decisión', title: 'Recibes lo importante en un orden útil.', description: 'Kumplio muestra qué requiere atención, qué puede esperar, qué debes hacer y qué reservas siguen abiertas.', example: 'La persona revisa, aprueba, solicita cambios o detiene el avance antes de la siguiente etapa.', icon: ShieldCheck },
  { label: 'Evidencia', title: 'El respaldo queda conectado con la conclusión.', description: 'Fuentes, documentos, artefactos, revisiones y decisiones permanecen relacionados dentro del expediente.', example: 'No se presenta una afirmación importante como certeza cuando falta contexto o evidencia suficiente.', icon: FileCheck2 },
  { label: 'Cierre', title: 'El diagnóstico se convierte en trabajo terminado.', description: 'El plan continúa con acciones, responsables, evidencia esperada y criterio de cierre hasta que el caso pueda resolverse.', example: 'Kumplio conserva el historial para futuras revisiones, cambios regulatorios o casos relacionados.', icon: CheckCircle2 },
]

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-white/10 bg-[#111723]"><div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5 sm:px-8"><Link href="/" aria-label="Volver a Kumplio"><Image src="/logo-kumplio.svg" alt="Kumplio" width={140} height={56} priority className="h-11 w-auto" /></Link><Button asChild className="rounded-[10px] font-black"><Link href="/#resolver">Resolver un caso</Link></Button></div></header>
      <main>
        <section className="border-b border-white/10 px-5 py-20 sm:px-8 sm:py-28"><div className="mx-auto max-w-4xl text-center"><Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-white/55 hover:text-white"><ArrowLeft className="h-4 w-4" /> Volver</Link><p className="mt-8 text-xs font-black uppercase tracking-[0.2em] text-primary">Demostración del recorrido</p><h1 className="mt-4 text-balance text-4xl font-extrabold tracking-[-0.04em] sm:text-6xl">De una situación difícil a un cierre respaldado.</h1><p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/55">No te mostraremos un catálogo de módulos. Te mostraremos cómo Kumplio entiende un objetivo, organiza el trabajo y mantiene el control humano hasta resolver el caso.</p></div></section>
        <section className="px-5 py-16 sm:px-8 sm:py-24"><div className="mx-auto max-w-5xl space-y-5">{steps.map(({ label, title, description, example, icon: Icon }, index) => <article key={label} className="grid gap-5 rounded-[24px] border border-white/10 bg-card p-6 sm:grid-cols-[84px_64px_1fr] sm:items-start sm:p-8"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-white/35">Paso</p><p className="mt-2 text-2xl font-extrabold text-primary">0{index + 1}</p></div><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-6 w-6" /></div><div><p className="text-xs font-black uppercase tracking-[0.16em] text-primary">{label}</p><h2 className="mt-2 text-2xl font-extrabold">{title}</h2><p className="mt-3 text-base leading-7 text-white/65">{description}</p><p className="mt-4 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-sm leading-6 text-white/48">{example}</p></div></article>)}</div></section>
        <section className="border-y border-white/10 bg-[#0d131e] px-5 py-16 sm:px-8 sm:py-24"><div className="mx-auto grid max-w-5xl gap-8 rounded-[28px] border border-primary/20 bg-primary/[0.055] p-7 sm:grid-cols-[1fr_auto] sm:items-center sm:p-10"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-primary">El resultado</p><h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">No solo sabes qué falta. Sabes qué hacer después y cómo demostrar el cierre.</h2><p className="mt-4 max-w-2xl leading-7 text-white/55">Las prioridades dependen de la información real del caso. Kumplio muestra expresamente las fuentes, reservas y decisiones humanas que sostienen cada avance.</p></div><Button size="lg" asChild className="rounded-[10px] px-7 font-black"><Link href="/#resolver">Describe tu situación <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div></section>
      </main>
    </div>
  )
}
