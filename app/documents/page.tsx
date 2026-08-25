export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'

export default async function DocumentsPage() {
  redirect('/app/documentos')
}
