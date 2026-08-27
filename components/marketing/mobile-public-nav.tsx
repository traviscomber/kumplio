'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

type MobilePublicNavProps = {
  alternateHomeHref: string
  switchLanguage: string
  signIn: string
  tryLabel: string
  items: Array<{ href: string; label: string }>
  menuLabel: string
}

export function MobilePublicNav({ alternateHomeHref, switchLanguage, signIn, tryLabel, items, menuLabel }: MobilePublicNavProps) {
  const [open, setOpen] = useState(false)

  function closeMenu() {
    setOpen(false)
  }

  return (
    <div className="flex items-center gap-2 lg:hidden">
      <Link href={alternateHomeHref} className="rounded border border-white/10 px-2.5 py-2 text-[11px] text-[#C2B6A4]">
        {switchLanguage}
      </Link>
      <button
        type="button"
        aria-label={menuLabel}
        aria-expanded={open}
        aria-controls="mobile-public-menu"
        onClick={() => setOpen(current => !current)}
        className="inline-flex h-10 w-10 items-center justify-center rounded border border-white/15 text-[#E0C5A1]"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      {open && (
        <div id="mobile-public-menu" className="absolute inset-x-4 top-[70px] border border-white/12 bg-[#171715]/98 p-4 shadow-[0_24px_70px_rgba(0,0,0,.65)] backdrop-blur-xl">
          <div className="grid">
            {items.map(item => (
              <Link key={item.href} href={item.href} onClick={closeMenu} className="border-b border-white/8 px-2 py-3.5 text-sm text-[#D5C9B7] last:border-b-0">
                {item.label}
              </Link>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link href="/sign-in" onClick={closeMenu} className="inline-flex min-h-11 items-center justify-center rounded border border-white/15 text-sm text-[#C2B6A4]">
              {signIn}
            </Link>
            <Button asChild className="min-h-11 rounded px-3 text-sm">
              <a href="#resolver-form" onClick={closeMenu}>{tryLabel}</a>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
