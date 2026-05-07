const XSS_PATTERNS = [
  /<script[^>]*>[\s\S]*?<\/script>/gi,
  /javascript\s*:/gi,
  /on\w+\s*=/gi,
  /<iframe[^>]*>[\s\S]*?<\/iframe>/gi,
  /<object[^>]*>[\s\S]*?<\/object>/gi,
  /<embed[^>]*>[\s\S]*?<\/embed>/gi,
  /<form[^>]*>[\s\S]*?<\/form>/gi,
  /<svg[^>]*>[\s\S]*?<\/svg>/gi,
  /data\s*:/gi,
  /vbscript\s*:/gi,
  /expression\s*\(/gi,
]

const SQL_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|EXEC|UNION|SCRIPT)\b)/gi,
  /(--|;|\/\*|\*\/)/g,
]

export function sanitizeHTML(input: string): string {
  return XSS_PATTERNS.reduce(
    (str, pattern) => str.replace(pattern, ''),
    input
  )
}

export function sanitizeSQL(input: string): string {
  return SQL_PATTERNS.reduce(
    (str, pattern) => str.replace(pattern, ''),
    input
  )
}

export function sanitizeInput(input: string, options?: {
  trim?: boolean
  lowerCase?: boolean
  upperCase?: boolean
  maxLength?: number
  allowHTML?: boolean
  allowSpecialChars?: boolean
}): string {
  const opts = {
    trim: true,
    lowerCase: false,
    upperCase: false,
    maxLength: 1000,
    allowHTML: false,
    allowSpecialChars: true,
    ...options,
  }

  let result = input

  if (opts.trim) {
    result = result.trim()
  }

  if (opts.maxLength && result.length > opts.maxLength) {
    result = result.slice(0, opts.maxLength)
  }

  if (!opts.allowHTML) {
    result = sanitizeHTML(result)
  }

  result = sanitizeSQL(result)

  if (opts.lowerCase) {
    result = result.toLowerCase()
  }

  if (opts.upperCase) {
    result = result.toUpperCase()
  }

  if (!opts.allowSpecialChars) {
    result = result.replace(/[^a-zA-Z0-9\s]/g, '')
  }

  return result
}

export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase().replace(/[^a-zA-Z0-9@._+-]/g, '')
}

export function sanitizePhone(phone: string): string {
  return phone.replace(/[^0-9+\s()-]/g, '')
}

export function sanitizeNumber(input: string): number | null {
  const cleaned = input.replace(/[^0-9.-]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

export function escapeHTML(str: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  }
  return str.replace(/[&<>"'/]/g, c => map[c])
}

export function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
