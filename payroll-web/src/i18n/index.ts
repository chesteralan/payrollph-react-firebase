const locales = {
  'en-US': 'English (US)',
  'en-PH': 'English (Philippines)',
  'fil-PH': 'Filipino (Philippines)',
} as const

export type Locale = keyof typeof locales

export const localeLabels = locales

export interface LocaleMessages {
  common: Record<string, string>
  nav: Record<string, string>
  settings: Record<string, string>
  offline: Record<string, string>
  pagination: Record<string, string>
}

const allMessages: Record<Locale, () => Promise<LocaleMessages>> = {
  'en-US': () => import('./locales/en').then(m => m.en),
  'en-PH': () => import('./locales/en').then(m => m.en),
  'fil-PH': () => import('./locales/en').then(m => m.en),
}

export async function loadMessages(locale: Locale): Promise<LocaleMessages> {
  const loader = allMessages[locale]
  if (!loader) return allMessages['en-US']()
  return loader()
}

export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? `{${key}}`))
}

export function t(messages: LocaleMessages, key: string, values?: Record<string, string | number>): string {
  const parts = key.split('.')
  let result: unknown = messages
  for (const part of parts) {
    if (result && typeof result === 'object' && part in result) {
      result = (result as Record<string, unknown>)[part]
    } else {
      return key
    }
  }
  if (typeof result === 'string') {
    return values ? interpolate(result, values) : result
  }
  return key
}

export function setHtmlLang(locale: Locale): void {
  document.documentElement.lang = locale
}
