/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_POSTHOG_API_KEY: string
  readonly VITE_RESEND_API_KEY: string
  readonly VITE_RESEND_AUDIENCE_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
