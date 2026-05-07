import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'
import { Replay } from '@sentry/replay'

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN

export const initSentry = () => {
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not configured. Error tracking disabled.')
    return
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    integrations: [
      new BrowserTracing({
        traceFetch: true,
        traceXHR: true,
        tracingOrigins: ['localhost', 'firebaseio.com', 'googleapis.com'],
      }),
      new Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION || 'unknown',
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event) {
      // Don't send events in development
      if (import.meta.env.DEV) {
        return null
      }
      return event
    },
    initialScope: {
      tags: {
        component: 'payroll-web',
      },
    },
  })
}

export const captureException = (error: Error, context?: Record<string, unknown>) => {
  Sentry.captureException(error, {
    extra: context,
  })
}

export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  Sentry.captureMessage(message, level)
}

export const setUserContext = (user: { id: string; email?: string; username?: string }) => {
  Sentry.setUser(user)
}

export const clearUserContext = () => {
  Sentry.setUser(null)
}

export default Sentry
