import { useAuth } from './useAuth'
import type { Department, Section } from '../types'

export function usePermissions() {
  const { hasPermission } = useAuth()

  const can = (
    department: Department,
    section: Section,
    action: 'view' | 'add' | 'edit' | 'delete' = 'view'
  ) => {
    return hasPermission(department, section, action)
  }

  const canView = (department: Department, section: Section) => can(department, section, 'view')
  const canAdd = (department: Department, section: Section) => can(department, section, 'add')
  const canEdit = (department: Department, section: Section) => can(department, section, 'edit')
  const canDelete = (department: Department, section: Section) => can(department, section, 'delete')

  return { can, canView, canAdd, canEdit, canDelete }
}
