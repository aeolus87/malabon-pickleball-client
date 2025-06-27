/// <reference types="vite/client" />

// Environment variables
interface ImportMetaEnv {
  readonly VITE_APP_ENV: string
  readonly VITE_API_URL: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_GOOGLE_CLIENT_ID: string
  readonly VITE_DEBUG: string
  readonly VITE_ENABLE_LOGS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Global constants defined by Vite
declare const __DEV__: boolean;
declare const __PROD__: boolean;
