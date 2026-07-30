/**
 * status === 0 means "the request never reached the server" (network failure,
 * timeout, CORS, backend down) — the UI treats that as "backend unreachable"
 * rather than a validation/server error.
 */
export class ApiError extends Error {
  readonly status: number
  readonly field?: string

  constructor(message: string, status: number, field?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.field = field
  }
}
