import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Breadcrumb } from './Breadcrumb'
import { AlertBannerProvider } from '../ui/AlertBanner'

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

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
