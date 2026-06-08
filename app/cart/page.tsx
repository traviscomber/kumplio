'use client'

import { Suspense } from 'react'
import { CartContent } from '@/components/cart-content'

export const dynamic = 'force-dynamic'

export default function CartPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <CartContent />
    </Suspense>
  )
}
