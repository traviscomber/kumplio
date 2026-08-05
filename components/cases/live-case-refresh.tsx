'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'

export function LiveCaseRefresh({ active }: { active: boolean }) {
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (!active) return
    const timer = window.setInterval(() => router.refresh(), 3000)
    return () => window.clearInterval(timer)
  }, [active, router])

  function refresh() {
    setRefreshing(true)
    router.refresh()
    window.setTimeout(() => setRefreshing(false), 500)
  }

  return (
    <button
      type="button"
      onClick={refresh}
      className="inline-flex items-center rounded-xl border px-4 py-2 text-sm font-semibold transition hover:bg-muted"
    >
      <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
      Actualizar
    </button>
  )
}
