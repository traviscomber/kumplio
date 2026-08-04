'use client'

import * as React from 'react'

type ProgressProps = React.HTMLAttributes<HTMLDivElement> & {
  value?: number | null
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ value = 0, className = '', ...props }, ref) => {
    const normalizedValue = Math.min(100, Math.max(0, Number.isFinite(value) ? Number(value) : 0))

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={normalizedValue}
        className={`relative h-2 w-full overflow-hidden rounded-full bg-muted ${className}`}
        {...props}
      >
        <div
          className="h-full w-full flex-1 bg-primary transition-transform"
          style={{ transform: `translateX(-${100 - normalizedValue}%)` }}
        />
      </div>
    )
  },
)

Progress.displayName = 'Progress'
