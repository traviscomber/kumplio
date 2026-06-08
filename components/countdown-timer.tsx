'use client'

import { useState, useEffect } from 'react'

export function CountdownTimer() {
  const [seconds, setSeconds] = useState<number | null>(null)

  useEffect(() => {
    // Set target date: December 1, 2026 at 00:00:00
    const targetDate = new Date('2026-12-01T00:00:00').getTime()

    const tick = () => {
      const now = new Date().getTime()
      const difference = targetDate - now
      if (difference > 0) {
        setSeconds(Math.floor(difference / 1000))
      } else {
        setSeconds(0)
      }
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [])

  if (seconds === null) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-40 w-full max-w-md rounded-2xl border border-primary/20 bg-card/40 animate-pulse" />
      </div>
    )
  }

  const days = Math.floor(seconds / (24 * 60 * 60))
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60))
  const minutes = Math.floor((seconds % (60 * 60)) / 60)
  const secs = seconds % 60

  const units = [
    { value: days, label: 'Días', max: 365 },
    { value: hours, label: 'Horas', max: 24 },
    { value: minutes, label: 'Min', max: 60 },
    { value: secs, label: 'Seg', max: 60, live: true },
  ]

  return (
    <div className="relative flex flex-col items-center justify-center h-full w-full">
      {/* Animated circuit grid backdrop */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(177,211,116,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(177,211,116,0.4) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        }}
      />

      {/* Pulsing ambient glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-64 w-64 rounded-full bg-primary/10 blur-3xl animate-pulse" />
      </div>

      {/* Status label */}
      <div className="relative z-10 mb-6 flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
        </span>
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
          Cuenta Regresiva Activa
        </span>
      </div>

      {/* Digit panels */}
      <div className="relative z-10 grid grid-cols-4 gap-3 md:gap-4">
        {units.map((unit) => {
          const pct = Math.min(100, (unit.value / unit.max) * 100)
          return (
            <div
              key={unit.label}
              className="group relative flex flex-col items-center"
            >
              {/* Glowing panel */}
              <div
                className={`relative w-[68px] md:w-[84px] overflow-hidden rounded-xl border bg-card/60 backdrop-blur-sm transition-all duration-300 ${
                  unit.live
                    ? 'border-primary/60 shadow-[0_0_25px_-4px_rgba(177,211,116,0.6)]'
                    : 'border-primary/20'
                }`}
              >
                {/* Scan line sweep */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-primary/70 animate-scan" />

                {/* Top progress arc */}
                <div className="h-1 w-full bg-primary/10">
                  <div
                    className="h-full bg-primary transition-all duration-700 ease-out"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* The digit */}
                <div className="flex items-center justify-center py-4 md:py-5">
                  <span
                    key={unit.value}
                    className={`font-mono text-4xl md:text-5xl font-black tabular-nums text-primary ${
                      unit.live ? 'animate-tick' : ''
                    }`}
                    style={{
                      textShadow: '0 0 18px rgba(177,211,116,0.55)',
                    }}
                  >
                    {String(unit.value).padStart(2, '0')}
                  </span>
                </div>

                {/* Corner brackets */}
                <span className="pointer-events-none absolute left-1 top-1 h-2 w-2 border-l border-t border-primary/50" />
                <span className="pointer-events-none absolute right-1 top-1 h-2 w-2 border-r border-t border-primary/50" />
                <span className="pointer-events-none absolute bottom-1 left-1 h-2 w-2 border-b border-l border-primary/50" />
                <span className="pointer-events-none absolute bottom-1 right-1 h-2 w-2 border-b border-r border-primary/50" />
              </div>

              {/* Label */}
              <span className="mt-3 font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {unit.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Bottom ticker */}
      <div className="relative z-10 mt-6 font-mono text-[11px] tracking-wider text-muted-foreground">
        <span className="text-primary">{'>'}</span> Ley 21.719 · 01.12.2026 ·{' '}
        <span className="text-primary animate-pulse">SYNC</span>
      </div>

      <style jsx>{`
        @keyframes scan {
          0% {
            transform: translateY(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(70px);
            opacity: 0;
          }
        }
        :global(.animate-scan) {
          animation: scan 3s linear infinite;
        }
        @keyframes tick {
          0% {
            transform: translateY(-40%) scale(0.85);
            opacity: 0;
            filter: blur(4px);
          }
          60% {
            transform: translateY(0) scale(1.05);
            opacity: 1;
            filter: blur(0);
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
        :global(.animate-tick) {
          animation: tick 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        }
      `}</style>
    </div>
  )
}
