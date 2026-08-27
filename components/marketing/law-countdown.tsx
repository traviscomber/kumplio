'use client'

import { useEffect, useState } from 'react'
import type { PublicLocale } from '@/lib/i18n/public-routing'

const EFFECTIVE_AT = new Date('2026-12-01T00:00:00-03:00').getTime()

type Remaining = {
  days: number
  hours: number
  minutes: number
}

const COPY = {
  es: {
    eyebrow: 'Cuenta regresiva legal',
    lead: 'La Ley 21.719 entra en vigor',
    date: '1 de diciembre de 2026',
    units: ['días', 'horas', 'min'] as const,
    active: 'La Ley 21.719 ya está vigente',
  },
  en: {
    eyebrow: 'Legal countdown',
    lead: 'Chilean Law 21.719 takes effect',
    date: 'December 1, 2026',
    units: ['days', 'hours', 'min'] as const,
    active: 'Chilean Law 21.719 is now in force',
  },
}

function getRemaining(): Remaining {
  const distance = Math.max(0, EFFECTIVE_AT - Date.now())
  return {
    days: Math.floor(distance / 86_400_000),
    hours: Math.floor((distance / 3_600_000) % 24),
    minutes: Math.floor((distance / 60_000) % 60),
  }
}

export function LawCountdown({ locale }: { locale: PublicLocale }) {
  const [remaining, setRemaining] = useState<Remaining | null>(null)
  const copy = COPY[locale]

  useEffect(() => {
    const update = () => setRemaining(getRemaining())
    update()
    const interval = window.setInterval(update, 60_000)
    return () => window.clearInterval(interval)
  }, [])

  const isActive = remaining && remaining.days === 0 && remaining.hours === 0 && remaining.minutes === 0

  return (
    <div className="mt-8 max-w-[620px] overflow-hidden rounded-2xl border border-[#B17A4D]/35 bg-[#151513]/72 shadow-[0_18px_60px_rgba(0,0,0,0.3)] backdrop-blur-md">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 sm:px-5">
        <span className="h-1.5 w-1.5 rounded-full bg-[#A7C63A] shadow-[0_0_12px_rgba(167,198,58,0.8)]" aria-hidden="true" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B17A4D]">{copy.eyebrow}</p>
      </div>
      <div className="grid items-center gap-4 px-4 py-4 sm:grid-cols-[1fr_auto] sm:px-5">
        <p className="text-sm leading-6 text-[#C2A887]">
          {isActive ? copy.active : <>{copy.lead}<br /><time dateTime="2026-12-01" className="font-semibold text-[#E0C5A1]">{copy.date}</time></>}
        </p>
        {!isActive && (
          <div className="grid grid-cols-3 divide-x divide-white/10" aria-label={`${copy.lead}: ${copy.date}`}>
            {[remaining?.days, remaining?.hours, remaining?.minutes].map((value, index) => (
              <div key={copy.units[index]} className="min-w-[66px] px-3 text-center first:pl-0 last:pr-0">
                <span className="block font-mono text-2xl font-light tabular-nums text-[#D5EA7C]">{value == null ? '—' : String(value).padStart(2, '0')}</span>
                <span className="mt-1 block text-[9px] uppercase tracking-[0.16em] text-[#8F8678]">{copy.units[index]}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
