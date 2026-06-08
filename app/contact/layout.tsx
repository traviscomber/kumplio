import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contacto | KUMPLIO - Expertos en Compliance Ley 21.719',
  description: 'Habla con un especialista en cumplimiento normativo y Ley 21.719. Consulta gratuita sin compromisos. Respuesta en 24 horas. Estamos en Santiago, Chile.',
  keywords: [
    'contacto KUMPLIO',
    'consultor compliance Chile',
    'soporte cumplimiento',
    'asesoría Ley 21.719',
    'contactar n3uralia',
    'expertos compliance Santiago',
  ],
  alternates: {
    canonical: 'https://kumplio.cl/contact',
  },
  openGraph: {
    title: 'Contacto KUMPLIO | Expertos en Compliance',
    description: 'Consulta gratuita con especialistas en cumplimiento normativo. Respuesta en 24 horas.',
    url: 'https://kumplio.cl/contact',
    type: 'website',
  },
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
