import { useState, useCallback, useMemo } from 'react'

export type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'DD-MMM-YYYY' | 'MMM DD, YYYY'
export type TimeFormat = '12h' | '24h'

interface DateTimeFormatConfig {
  dateFormat: DateFormat
  timeFormat: TimeFormat
  locale?: string
}

const defaultConfig: DateTimeFormatConfig = {
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  locale: 'en-US',
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const monthNamesFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function padZero(n: number): string {
  return n.toString().padStart(2, '0')
}

export function formatDate(date: Date | string | number, format: DateFormat, locale = 'en-US'): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  if (isNaN(d.getTime())) return 'Invalid Date'

  const month = d.getMonth() + 1
  const day = d.getDate()
  const year = d.getFullYear()
  const monthName = monthNames[d.getMonth()]
  const monthNameFull = monthNamesFull[d.getMonth()]

  switch (format) {
    case 'MM/DD/YYYY':
      return `${padZero(month)}/${padZero(day)}/${year}`
    case 'DD/MM/YYYY':
      return `${padZero(day)}/${padZero(month)}/${year}`
    case 'YYYY-MM-DD':
      return `${year}-${padZero(month)}-${padZero(day)}`
    case 'DD-MMM-YYYY':
      return `${padZero(day)}-${monthName}-${year}`
    case 'MMM DD, YYYY':
      return `${monthName} ${day}, ${year}`
    default:
      return d.toLocaleDateString(locale)
  }
}

export function formatTime(date: Date | string | number, format: TimeFormat, locale = 'en-US'): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  if (isNaN(d.getTime())) return 'Invalid Time'

  if (format === '24h') {
    return `${padZero(d.getHours())}:${padZero(d.getMinutes())}`
  }

  const hours = d.getHours()
  const minutes = d.getMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const h = hours % 12 || 12
  return `${h}:${padZero(minutes)} ${ampm}`
}

export function formatDateTime(date: Date | string | number, config: DateTimeFormatConfig): string {
  const dateStr = formatDate(date, config.dateFormat, config.locale)
  const timeStr = formatTime(date, config.timeFormat, config.locale)
  return `${dateStr} ${timeStr}`
}

export function formatDateRange(start: Date | string | number, end: Date | string | number, config: DateTimeFormatConfig): string {
  const startStr = formatDate(start, config.dateFormat, config.locale)
  const endStr = formatDate(end, config.dateFormat, config.locale)
  return `${startStr} - ${endStr}`
}

export function parseDate(input: string, format: DateFormat): Date | null {
  const cleaned = input.trim()
  if (!cleaned) return null

  let month: number, day: number, year: number

  try {
    switch (format) {
      case 'MM/DD/YYYY': {
        const parts = cleaned.split('/')
        if (parts.length !== 3) return null
        month = parseInt(parts[0], 10) - 1
        day = parseInt(parts[1], 10)
        year = parseInt(parts[2], 10)
        break
      }
      case 'DD/MM/YYYY': {
        const parts = cleaned.split('/')
        if (parts.length !== 3) return null
        day = parseInt(parts[0], 10)
        month = parseInt(parts[1], 10) - 1
        year = parseInt(parts[2], 10)
        break
      }
      case 'YYYY-MM-DD': {
        const parts = cleaned.split('-')
        if (parts.length !== 3) return null
        year = parseInt(parts[0], 10)
        month = parseInt(parts[1], 10) - 1
        day = parseInt(parts[2], 10)
        break
      }
      case 'DD-MMM-YYYY': {
        const parts = cleaned.split('-')
        if (parts.length !== 3) return null
        day = parseInt(parts[0], 10)
        month = monthNames.indexOf(parts[1])
        year = parseInt(parts[2], 10)
        break
      }
      case 'MMM DD, YYYY': {
        const match = cleaned.match(/^(\w+)\s+(\d{1,2}),?\s+(\d{4})$/)
        if (!match) return null
        month = monthNames.indexOf(match[1])
        day = parseInt(match[2], 10)
        year = parseInt(match[3], 10)
        break
      }
      default:
        return null
    }

    const date = new Date(year, month, day)
    if (isNaN(date.getTime())) return null
    return date
  } catch {
    return null
  }
}

export function useDateTimeFormat(initialConfig?: Partial<DateTimeFormatConfig>) {
  const [config, setConfig] = useState<DateTimeFormatConfig>({
    ...defaultConfig,
    ...initialConfig,
  })

  const format = useCallback(
    (date: Date | string | number) => formatDate(date, config.dateFormat, config.locale),
    [config.dateFormat, config.locale]
  )

  const formatTime = useCallback(
    (date: Date | string | number) => {
      const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
      return _formatTime(d, config.timeFormat, config.locale)
    },
    [config.timeFormat, config.locale]
  )

  const formatDateTime = useCallback(
    (date: Date | string | number) => {
      const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
      return _formatDateTime(d, config)
    },
    [config]
  )

  const updateConfig = useCallback((newConfig: Partial<DateTimeFormatConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }))
  }, [])

  return {
    config,
    format,
    formatTime,
    formatDateTime,
    updateConfig,
  }
}

function _formatTime(date: Date, format: TimeFormat, locale = 'en-US'): string {
  if (format === '24h') {
    return `${padZero(date.getHours())}:${padZero(date.getMinutes())}`
  }
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const h = hours % 12 || 12
  return `${h}:${padZero(minutes)} ${ampm}`
}

function _formatDateTime(date: Date, config: DateTimeFormatConfig): string {
  const dateStr = formatDate(date, config.dateFormat, config.locale)
  const timeStr = _formatTime(date, config.timeFormat, config.locale)
  return `${dateStr} ${timeStr}`
}
