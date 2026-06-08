import React from 'react'
import { Button } from './button'
import { ArrowRight } from 'lucide-react'

interface ButtonWithArrowProps extends React.ComponentPropsWithoutRef<typeof Button> {
  children: React.ReactNode
  showArrow?: boolean
  arrowPosition?: 'right' | 'left'
}

export const ButtonWithArrow = React.forwardRef<
  HTMLButtonElement,
  ButtonWithArrowProps
>(
  (
    {
      children,
      showArrow = true,
      arrowPosition = 'right',
      className = '',
      ...props
    },
    ref,
  ) => {
    return (
      <Button
        ref={ref}
        className={`group/arrow relative transition-all ${className}`}
        {...props}
      >
        {arrowPosition === 'left' && showArrow && (
          <ArrowRight className="w-5 h-5 mr-2 group-hover/arrow:-translate-x-1 group-hover/arrow:scale-110 transition-all duration-300" style={{ transform: 'scaleX(-1)' }} />
        )}
        <span className="relative">{children}</span>
        {arrowPosition === 'right' && showArrow && (
          <ArrowRight className="w-5 h-5 ml-2 group-hover/arrow:translate-x-1 group-hover/arrow:scale-110 transition-all duration-300" />
        )}
      </Button>
    )
  },
)

ButtonWithArrow.displayName = 'ButtonWithArrow'
