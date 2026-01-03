// Centralized configuration
// In production, the frontend is served by the Go backend, so use relative URLs
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  // Production builds use relative URLs since frontend is served by Go backend
  return import.meta.env.PROD ? '' : 'http://localhost:8080'
}

export const config = {
  apiUrl: getApiUrl(),
  env: import.meta.env.MODE,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const

export type Config = typeof config
