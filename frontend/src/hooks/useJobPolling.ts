import { useEffect, useRef, useState } from 'react'
import { api, ApiError } from '../api'
import type { Job } from '../types'

const POLL_INTERVAL_MS = 2000

interface JobPollingState {
  job: Job | null
  error: ApiError | null
  loading: boolean
}

/**
 * Fetches a job and, per the contract, polls GET /api/jobs/:id every 2s while
 * status is not completed/failed. Stops polling permanently on a 404 (job is
 * gone) but keeps retrying through transient/network errors so a backend that
 * comes back up is picked up automatically.
 */
export function useJobPolling(jobId: string | undefined): JobPollingState {
  const [job, setJob] = useState<Job | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [loading, setLoading] = useState(true)
  const jobRef = useRef<Job | null>(null)

  useEffect(() => {
    setJob(null)
    setError(null)
    setLoading(true)
    jobRef.current = null

    if (!jobId) {
      setLoading(false)
      return
    }

    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    async function poll() {
      try {
        const data = await api.getJob(jobId as string)
        if (cancelled) return
        jobRef.current = data
        setJob(data)
        setError(null)
        setLoading(false)
        if (data.status !== 'completed' && data.status !== 'failed') {
          timer = setTimeout(poll, POLL_INTERVAL_MS)
        }
      } catch (e) {
        if (cancelled) return
        const err = e instanceof ApiError ? e : new ApiError('Something went wrong.', 0)
        setError(err)
        setLoading(false)
        // A 404 means the job is gone for good; anything else (including a
        // dead backend) is worth retrying in case it recovers.
        if (err.status !== 404) {
          timer = setTimeout(poll, POLL_INTERVAL_MS)
        }
      }
    }

    poll()

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [jobId])

  return { job, error, loading }
}
