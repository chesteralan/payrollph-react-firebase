import { useState, useCallback } from 'react'

export interface ValidationRule<T> {
  field: keyof T
  validate: (value: T[keyof T], data: T) => boolean
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

export function validate<T extends Record<string, unknown>>(
  data: T,
  rules: ValidationRule<T>[]
): ValidationResult {
  const errors: Record<string, string> = {}

  for (const rule of rules) {
    const value = data[rule.field]
    if (!rule.validate(value, data)) {
      errors[String(rule.field)] = rule.message
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

export const rules = {
  required: (message = 'This field is required') => ({
    validate: (value: unknown) => value !== null && value !== undefined && String(value).trim() !== '',
    message,
  }),

  minLength: (min: number, message?: string) => ({
    validate: (value: unknown) => String(value || '').length >= min,
    message: message || `Must be at least ${min} characters`,
  }),

  maxLength: (max: number, message?: string) => ({
    validate: (value: unknown) => String(value || '').length <= max,
    message: message || `Must be at most ${max} characters`,
  }),

  email: (message = 'Invalid email address') => ({
    validate: (value: unknown) => {
      const email = String(value || '')
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    },
    message,
  }),

  phone: (message = 'Invalid phone number') => ({
    validate: (value: unknown) => {
      const phone = String(value || '').replace(/[\s()-]/g, '')
      return /^\+?\d{7,15}$/.test(phone)
    },
    message,
  }),

  number: (message = 'Must be a number') => ({
    validate: (value: unknown) => {
      if (value === null || value === undefined || value === '') return true
      return !isNaN(Number(value))
    },
    message,
  }),

  min: (min: number, message?: string) => ({
    validate: (value: unknown) => Number(value) >= min,
    message: message || `Must be at least ${min}`,
  }),

  max: (max: number, message?: string) => ({
    validate: (value: unknown) => Number(value) <= max,
    message: message || `Must be at most ${max}`,
  }),

  pattern: (regex: RegExp, message: string) => ({
    validate: (value: unknown) => regex.test(String(value || '')),
    message,
  }),

  unique: (values: string[], message = 'Value must be unique') => ({
    validate: (value: unknown) => !values.includes(String(value || '')),
    message,
  }),

  date: (message = 'Invalid date') => ({
    validate: (value: unknown) => {
      if (!value) return true
      const date = new Date(String(value))
      return !isNaN(date.getTime())
    },
    message,
  }),

  futureDate: (message = 'Date must be in the future') => ({
    validate: (value: unknown) => {
      if (!value) return true
      const date = new Date(String(value))
      return date > new Date()
    },
    message,
  }),

  pastDate: (message = 'Date must be in the past') => ({
    validate: (value: unknown) => {
      if (!value) return true
      const date = new Date(String(value))
      return date < new Date()
    },
    message,
  }),
}

export function useValidation<T extends Record<string, unknown>>(initialData: T) {
  const [data, setData] = useState<T>(initialData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Set<string>>(new Set())

  const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setData(prev => ({ ...prev, [field]: value }))
  }, [])

  const touchField = useCallback((field: string) => {
    setTouched(prev => new Set([...prev, field]))
  }, [])

  const runValidation = useCallback((validationRules: ValidationRule<T>[]) => {
    const result = validate<T>(data, validationRules)
    setErrors(result.errors)
    return result
  }, [data])

  const getFieldError = useCallback((field: string) => {
    return touched.has(field) ? errors[field] : undefined
  }, [touched, errors])

  const reset = useCallback(() => {
    setData(initialData)
    setErrors({})
    setTouched(new Set())
  }, [initialData])

  return {
    data,
    errors,
    touched,
    updateField,
    touchField,
    validate: runValidation,
    getFieldError,
    reset,
    isValid: Object.keys(errors).length === 0,
  }
}
