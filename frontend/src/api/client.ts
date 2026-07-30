import type { ApiErrorBody, ClipOptions, Job } from '../types'
import { ApiError } from './apiError'
import type { ApiClient } from './types'

// Base URL is configurable per API_CONTRACT.md; defaults to the backend's local dev port.
export const BASE_URL: string = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') || 'http://localhost:8787'

function resolveUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  return `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(resolveUrl(path), {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    })
  } catch {
    throw new ApiError('Could not reach the server. Is the backend running?', 0)
  }

  if (res.status === 204) {
    return undefined as T
  }

  const raw = await res.text()
  let parsed: unknown = null
  if (raw) {
    try {
      parsed = JSON.parse(raw)
    } catch {
      // Non-JSON response body; leave parsed as null and fall through to status handling below.
    }
  }

  if (!res.ok) {
    const body = parsed as ApiErrorBody | null
    throw new ApiError(body?.error || `Request failed with status ${res.status}`, res.status, body?.field)
  }

  return parsed as T
}

export const realApiClient: ApiClient = {
  health: () => request<{ status: string }>('/api/health'),

  createJob: (options: ClipOptions) =>
    request<{ jobId: string }>('/api/jobs', {
      method: 'POST',
      body: JSON.stringify(options),
    }),

  getJob: (id: string) => request<Job>(`/api/jobs/${encodeURIComponent(id)}`),

  cancelJob: (id: string) =>
    request<void>(`/api/jobs/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  resolveUrl,
}
