'use client'

import { useState, useEffect } from 'react'

export function CountdownTimer() {
  const [seconds, setSeconds] = useState<number | null>(null)

  useEffect(() => {
    // Set target date: December 1, 2026 at 00:00:00
    const targetDate = new Date('2026-12-01T00:00:00').getTime()

    // Update every second
    const interval = setInterval(() => {
      const now = new Date().getTime()
      const difference = targetDate - now

      if (difference > 0) {
        const totalSeconds = Math.floor(difference / 1000)
        setSeconds(totalSeconds)
      } else {
        setSeconds(0)
        clearInterval(interval)
      }
    }, 1000)

    // Set initial value immediately
    const now = new Date().getTime()
    const difference = targetDate - now
    if (difference > 0) {
      setSeconds(Math.floor(difference / 1000))
    }

    return () => clearInterval(interval)
  }, [])

  if (seconds === null) {
    return null
  }

  // Format seconds into readable display
  const days = Math.floor(seconds / (24 * 60 * 60))
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60))
  const minutes = Math.floor((seconds % (60 * 60)) / 60)
  const secs = seconds % 60

  return (
    <div className="flex flex-col items-center justify-center h-full">
      {/* Large seconds counter - HIDDEN */}
      <div className="hidden">
        <div className="relative">
          {/* SVG with red crossing lines */}
          <svg
            className="absolute inset-0 w-full h-full"
            style={{ pointerEvents: 'none' }}
            viewBox="0 0 300 120"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Top-left to bottom-right diagonal */}
            <line x1="20" y1="10" x2="280" y2="110" stroke="#ef4444" strokeWidth="3" />
            {/* Top-right to bottom-left diagonal */}
            <line x1="280" y1="10" x2="20" y2="110" stroke="#ef4444" strokeWidth="3" />
          </svg>

          <div className="text-7xl md:text-8xl font-black tabular-nums relative z-10">
            <div className="text-primary mb-6">{String(seconds).padStart(6, '0')}</div>
            <div className="text-sm md:text-base font-semibold text-muted-foreground">
              SEGUNDOS
            </div>
          </div>
        </div>
      </div>
      
      {/* Breakdown display - Visible */}
      <div className="grid grid-cols-4 gap-8 text-center">
        <div>
          <div className="text-4xl md:text-5xl font-bold text-primary">{days}</div>
          <div className="text-sm text-muted-foreground mt-2">Días</div>
        </div>
        <div>
          <div className="text-4xl md:text-5xl font-bold text-primary">{String(hours).padStart(2, '0')}</div>
          <div className="text-sm text-muted-foreground mt-2">Horas</div>
        </div>
        <div>
          <div className="text-4xl md:text-5xl font-bold text-primary">{String(minutes).padStart(2, '0')}</div>
          <div className="text-sm text-muted-foreground mt-2">Min</div>
        </div>
        <div>
          <div className="text-4xl md:text-5xl font-bold text-primary">{String(secs).padStart(2, '0')}</div>
          <div className="text-sm text-muted-foreground mt-2">Seg</div>
        </div>
      </div>
    </div>
  )
}
