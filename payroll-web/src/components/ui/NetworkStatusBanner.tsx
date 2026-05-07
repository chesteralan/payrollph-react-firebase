import { useState } from 'react'
import { WifiOff, X } from 'lucide-react'
import { useNetworkStatus } from '../../hooks/useNetworkStatus'

export function NetworkStatusBanner() {
  const { isOffline } = useNetworkStatus()
  const [dismissed, setDismissed] = useState(false)

  if (!isOffline || dismissed) return null

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-yellow-50 border-b border-yellow-200 text-yellow-800" role="alert">
      <WifiOff className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
      <p className="text-sm font-medium flex-1">
        You are currently offline. Changes will be saved locally and synced when connection resumes.
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 p-1 rounded hover:bg-yellow-100 transition-colors"
        aria-label="Dismiss offline notice"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  )
}
