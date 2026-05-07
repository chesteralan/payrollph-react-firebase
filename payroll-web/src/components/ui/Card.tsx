import { memo } from 'react'
import { clsx } from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export const Card = memo(function Card({ children, className, onClick }: CardProps) {
  const isClickable = !!onClick
  return (
    <div
      className={clsx('bg-white rounded-lg border border-gray-200 shadow-sm', isClickable && 'cursor-pointer hover:shadow-md transition-shadow', className)}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } } : undefined}
    >
      {children}
    </div>
  )
})

export const CardHeader = memo(function CardHeader({ children, className }: CardProps) {
  return <div className={clsx('px-6 py-4 border-b border-gray-200', className)}>{children}</div>
})

export const CardTitle = memo(function CardTitle({ children, className }: CardProps) {
  return <h3 className={clsx('text-lg font-semibold text-gray-900', className)}>{children}</h3>
})

export const CardContent = memo(function CardContent({ children, className }: CardProps) {
  return <div className={clsx('px-6 py-4', className)}>{children}</div>
})

export const CardFooter = memo(function CardFooter({ children, className }: CardProps) {
  return <div className={clsx('px-6 py-4 border-t border-gray-200 bg-gray-50', className)}>{children}</div>
})
