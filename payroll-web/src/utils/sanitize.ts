// Input sanitization utilities for preventing XSS and injection attacks

/**
 * Sanitize a string by escaping HTML special characters.
 * Converts &, <, >, ", ', and / to their HTML entity equivalents.
 *
 * @param input - The raw string to sanitize
 * @returns The HTML-escaped string, or empty string if input is not a string
 *
 * @example
 * ```ts
 * sanitizeString('<script>alert("xss")</script>');
 * // "&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;"
 * ```
 */
export const sanitizeString = (input: string): string => {
  if (typeof input !== "string") return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .trim();
};

/**
 * Sanitize and validate an email address.
 * Trims whitespace, lowercases, and validates against a basic email regex.
 *
 * @param email - The raw email string
 * @returns The sanitized lowercase email if valid, or empty string if invalid
 */
export const sanitizeEmail = (email: string): string => {
  if (typeof email !== "string") return "";
  const sanitized = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(sanitized) ? sanitized : "";
};

/**
 * Sanitize a phone number by removing all non-digit symbols except +, -, (, ), and spaces.
 *
 * @param phone - The raw phone number string
 * @returns The sanitized phone string with only allowed characters
 */
export const sanitizePhone = (phone: string): string => {
  if (typeof phone !== "string") return "";
  return phone.replace(/[^0-9+\-()\s]/g, "").trim();
};

/**
 * Sanitize a name string by keeping only letters, spaces, hyphens, and apostrophes.
 *
 * @param name - The raw name string
 * @returns The sanitized name with only allowed characters
 */
