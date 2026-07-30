import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api'

export type HealthStatus = 'checking' | 'ok' | 'down'

/**
 * Periodically pings GET /api/health so the app can show a "backend
 * unreachable" banner instead of silently hanging on a dead backend.
 */
export function useHealthCheck(intervalMs = 15000) {
  const [status, setStatus] = useState<HealthStatus>('checking')
  const inFlight = useRef(false)

  const check = useCallback(async () => {
    if (inFlight.current) return
    inFlight.current = true
    try {
      await api.health()
      setStatus('ok')
    } catch {
      setStatus('down')
    } finally {
      inFlight.current = false
    }
  }, [])

  useEffect(() => {
    check()
    const id = setInterval(check, intervalMs)
    return () => clearInterval(id)
  }, [check, intervalMs])

  return { status, recheck: check }
}
