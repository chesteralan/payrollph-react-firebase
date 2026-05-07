import { useState, useEffect } from 'react'
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { usePermissions } from '../../hooks/usePermissions'
import { useToast } from '../../components/ui/Toast'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Settings, Calculator, Monitor, Bell } from 'lucide-react'
import type { Company } from '../../types'

interface CompanySettings {
  id?: string
  companyId: string
  general: {
    defaultCurrency: string
    fiscalYearStartMonth: number
    taxYear: string
  }
  payrollOptions: {
    autoApproveLeaves: boolean
    requireDtrBeforePayroll: boolean
    roundTimeEntries: 'none' | '15min' | '30min'
  }
  displayOptions: {
    itemsPerPage: number
    dateFormat: string
    timeFormat: '12h' | '24h'
    theme: 'light' | 'dark' | 'system'
  }
  notifications: {
    emailOnPayrollLock: boolean
    emailOnLeaveApproval: boolean
  }
}

const defaultSettings: Omit<CompanySettings, 'companyId'> = {
  general: {
    defaultCurrency: 'PHP',
    fiscalYearStartMonth: 1,
    taxYear: new Date().getFullYear().toString()
  },
  payrollOptions: {
    autoApproveLeaves: false,
    requireDtrBeforePayroll: true,
    roundTimeEntries: 'none'
  },
  displayOptions: {
    itemsPerPage: 20,
    dateFormat: 'MM/dd/yyyy',
    timeFormat: '12h',
    theme: 'system'
  },
  notifications: {
    emailOnPayrollLock: true,
    emailOnLeaveApproval: true
  }
}

export function CompanySettingsPage() {
  const { canView, canEdit } = usePermissions()
  const { addToast } = useToast()
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'general' | 'payroll' | 'display' | 'notifications'>('general')
  const [settings, setSettings] = useState<CompanySettings>({ companyId: '', ...defaultSettings })

  useEffect(() => { fetchCompanies() }, [])

  useEffect(() => {
    if (selectedCompanyId) {
      fetchSettings(selectedCompanyId)
    }
  }, [selectedCompanyId])

  const fetchCompanies = async () => {
    setLoading(true)
    const snap = await getDocs(collection(db, 'companies'))
    const list = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((c: any) => c.isActive && !c.isDeleted) as Company[]
    setCompanies(list)
    if (list.length > 0 && !selectedCompanyId) {
      setSelectedCompanyId(list[0].id)
    }
    setLoading(false)
  }

  const fetchSettings = async (companyId: string) => {
    const ref = doc(db, 'company_settings', companyId)
    const snap = await getDoc(ref)
    if (snap.exists()) {
      setSettings({ id: snap.id, ...snap.data() } as CompanySettings)
    } else {
      setSettings({ companyId, ...defaultSettings })
    }
  }

  const handleSave = async () => {
    if (!selectedCompanyId) return
    setSaving(true)
    try {
      const ref = doc(db, 'company_settings', selectedCompanyId)
      await setDoc(ref, { ...settings, companyId: selectedCompanyId }, { merge: true })
      addToast({ type: 'success', title: 'Settings saved', message: 'Company settings have been updated' })
    } catch (error) {
      addToast({ type: 'error', title: 'Save failed', message: 'Could not save settings' })
    }
    setSaving(false)
  }

  const updateSettings = (section: keyof CompanySettings, field: string, value: any) => {
    setSettings({
      ...settings,
      [section]: {
        ...(settings[section] as any),
        [field]: value
      }
    })
  }

  if (!canView('system', 'companies')) return <div className="text-center py-12 text-gray-500">Access denied</div>

  const tabs = [
    { key: 'general' as const, label: 'General', icon: <Settings className="w-4 h-4" /> },
    { key: 'payroll' as const, label: 'Payroll Options', icon: <Calculator className="w-4 h-4" /> },
    { key: 'display' as const, label: 'Display Options', icon: <Monitor className="w-4 h-4" /> },
    { key: 'notifications' as const, label: 'Notifications', icon: <Bell className="w-4 h-4" /> }
  ]

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Company Settings</h1>
      </div>

      <Card>
        <CardContent className="pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Company</label>
          <select
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Select a company...</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </CardContent>
      </Card>

      {selectedCompanyId && (
        <Card>
          <CardHeader>
            <div className="flex gap-2 border-b">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {activeTab === 'general' && (
              <div className="space-y-4 max-w-2xl">
                <h3 className="text-lg font-medium text-gray-900">General Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Default Currency</label>
                    <select
                      value={settings.general.defaultCurrency}
                      onChange={(e) => updateSettings('general', 'defaultCurrency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="PHP">PHP - Philippine Peso</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fiscal Year Start Month</label>
                    <select
                      value={settings.general.fiscalYearStartMonth}
                      onChange={(e) => updateSettings('general', 'fiscalYearStartMonth', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i} value={i + 1}>
                          {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Input
                    id="taxYear"
                    label="Tax Year"
                    value={settings.general.taxYear}
                    onChange={(e) => updateSettings('general', 'taxYear', e.target.value)}
                  />
                </div>
              </div>
            )}

            {activeTab === 'payroll' && (
              <div className="space-y-4 max-w-2xl">
                <h3 className="text-lg font-medium text-gray-900">Payroll Options</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.payrollOptions.autoApproveLeaves}
                      onChange={(e) => updateSettings('payrollOptions', 'autoApproveLeaves', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Auto-approve leaves</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.payrollOptions.requireDtrBeforePayroll}
                      onChange={(e) => updateSettings('payrollOptions', 'requireDtrBeforePayroll', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Require DTR before payroll processing</span>
                  </label>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Round Time Entries</label>
                    <select
                      value={settings.payrollOptions.roundTimeEntries}
                      onChange={(e) => updateSettings('payrollOptions', 'roundTimeEntries', e.target.value)}
                      className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="none">No rounding</option>
                      <option value="15min">Nearest 15 minutes</option>
                      <option value="30min">Nearest 30 minutes</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'display' && (
              <div className="space-y-4 max-w-2xl">
                <h3 className="text-lg font-medium text-gray-900">Display Options</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Items Per Page</label>
                    <select
                      value={settings.displayOptions.itemsPerPage}
                      onChange={(e) => updateSettings('displayOptions', 'itemsPerPage', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
                    <select
                      value={settings.displayOptions.dateFormat}
                      onChange={(e) => updateSettings('displayOptions', 'dateFormat', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="MM/dd/yyyy">MM/dd/yyyy</option>
                      <option value="dd/MM/yyyy">dd/MM/yyyy</option>
                      <option value="yyyy-MM-dd">yyyy-MM-dd</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time Format</label>
                    <select
                      value={settings.displayOptions.timeFormat}
                      onChange={(e) => updateSettings('displayOptions', 'timeFormat', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="12h">12-hour (AM/PM)</option>
                      <option value="24h">24-hour</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
                    <select
                      value={settings.displayOptions.theme}
                      onChange={(e) => updateSettings('displayOptions', 'theme', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-4 max-w-2xl">
                <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications.emailOnPayrollLock}
                      onChange={(e) => updateSettings('notifications', 'emailOnPayrollLock', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Send email notification when payroll is locked</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications.emailOnLeaveApproval}
                      onChange={(e) => updateSettings('notifications', 'emailOnLeaveApproval', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Send email notification on leave approval</span>
                  </label>
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-6 pt-4 border-t">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
