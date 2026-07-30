import type { HealthStatus } from '../hooks/useHealthCheck'

export interface LayoutContext {
  health: { status: HealthStatus; recheck: () => void }
}
