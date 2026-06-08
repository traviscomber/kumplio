import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contacto KUMPLIO | Soporte y Ventas en Chile',
  description: 'Contacta a KUMPLIO. Soporte técnico, consultas de ventas y demostraciones. Respuesta en 24 horas.',
  keywords: [
    'contacto kumplio',
    'soporte kumplio',
    'venta kumplio',
    'contacto cumplimiento',
    'soporte compliance chile',
  ],
  alternates: {
    canonical: 'https://kumplio.app/contact',
  },
  openGraph: {
    title: 'Contacto KUMPLIO | Soporte Chile',
    description: 'Conecta con nuestro equipo. Respuesta rápida.',
    url: 'https://kumplio.app/contact',
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
