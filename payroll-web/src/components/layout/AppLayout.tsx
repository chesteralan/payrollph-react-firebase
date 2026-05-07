import { useState, useEffect, useRef } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Breadcrumb } from './Breadcrumb'
import { AlertBannerProvider } from '../ui/AlertBanner'
import { useGlobalShortcuts } from '../../hooks/useKeyboardShortcuts'
import { NetworkStatusBanner } from '../ui/NetworkStatusBanner'
import { useToast } from '../ui/Toast'
import { syncQueuedActions, getQueuedActionCount } from '../../services/offline'

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const { addToast } = useToast()
  const wasOfflineRef = useRef(!navigator.onLine)
  const syncingRef = useRef(false)

  useGlobalShortcuts((path) => navigate(path))

  useEffect(() => {
    if (syncingRef.current) return
    syncingRef.current = true

    const handleOnline = () => {
      wasOfflineRef.current = false
      syncQueuedActions().then(({ success, failed }) => {
        if (success > 0 || failed > 0) {
          addToast({
            type: failed > 0 ? 'warning' : 'success',
            title: 'Sync Complete',
            message: `${success} change${success !== 1 ? 's' : ''} synced${failed > 0 ? `, ${failed} failed` : ''}`,
            duration: 5000,
          })
        } else {
          addToast({
            type: 'success',
            title: 'Back Online',
            duration: 3000,
          })
        }
      })
    }

    const handleOffline = () => {
      wasOfflineRef.current = true
      addToast({
        type: 'warning',
        title: 'You are offline',
        message: 'Changes will be saved locally and synced when connection resumes.',
        duration: 5000,
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    if (navigator.onLine) {
      getQueuedActionCount().then((count) => {
        if (count > 0) {
          syncQueuedActions().then(({ success, failed }) => {
            if (success > 0) {
              addToast({
                type: failed > 0 ? 'warning' : 'success',
                title: 'Pending Sync Complete',
                message: `${success} pending change${success !== 1 ? 's' : ''} synced${failed > 0 ? `, ${failed} failed` : ''}`,
                duration: 5000,
              })
            }
          })
        }
      })
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [addToast])

  const handleClose = () => setMobileOpen(false)

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={mobileOpen} onClose={handleClose} />
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={handleClose}
        />
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setMobileOpen(true)} />
        <NetworkStatusBanner />
        <main className="flex-1 overflow-y-auto p-6">
          <Breadcrumb />
          <AlertBannerProvider>
            <Outlet />
          </AlertBannerProvider>
        </main>
      </div>
    </div>
  )
}
