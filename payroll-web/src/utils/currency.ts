const CURRENCIES: Record<
  string,
  { symbol: string; code: string; locale: string }
> = {
  PHP: { symbol: "₱", code: "PHP", locale: "en-PH" },
  USD: { symbol: "$", code: "USD", locale: "en-US" },
  EUR: { symbol: "€", code: "EUR", locale: "de-DE" },
  GBP: { symbol: "£", code: "GBP", locale: "en-GB" },
  JPY: { symbol: "¥", code: "JPY", locale: "ja-JP" },
  CNY: { symbol: "¥", code: "CNY", locale: "zh-CN" },
  SGD: { symbol: "S$", code: "SGD", locale: "en-SG" },
  AUD: { symbol: "A$", code: "AUD", locale: "en-AU" },
  CAD: { symbol: "C$", code: "CAD", locale: "en-CA" },
  INR: { symbol: "₹", code: "INR", locale: "en-IN" },
};

let defaultCurrency = "PHP";

/**
 * Set the default currency code used by formatting functions.
 * Falls back silently if the currency code is not in the supported list.
 *
 * @param currency - A three-letter currency code (e.g. "PHP", "USD", "EUR")
 *
 * @example
 * ```ts
 * setDefaultCurrency("USD");
 * ```
 */
export function setDefaultCurrency(currency: string) {
  if (CURRENCIES[currency]) {
    defaultCurrency = currency;
  }
}

/**
 * Get the currently configured default currency code.
 *
 * @returns The three-letter currency code (default: "PHP")
 */
export function getDefaultCurrency(): string {
  return defaultCurrency;
}

/**
 * Get the configuration object (symbol, code, locale) for a given currency code.
 * Falls back to the default currency (or PHP) if the code is not supported.
 *
 * @param code - A three-letter currency code (optional, defaults to current default)
 * @returns An object with `symbol`, `code`, and `locale` properties
 */
export function getCurrencyInfo(code?: string) {
  return CURRENCIES[code || defaultCurrency] || CURRENCIES.PHP;
}

/**
 * Format a number as a localized currency string using Intl.NumberFormat.
 *
 * @param amount - The numeric amount to format
 * @param currencyCode - Optional three-letter currency code (defaults to current default)
 * @returns The formatted currency string (e.g. "₱1,234.56" or "$1,234.56")
 *
 * @example
 * ```ts
 * formatCurrency(1234.56, "PHP"); // "₱1,234.56"
 * formatCurrency(99.99, "USD");  // "$99.99"
 * ```
 */
export function formatCurrency(amount: number, currencyCode?: string): string {
  const info = getCurrencyInfo(currencyCode);
  return amount.toLocaleString(info.locale, {
    style: "currency",
    currency: info.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format a number as a short currency string using the currency symbol only (no locale formatting).
 * Uses en-US number formatting with the currency symbol prepended.
 *
 * @param amount - The numeric amount to format
 * @param currencyCode - Optional three-letter currency code (defaults to current default)
 * @returns The short formatted string (e.g. "₱1,234.56" or "$1,234.56")
 *
 * @example
 * ```ts
 * formatCurrencyShort(1234.56, "PHP"); // "₱1,234.56"
 * formatCurrencyShort(99.99, "USD");  // "$99.99"
 * ```
 */
export function formatCurrencyShort(
  amount: number,
  currencyCode?: string,
): string {
  const info = getCurrencyInfo(currencyCode);
  return `${info.symbol}${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Get a list of all supported currencies with their codes and symbols.
 * Useful for populating currency selector dropdowns.
 *
 * @returns An array of `{ code, symbol, label }` objects
 *
 * @example
 * ```ts
 * getAvailableCurrencies().map(c => ({ value: c.code, label: c.label }));
 * // [{ code: "PHP", symbol: "₱", label: "PHP (₱)" }, ...]
 * ```
 */
export function getAvailableCurrencies() {
  return Object.entries(CURRENCIES).map(([code, info]) => ({
    code,
    symbol: info.symbol,
    label: `${info.code} (${info.symbol})`,
  }));
}
