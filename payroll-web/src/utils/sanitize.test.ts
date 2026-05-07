import { describe, it, expect } from 'vitest'
import {
  sanitizeString,
  sanitizeEmail,
  sanitizePhone,
  sanitizeName,
  sanitizeNumber,
  sanitizeCurrency,
  sanitizeFilename,
  containsSqlInjection,
  containsXss,
  validateInput,
} from './sanitize'

describe('sanitizeString', () => {
  it('should escape HTML special characters', () => {
    expect(sanitizeString('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
    )
  })

  it('should handle empty string', () => {
    expect(sanitizeString('')).toBe('')
  })

  it('should trim whitespace', () => {
    expect(sanitizeString('  test  ')).toBe('test')
  })
})

describe('sanitizeEmail', () => {
  it('should lowercase and trim email', () => {
    expect(sanitizeEmail('  USER@EXAMPLE.COM  ')).toBe('user@example.com')
  })

  it('should reject invalid email', () => {
    expect(sanitizeEmail('not-an-email')).toBe('')
  })

  it('should accept valid email', () => {
    expect(sanitizeEmail('test@example.com')).toBe('test@example.com')
  })
})

describe('sanitizePhone', () => {
  it('should keep only valid phone characters', () => {
    expect(sanitizePhone('+1 (234) 567-890')).toBe('+1 (234) 567-890')
  })

  it('should remove invalid characters', () => {
    expect(sanitizePhone('123-ABC-456')).toBe('123--456')
  })
})

describe('sanitizeName', () => {
  it('should allow letters, spaces, hyphens, and apostrophes', () => {
    expect(sanitizeName("John O'Connor-Smith")).toBe("John O'Connor-Smith")
  })

  it('should remove numbers and special characters', () => {
    expect(sanitizeName('John123!@#')).toBe('John')
  })
})

describe('sanitizeNumber', () => {
  it('should keep only digits and decimal point', () => {
    expect(sanitizeNumber('123.45abc')).toBe('123.45')
  })

  it('should allow negative numbers when specified', () => {
    expect(sanitizeNumber('-123.45', true)).toBe('-123.45')
  })

  it('should remove negative sign by default', () => {
    expect(sanitizeNumber('-123.45')).toBe('123.45')
  })
})

describe('sanitizeCurrency', () => {
  it('should format currency value', () => {
    expect(sanitizeCurrency('$1,234.56')).toBe('1234.56')
  })

  it('should handle multiple decimal points', () => {
    expect(sanitizeCurrency('1.2.3.4')).toBe('1.234')
  })
})

describe('sanitizeFilename', () => {
  it('should remove path traversal attempts', () => {
    expect(sanitizeFilename('../../../etc/passwd')).toBe('___etc_passwd')
  })

  it('should remove invalid filename characters', () => {
    expect(sanitizeFilename('file*.txt')).toBe('file_.txt')
  })

  it('should limit length to 255 characters', () => {
    const longName = 'a'.repeat(300)
    expect(sanitizeFilename(longName)).toHaveLength(255)
  })
})

describe('containsSqlInjection', () => {
  it('should detect SELECT statements', () => {
    expect(containsSqlInjection("'; SELECT * FROM users; --")).toBe(true)
  })

  it('should detect UNION attacks', () => {
    expect(containsSqlInjection('1 UNION SELECT password FROM users')).toBe(true)
  })

  it('should allow safe input', () => {
    expect(containsSqlInjection('john doe')).toBe(false)
  })
})

describe('containsXss', () => {
  it('should detect script tags', () => {
    expect(containsXss('<script>alert(1)</script>')).toBe(true)
  })

  it('should detect onerror handlers', () => {
    expect(containsXss('<img src=x onerror=alert(1)>')).toBe(true)
  })

  it('should allow safe HTML', () => {
    expect(containsXss('<b>bold text</b>')).toBe(false)
  })
})

describe('validateInput', () => {
  it('should pass valid input', () => {
    const result = validateInput('test', { maxLength: 10, minLength: 2 })
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should fail on maxLength exceeded', () => {
    const result = validateInput('too long text', { maxLength: 5 })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Input exceeds maximum length of 5')
  })

  it('should fail on minLength not met', () => {
    const result = validateInput('ab', { minLength: 5 })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Input must be at least 5 characters')
  })

  it('should truncate to maxLength', () => {
    const result = validateInput('too long', { maxLength: 5 })
    expect(result.sanitized).toBe('too l')
  })
})
