import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

interface VirtualScrollProps<T> {
  items: T[]
  rowHeight: number
  containerHeight: number
  overscan?: number
  renderRow: (item: T, index: number, style: React.CSSProperties) => React.ReactNode
  getKey: (item: T, index: number) => string
  className?: string
}

export function VirtualScroll<T>({
  items,
  rowHeight,
  containerHeight,
  overscan = 5,
  renderRow,
  getKey,
  className = '',
}: VirtualScrollProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const totalHeight = useMemo(() => items.length * rowHeight, [items.length, rowHeight])

  const visibleStartIndex = useMemo(
    () => Math.max(0, Math.floor(scrollTop / rowHeight) - overscan),
    [scrollTop, rowHeight, overscan]
  )

  const visibleEndIndex = useMemo(
    () =>
      Math.min(
        items.length,
        Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan
      ),
    [scrollTop, containerHeight, rowHeight, overscan, items.length]
  )

  const visibleItems = useMemo(() => {
    const result: { item: T; index: number; style: React.CSSProperties }[] = []
    for (let i = visibleStartIndex; i < visibleEndIndex; i++) {
      result.push({
        item: items[i],
        index: i,
        style: {
          position: 'absolute',
          top: i * rowHeight,
          left: 0,
          right: 0,
          height: rowHeight,
        },
      })
    }
    return result
  }, [items, visibleStartIndex, visibleEndIndex, rowHeight])

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop)
    }
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      role="list"
    >
      <div style={{ position: 'relative', height: totalHeight }}>
        {visibleItems.map(({ item, index, style }) => (
          <div key={getKey(item, index)} style={style}>
            {renderRow(item, index, style)}
          </div>
        ))}
      </div>
    </div>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useVirtualScroll(itemCount: number, itemHeight: number, containerHeight: number, overscan = 5) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const totalHeight = itemCount * itemHeight
  const visibleStartIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const visibleEndIndex = Math.min(itemCount, Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan)

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop)
    }
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  return {
    containerRef,
    totalHeight,
    visibleStartIndex,
    visibleEndIndex,
  }
}
