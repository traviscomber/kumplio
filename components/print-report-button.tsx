'use client'

import { Printer } from 'lucide-react'

export function PrintReportButton() {
  return <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground print:hidden"><Printer className="h-4 w-4"/>Guardar como PDF</button>
}
