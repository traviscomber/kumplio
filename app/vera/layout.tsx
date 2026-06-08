import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Vera - Asistente de Cumplimiento 24/7 | KUMPLIO',
  description:
    'Chat con Vera sobre Ley 21.719, protección de datos, obligaciones legales y cumplimiento normativo en Chile. Respuestas inmediatas, disponible 24/7.',
  openGraph: {
    title: 'Vera - Asistente de Cumplimiento 24/7',
    description: 'Preguntas sobre Ley 21.719 respondidas al instante por IA especializada',
    type: 'website',
    url: 'https://kumplio.app/vera',
    images: [
      {
        url: 'https://kumplio.app/og-vera.png',
        width: 1200,
        height: 630,
      },
    ],
  },
}

export default function VeraLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
