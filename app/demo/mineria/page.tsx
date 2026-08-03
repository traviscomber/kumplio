import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Minería | Casos de uso de Kumplio',
  robots: { index: false, follow: true },
}

export default function MineriaDemoPage() {
  redirect('/use-cases')
}
