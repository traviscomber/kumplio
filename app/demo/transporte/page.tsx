import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Transporte | Casos de uso de Kumplio',
  robots: { index: false, follow: true },
}

export default function TransporteDemoPage() {
  redirect('/use-cases')
}
