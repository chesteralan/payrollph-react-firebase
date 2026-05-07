import { useState, useCallback, useRef } from 'react'

export interface UserActivity {
  id: string
  action: string
  entityType: string
  entityId?: string
  details?: Record<string, unknown>
  timestamp: Date
}

interface ActivityMonitor {
  activities: UserActivity[]
  logActivity: (activity: Omit<UserActivity, 'id' | 'timestamp'>) => void
  getRecentActivities: (limit?: number) => UserActivity[]
  getActivitiesByType: (entityType: string) => UserActivity[]
  getActivitiesByAction: (action: string) => UserActivity[]
  clearActivities: () => void
  activityCount: number
  lastActivity: UserActivity | null
}

export function useActivityMonitor(maxActivities = 100): ActivityMonitor {
  const [activities, setActivities] = useState<UserActivity[]>([])
  const idCounter = useRef(0)

  const logActivity = useCallback((activity: Omit<UserActivity, 'id' | 'timestamp'>) => {
    idCounter.current++
    const newActivity: UserActivity = {
      ...activity,
      id: `activity-${idCounter.current}-${Date.now()}`,
      timestamp: new Date(),
    }

    setActivities(prev => {
      const updated = [...prev, newActivity]
      if (updated.length > maxActivities) {
        return updated.slice(updated.length - maxActivities)
      }
      return updated
    })
  }, [maxActivities])

  const getRecentActivities = useCallback((limit = 10) => {
    return activities.slice(-limit).reverse()
  }, [activities])

  const getActivitiesByType = useCallback((entityType: string) => {
    return activities.filter(a => a.entityType === entityType)
  }, [activities])

  const getActivitiesByAction = useCallback((action: string) => {
    return activities.filter(a => a.action === action)
  }, [activities])

  const clearActivities = useCallback(() => {
    setActivities([])
  }, [])

  return {
    activities,
    logActivity,
    getRecentActivities,
    getActivitiesByType,
    getActivitiesByAction,
    clearActivities,
    activityCount: activities.length,
    lastActivity: activities.length > 0 ? activities[activities.length - 1] : null,
  }
}
