'use client'

import type { ButtonHTMLAttributes } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CtaButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

export function CtaButton({ children, className, style, ...props }: CtaButtonProps) {
  return (
    <button
      type="button"
      style={{
        backgroundImage:
          'linear-gradient(90deg, oklch(0.62 0.21 12) 0%, oklch(0.56 0.23 9) 50%, oklch(0.5 0.22 8) 100%)',
        ...style,
      }}
      className={cn(
        'group relative block w-full overflow-hidden rounded-2xl py-4 text-center text-base font-bold text-primary-foreground',
        'shadow-[0_10px_40px_-8px_oklch(0.55_0.22_9_/_0.7)]',
        'transition-all duration-200 hover:brightness-110 active:scale-[0.98]',
        'disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none disabled:hover:brightness-100 disabled:active:scale-100',
        className,
      )}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
        <ChevronRight className="size-4" aria-hidden="true" />
      </span>
    </button>
  )
}
