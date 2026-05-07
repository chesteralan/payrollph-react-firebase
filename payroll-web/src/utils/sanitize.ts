// Input sanitization utilities for preventing XSS and injection attacks

/**
 * Sanitize a string by escaping HTML special characters
 */
export const sanitizeString = (input: string): string => {
  if (typeof input !== 'string') return ''
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim()
}

/**
 * Sanitize and validate email
 */
export const sanitizeEmail = (email: string): string => {
  if (typeof email !== 'string') return ''
  const sanitized = email.trim().toLowerCase()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(sanitized) ? sanitized : ''
}

/**
 * Sanitize phone number (allow only digits, +, -, (, ), and spaces)
 */
export const sanitizePhone = (phone: string): string => {
  if (typeof phone !== 'string') return ''
  return phone.replace(/[^0-9+\-()\s]/g, '').trim()
}

/**
 * Sanitize name (letters, spaces, hyphens, apostrophes only)
 */
export const sanitizeName = (name: string): string => {
  if (typeof name !== 'string') return ''
  return name.replace(/[^a-zA-Z\s\-']/g, '').trim()
}

/**
 * Sanitize numeric input (allow only digits and decimal point)
 */
export const sanitizeNumber = (value: string, allowNegative: boolean = false): string => {
  if (typeof value !== 'string') return ''
  const pattern = allowNegative ? /[^0-9.-]/g : /[^0-9.]/g
  return value.replace(pattern, '')
}

/**
 * Sanitize currency input (allow digits, decimal point, and optional minus)
 */
export const sanitizeCurrency = (value: string): string => {
  if (typeof value !== 'string') return ''
  const sanitized = value.replace(/[^0-9.]/g, '')
  const parts = sanitized.split('.')
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('')
  }
  return sanitized
}

/**
 * Sanitize filename (remove path traversal and special characters)
 */
export const sanitizeFilename = (filename: string): string => {
  if (typeof filename !== 'string') return ''
  return filename
    .replace(/\.\./g, '')
    .replace(/[/\\:*?"<>|]/g, '_')
    .trim()
    .substring(0, 255)
}

/**
 * Sanitize HTML content (basic - strips all tags)
 * For rich text, use a proper library like DOMPurify
 */
export const stripHtml = (html: string): string => {
  if (typeof html !== 'string') return ''
  return html.replace(/<[^>]*>/g, '')
}

/**
 * Validate and sanitize date string
 */
export const sanitizeDate = (dateStr: string): string | null => {
  if (typeof dateStr !== 'string') return null
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return null
  return date.toISOString()
}

/**
 * Sanitize object recursively
 */
export const sanitizeObject = <T extends Record<string, unknown>>(
  obj: T,
  sanitizers: Partial<Record<keyof T, (value: unknown) => unknown>>
): T => {
  const sanitized = { ...obj }
  for (const key in sanitizers) {
    if (key in sanitized && sanitizers[key]) {
      sanitized[key] = sanitizers[key]!(sanitized[key]) as T[keyof T]
    }
  }
  return sanitized
}

/**
 * Check if input contains potential SQL injection patterns
 */
export const containsSqlInjection = (input: string): boolean => {
  if (typeof input !== 'string') return false
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC)\b)/i,
    /(--|\/\*|\*\/|;)/,
    /(\bOR\b\s*\d+\s*=\s*\d+)/i,
    /(\bAND\b\s*\d+\s*=\s*\d+)/i,
  ]
  return sqlPatterns.some(pattern => pattern.test(input))
}

/**
 * Check if input contains potential XSS patterns
 */
export const containsXss = (input: string): boolean => {
  if (typeof input !== 'string') return false
  const xssPatterns = [
    /<script\b[^>]*>(.*?)<\/script>/gi,
    /on\w+\s*=/gi,
    /javascript\s*:/gi,
    /<iframe\b[^>]*>(.*?)<\/iframe>/gi,
  ]
  return xssPatterns.some(pattern => pattern.test(input))
}

/**
 * Comprehensive input validation
 */
export const validateInput = (
  input: string,
  options: {
    maxLength?: number
    minLength?: number
    pattern?: RegExp
    allowHtml?: boolean
  } = {}
): { isValid: boolean; sanitized: string; errors: string[] } => {
  const errors: string[] = []
  let sanitized = options.allowHtml ? input : sanitizeString(input)

  if (options.maxLength && sanitized.length > options.maxLength) {
    errors.push(`Input exceeds maximum length of ${options.maxLength}`)
    sanitized = sanitized.substring(0, options.maxLength)
  }

  if (options.minLength && sanitized.length < options.minLength) {
    errors.push(`Input must be at least ${options.minLength} characters`)
  }

  if (options.pattern && !options.pattern.test(sanitized)) {
    errors.push('Input does not match required pattern')
  }

  if (containsSqlInjection(sanitized)) {
    errors.push('Input contains invalid characters')
  }

  if (!options.allowHtml && containsXss(sanitized)) {
    errors.push('Input contains invalid characters')
  }

  return {
    isValid: errors.length === 0,
    sanitized,
    errors,
  }
}
