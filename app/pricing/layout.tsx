import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Planes de Precios KUMPLIO | Cumplimiento Legal IA en Chile',
  description: 'Planes de precios flexibles para cumplimiento legal automático en Chile. Desde Starter hasta Enterprise. Sin tarjeta de crédito. 7 agentes IA especializados.',
  keywords: [
    'planes kumplio',
    'precios cumplimiento',
    'software compliance chile',
    'planes pricing legales',
    'cumplimiento automatizado precio',
    'kumplio planes',
    'ley 21.719 software costo',
  ],
  alternates: {
    canonical: 'https://kumplio.app/pricing',
    languages: {
      'es-CL': 'https://kumplio.app/pricing',
    },
  },
  openGraph: {
    title: 'Planes de Precios KUMPLIO - Cumplimiento Legal IA',
    description: 'Planes flexibles. Prueba gratuita. Sin tarjeta de crédito.',
    url: 'https://kumplio.app/pricing',
    type: 'website',
    images: [
      {
        url: 'https://kumplio.app/og-pricing.png',
        width: 1200,
        height: 630,
        alt: 'Planes de Precios KUMPLIO',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Planes KUMPLIO - Cumplimiento IA',
    description: 'Prueba gratis. Sin tarjeta de crédito.',
    images: ['https://kumplio.app/og-pricing.png'],
  },
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
