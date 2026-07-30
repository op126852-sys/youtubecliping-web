import type { ClipOptions, Job } from '../types'

/** Shared shape implemented by both the real client and the dev-only mock. */
export interface ApiClient {
  health(): Promise<{ status: string }>
  createJob(options: ClipOptions): Promise<{ jobId: string }>
  getJob(id: string): Promise<Job>
  cancelJob(id: string): Promise<void>
  /** Turns a contract-relative path (e.g. `/api/jobs/x/clips/y/download`) into a fetchable absolute URL. */
  resolveUrl(path: string): string
}
