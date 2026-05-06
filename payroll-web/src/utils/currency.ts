const CURRENCIES: Record<string, { symbol: string; code: string; locale: string }> = {
  PHP: { symbol: '₱', code: 'PHP', locale: 'en-PH' },
  USD: { symbol: '$', code: 'USD', locale: 'en-US' },
  EUR: { symbol: '€', code: 'EUR', locale: 'de-DE' },
  GBP: { symbol: '£', code: 'GBP', locale: 'en-GB' },
  JPY: { symbol: '¥', code: 'JPY', locale: 'ja-JP' },
  CNY: { symbol: '¥', code: 'CNY', locale: 'zh-CN' },
  SGD: { symbol: 'S$', code: 'SGD', locale: 'en-SG' },
  AUD: { symbol: 'A$', code: 'AUD', locale: 'en-AU' },
  CAD: { symbol: 'C$', code: 'CAD', locale: 'en-CA' },
  INR: { symbol: '₹', code: 'INR', locale: 'en-IN' },
}

let defaultCurrency = 'PHP'

export function setDefaultCurrency(currency: string) {
  if (CURRENCIES[currency]) {
    defaultCurrency = currency
  }
}

export function getDefaultCurrency(): string {
  return defaultCurrency
}

export function getCurrencyInfo(code?: string) {
  return CURRENCIES[code || defaultCurrency] || CURRENCIES.PHP
}

export function formatCurrency(amount: number, currencyCode?: string): string {
  const info = getCurrencyInfo(currencyCode)
  return amount.toLocaleString(info.locale, {
    style: 'currency',
    currency: info.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

export function formatCurrencyShort(amount: number, currencyCode?: string): string {
  const info = getCurrencyInfo(currencyCode)
  return `${info.symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function getAvailableCurrencies() {
  return Object.entries(CURRENCIES).map(([code, info]) => ({
    code,
    symbol: info.symbol,
    label: `${info.code} (${info.symbol})`
  }))
}
