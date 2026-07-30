import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { BackendStatusBanner } from './components/BackendStatusBanner'
import { Header } from './components/Header'
import { useHealthCheck } from './hooks/useHealthCheck'
import Home from './pages/Home'
import JobPage from './pages/JobPage'
import type { LayoutContext } from './pages/layoutContext'
import NotFound from './pages/NotFound'

function Layout() {
  const health = useHealthCheck()
  const context: LayoutContext = { health }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <BackendStatusBanner status={health.status} onRetry={health.recheck} />
      <main className="flex-1">
        <Outlet context={context} />
      </main>
      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        YouTube Clip Studio — paste a link, get clips.
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/jobs/:id" element={<JobPage />} />
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
  )
}
