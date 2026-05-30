'use client'

import type { ButtonHTMLAttributes } from 'react'
import { Sparkles } from 'lucide-react'
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
          'linear-gradient(90deg, oklch(0.76 0.14 16) 0%, oklch(0.67 0.19 11) 50%, oklch(0.59 0.21 8) 100%)',
        ...style,
      }}
      className={cn(
        'group relative block w-full overflow-hidden rounded-2xl py-4 text-center text-base font-bold text-primary-foreground',
        'shadow-[0_10px_40px_-8px_oklch(0.64_0.25_6_/_0.7)] ring-1 ring-inset ring-[oklch(0.88_0.08_6_/_0.55)]',
        'transition-all duration-200 hover:brightness-110 active:scale-[0.98]',
        className,
      )}
      {...props}
    >
      {/* Glossy top highlight */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent"
      />
      <span className="relative z-10 flex items-center justify-center gap-2">
        <Sparkles className="size-4" aria-hidden="true" />
        {children}
      </span>
    </button>
  )
}
