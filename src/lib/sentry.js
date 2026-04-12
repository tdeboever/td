import * as Sentry from '@sentry/react'

const dsn = import.meta.env.VITE_SENTRY_DSN

export function initSentry() {
  if (!dsn) return

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
    replaysOnErrorSampleRate: 0.5,
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
    // Don't send errors in development
    enabled: import.meta.env.PROD,
    // Ignore common non-actionable errors
    ignoreErrors: [
      'ResizeObserver loop',
      'Loading chunk',
      'NetworkError',
      'Failed to fetch',
      'AbortError',
    ],
  })
}

export { Sentry }
