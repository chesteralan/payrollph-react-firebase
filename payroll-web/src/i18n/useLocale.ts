import { useState, useEffect, useCallback } from 'react'
import { type Locale, type LocaleMessages, loadMessages, t as translate, setHtmlLang } from './index'

interface UseLocaleReturn {
  locale: Locale
  messages: LocaleMessages | null
  setLocale: (locale: Locale) => void
  t: (key: string, values?: Record<string, string | number>) => string
}

const localeKey = 'payroll-locale'
const defaultLocale: Locale = 'en-US'

function getStoredLocale(): Locale {
  try {
    const stored = localStorage.getItem(localeKey)
    if (stored && ['en-US', 'en-PH', 'fil-PH'].includes(stored)) {
      return stored as Locale
    }
  } catch {}
  return defaultLocale
}

function storeLocale(locale: Locale): void {
  try {
    localStorage.setItem(localeKey, locale)
  } catch {}
}

export function useLocale(): UseLocaleReturn {
  const [locale, setLocaleState] = useState<Locale>(getStoredLocale)
  const [messages, setMessages] = useState<LocaleMessages | null>(null)

  useEffect(() => {
    loadMessages(locale).then((msgs) => {
      setMessages(msgs)
      setHtmlLang(locale)
    })
  }, [locale])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    storeLocale(newLocale)
  }, [])

  const translateFn = useCallback(
    (key: string, values?: Record<string, string | number>) => {
      if (!messages) return key
      return translate(messages, key, values)
    },
    [messages]
  )

  return { locale, messages, setLocale, t: translateFn }
}
