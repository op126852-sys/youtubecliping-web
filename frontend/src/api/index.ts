// Ships calling the real backend by default. Set VITE_USE_MOCK_API=true (see
// .env.mock / README) to swap in the in-memory mock for local UI development
// without a live backend. This flag must never be true in a production build.
import { realApiClient } from './client'
import { mockApiClient } from './mockClient'
import type { ApiClient } from './types'

export const usingMockApi = import.meta.env.VITE_USE_MOCK_API === 'true'

export const api: ApiClient = usingMockApi ? mockApiClient : realApiClient

export { ApiError } from './apiError'
export { BASE_URL } from './client'
export type { ApiClient } from './types'