export const sanitizeName = (name: string): string => {
  if (typeof name !== "string") return "";
  return name.replace(/[^a-zA-Z\s\-']/g, "").trim();
};

/**
 * Sanitize a numeric input by allowing only digits and a decimal point.
 * Optionally allows a leading minus sign for negative numbers.
 *
 * @param value - The raw numeric string
 * @param allowNegative - If true, a leading minus sign is permitted (default: false)
 * @returns The sanitized string containing only valid numeric characters
 */
export const sanitizeNumber = (
  value: string,
  allowNegative: boolean = false,
): string => {
  if (typeof value !== "string") return "";
  const pattern = allowNegative ? /[^0-9.-]/g : /[^0-9.]/g;
  return value.replace(pattern, "");
};

/**
 * Sanitize a currency input by allowing only digits and a single decimal point.
 * Removes all other characters and ensures only one decimal separator remains.
 *
 * @param value - The raw currency string
 * @returns The sanitized currency string with only digits and one decimal point
 */
export const sanitizeCurrency = (value: string): string => {
  if (typeof value !== "string") return "";
  const sanitized = value.replace(/[^0-9.]/g, "");
  const parts = sanitized.split(".");
  if (parts.length > 2) {
    return parts[0] + "." + parts.slice(1).join("");
  }
  return sanitized;
};

/**
 * Sanitize a filename by removing path traversal sequences ("..") and
 * replacing special characters with underscores. Truncated to 255 characters.
 *
 * @param filename - The raw filename string
 * @returns A safe filename string with no path separators or special chars
 */
export const sanitizeFilename = (filename: string): string => {
  if (typeof filename !== "string") return "";
  return filename
    .replace(/\.\./g, "")
    .replace(/[/\\:*?"<>|]/g, "_")
    .trim()
    .substring(0, 255);
};

/**
 * Strip HTML tags from a string. Basic sanitization — for rich text use DOMPurify.
 *
 * @param html - The HTML string to strip
 * @returns The plain text content with all HTML tags removed
 */
export const stripHtml = (html: string): string => {
  if (typeof html !== "string") return "";
  return html.replace(/<[^>]*>/g, "");
};

/**
 * Validate and sanitize a date string by attempting to parse it into a valid ISO date.
 *
 * @param dateStr - The raw date string
 * @returns The ISO 8601 date string if valid, or `null` if invalid
 */
export const sanitizeDate = (dateStr: string): string | null => {
  if (typeof dateStr !== "string") return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  return date.toISOString();
};

/**
 * Sanitize an object recursively by applying a set of sanitizer functions to specific keys.
 * Creates a shallow copy of the object with only the specified keys sanitized.
 *
 * @typeParam T - The object type extending Record<string, unknown>
 * @param obj - The object to sanitize
 * @param sanitizers - A partial map of field -> sanitizer function
 * @returns A shallow copy of the object with the specified fields sanitized
 */
export const sanitizeObject = <T extends Record<string, unknown>>(
  obj: T,
  sanitizers: Partial<Record<keyof T, (value: unknown) => unknown>>,
): T => {
  const sanitized = { ...obj };
  for (const key in sanitizers) {
    const sanitizer = sanitizers[key as keyof typeof sanitizers];
    if (key in sanitized && sanitizer) {
      sanitized[key as keyof T] = sanitizer(sanitized[key as keyof T]) as T[keyof T];
    }
  }
  return sanitized;
};

/**
 * Check if a string contains potential SQL injection patterns.
 * Looks for SQL keywords (SELECT, INSERT, DROP, etc.), comment sequences,
 * and common tautologies (OR 1=1, AND 1=1).
 *
 * @param input - The string to check
 * @returns `true` if SQL injection patterns are detected, `false` otherwise
 */
export const containsSqlInjection = (input: string): boolean => {
  if (typeof input !== "string") return false;
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC)\b)/i,
    /(--|\/\*|\*\/|;)/,
    /(\bOR\b\s*\d+\s*=\s*\d+)/i,
    /(\bAND\b\s*\d+\s*=\s*\d+)/i,
  ];
  return sqlPatterns.some((pattern) => pattern.test(input));
};

/**
 * Check if a string contains potential XSS (Cross-Site Scripting) patterns.
 * Looks for script tags, inline event handlers (on\w+=), javascript: URIs, and iframes.
 *
 * @param input - The string to check
 * @returns `true` if XSS patterns are detected, `false` otherwise
 */
export const containsXss = (input: string): boolean => {
  if (typeof input !== "string") return false;
  const xssPatterns = [
    /<script\b[^>]*>(.*?)<\/script>/gi,
    /on\w+\s*=/gi,
    /javascript\s*:/gi,
    /<iframe\b[^>]*>(.*?)<\/iframe>/gi,
  ];
  return xssPatterns.some((pattern) => pattern.test(input));
};

/**
 * Comprehensive input validation with sanitization, length checks, pattern matching,
 * and SQL injection / XSS detection.
 *
 * @param input - The raw string to validate
 * @param options - Validation options:
 *  - `maxLength`: Maximum allowed characters (truncates if exceeded)
 *  - `minLength`: Minimum required characters
 *  - `pattern`: Regex pattern the input must match
 *  - `allowHtml`: If true, skips HTML escaping (default: false)
 * @returns An object with:
 *  - `isValid`: Whether all validation passed
 *  - `sanitized`: The sanitized string (HTML-escaped unless allowHtml is true)
 *  - `errors`: Array of error messages (empty if valid)
 */
export const validateInput = (
  input: string,
  options: {
    maxLength?: number;
    minLength?: number;
    pattern?: RegExp;
    allowHtml?: boolean;
  } = {},
): { isValid: boolean; sanitized: string; errors: string[] } => {
  const errors: string[] = [];
  let sanitized = options.allowHtml ? input : sanitizeString(input);

  if (options.maxLength && sanitized.length > options.maxLength) {
    errors.push(`Input exceeds maximum length of ${options.maxLength}`);
    sanitized = sanitized.substring(0, options.maxLength);
  }

  if (options.minLength && sanitized.length < options.minLength) {
    errors.push(`Input must be at least ${options.minLength} characters`);
  }

  if (options.pattern && !options.pattern.test(sanitized)) {
    errors.push("Input does not match required pattern");
  }

  if (containsSqlInjection(sanitized)) {
    errors.push("Input contains invalid characters");
  }

  if (!options.allowHtml && containsXss(sanitized)) {
    errors.push("Input contains invalid characters");
  }

  return {
    isValid: errors.length === 0,
    sanitized,
    errors,
  };
};
