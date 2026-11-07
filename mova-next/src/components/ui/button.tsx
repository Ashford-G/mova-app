import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva('inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:pointer-events-none disabled:opacity-50', {
  variants: {
    variant: {
      default: 'bg-emerald-400 text-slate-950 hover:bg-emerald-300 shadow-lg shadow-emerald-950/20',
      secondary: 'bg-white/8 text-slate-100 hover:bg-white/12 border border-white/10',
      ghost: 'text-slate-300 hover:bg-white/8 hover:text-white',
      outline: 'border border-white/12 text-slate-100 hover:bg-white/8',
    },
    size: { default: 'h-10 px-4 py-2', sm: 'h-8 rounded-lg px-3 text-xs', lg: 'h-12 px-6', icon: 'h-10 w-10' },
  }, defaultVariants: { variant: 'default', size: 'default' },
})
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { asChild?: boolean }
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button'
  return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
})
Button.displayName = 'Button'
