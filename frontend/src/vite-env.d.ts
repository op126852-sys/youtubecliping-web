/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the backend API. Defaults to http://localhost:8787 when unset. */
  readonly VITE_API_URL?: string
  /** Dev-only: 'true' swaps in an in-memory mock backend instead of calling the real API. */
  readonly VITE_USE_MOCK_API?: string
  /** Dev-only, only read by the mock backend: 'true' simulates GET /api/health failing. */
  readonly VITE_MOCK_HEALTH_DOWN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
