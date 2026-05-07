import { clsx } from 'clsx'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
  lines?: number
  animation?: 'pulse' | 'wave' | 'none'
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  lines = 1,
  animation = 'pulse',
}: SkeletonProps) {
  const baseStyle = clsx(
    'bg-gray-200 rounded',
    {
      'animate-pulse': animation === 'pulse',
      'rounded-full': variant === 'circular',
    },
    className
  )

  const style: React.CSSProperties = {
    width: width || (variant === 'circular' ? '40px' : '100%'),
    height: height || (variant === 'text' ? '1em' : variant === 'circular' ? '40px' : '100%'),
  }

  if (variant === 'text' && lines > 1) {
    return (
      <div className="space-y-2" aria-hidden="true">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={baseStyle}
            style={{
              ...style,
              width: i === lines - 1 ? '75%' : undefined,
            }}
          />
        ))}
      </div>
    )
  }

  return <div className={baseStyle} style={style} aria-hidden="true" />
}

export function CardSkeleton({
  lines = 3,
  showHeader = true,
  className,
}: { lines?: number; showHeader?: boolean; className?: string }) {
  return (
    <div className={clsx('bg-white rounded-lg border border-gray-200 p-6 space-y-4', className)}>
      {showHeader && (
        <div className="flex items-center justify-between">
          <Skeleton width="150px" height="24px" />
          <Skeleton width="100px" height="36px" variant="rectangular" />
        </div>
      )}
      <Skeleton lines={lines} />
    </div>
  )
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} width={`${100 / cols}%`} height="16px" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-6 py-4">
            <div className="flex gap-4">
              {Array.from({ length: cols }).map((_, j) => (
                <Skeleton key={j} width={`${100 / cols}%`} height="16px" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function PageSkeleton({ sections = 3 }: { sections?: number }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton width="200px" height="32px" />
        <Skeleton width="120px" height="40px" variant="rectangular" />
      </div>
      {Array.from({ length: sections }).map((_, i) => (
        <CardSkeleton key={i} lines={2 + i} />
      ))}
    </div>
  )
}
