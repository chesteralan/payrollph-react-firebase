import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { usePermissions } from '../../hooks/usePermissions'
import { useToast } from '../../components/ui/Toast'
import { Settings, Shield, Wrench, Palette } from 'lucide-react'

const TABS = [
  { key: 'general', label: 'General', icon: <Settings className="w-4 h-4" /> },
  { key: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
  { key: 'maintenance', label: 'Maintenance', icon: <Wrench className="w-4 h-4" /> },
  { key: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" /> },
]

interface SystemSettings {
  systemName: string
  timezone: string
  maintenanceMode: boolean
  maintenanceMessage: string
  sessionTimeout: number
  maxLoginAttempts: number
  passwordMinLength: number
  passwordRequireSpecialChars: boolean
  dataRetentionMonths: number
  autoCleanup: boolean
  defaultTheme: 'light' | 'dark' | 'system'
  logoUrl: string
}

const DEFAULT_SETTINGS: SystemSettings = {
  systemName: 'SMB Payroll',
  timezone: 'Asia/Manila',
  maintenanceMode: false,
  maintenanceMessage: 'System is under maintenance. Please try again later.',
  sessionTimeout: 60,
  maxLoginAttempts: 5,
  passwordMinLength: 8,
  passwordRequireSpecialChars: true,
  dataRetentionMonths: 12,
  autoCleanup: false,
  defaultTheme: 'system',
  logoUrl: '',
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label?: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
          checked ? 'bg-primary-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </label>
  )
}

export function SystemSettingsPage() {
  const { canView, canEdit } = usePermissions()
  const { addToast } = useToast()
  const [activeTab, setActiveTab] = useState('general')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    let cancelled = false
    const docRef = doc(db, 'system_settings', 'default')
    getDoc(docRef)
      .then(snap => {
        if (!cancelled && snap.exists()) {
          setSettings({ ...DEFAULT_SETTINGS, ...snap.data() } as SystemSettings)
        }
      })
      .catch(() => {
        if (!cancelled) addToast({ type: 'error', title: 'Failed to load settings' })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [addToast])

  const handleSave = async () => {
    setSaving(true)
    try {
      const docRef = doc(db, 'system_settings', 'default')
      await setDoc(docRef, settings, { merge: true })
      addToast({ type: 'success', title: 'Settings saved successfully' })
    } catch {
      addToast({ type: 'error', title: 'Failed to save settings' })
    }
    setSaving(false)
  }

  const updateSetting = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  if (!canView('system', 'companies')) return <div className="text-center py-12 text-gray-500">Access denied</div>

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading settings...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        {canEdit('system', 'companies') && (
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-0 px-6" aria-label="Tabs">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'general' && (
              <div className="space-y-4">
                <Input
                  id="systemName"
                  label="System Name"
                  value={settings.systemName}
                  onChange={(e) => updateSetting('systemName', e.target.value)}
                  disabled={!canEdit('system', 'companies')}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Timezone</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={settings.timezone}
                    onChange={(e) => updateSetting('timezone', e.target.value)}
                    disabled={!canEdit('system', 'companies')}
                  >
                    <option value="Asia/Manila">Asia/Manila (UTC+8)</option>
                    <option value="America/New_York">America/New_York (UTC-5)</option>
                    <option value="Europe/London">Europe/London (UTC+0)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
                  </select>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Maintenance Mode</p>
                    <p className="text-xs text-gray-500">Enable to put the system in maintenance mode</p>
                  </div>
                  <Toggle
                    checked={settings.maintenanceMode}
                    onChange={(val) => updateSetting('maintenanceMode', val)}
                    disabled={!canEdit('system', 'companies')}
                  />
                </div>
                {settings.maintenanceMode && (
                  <Input
                    id="maintenanceMessage"
                    label="Maintenance Message"
                    value={settings.maintenanceMessage}
                    onChange={(e) => updateSetting('maintenanceMessage', e.target.value)}
                    disabled={!canEdit('system', 'companies')}
                  />
                )}
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-4">
                <Input
                  id="sessionTimeout"
                  label="Session Timeout (minutes)"
                  type="number"
                  value={String(settings.sessionTimeout)}
                  onChange={(e) => updateSetting('sessionTimeout', Number(e.target.value))}
                  disabled={!canEdit('system', 'companies')}
                />
                <Input
                  id="maxLoginAttempts"
                  label="Max Login Attempts"
                  type="number"
                  value={String(settings.maxLoginAttempts)}
                  onChange={(e) => updateSetting('maxLoginAttempts', Number(e.target.value))}
                  disabled={!canEdit('system', 'companies')}
                />
                <Input
                  id="passwordMinLength"
                  label="Password Minimum Length"
                  type="number"
                  value={String(settings.passwordMinLength)}
                  onChange={(e) => updateSetting('passwordMinLength', Number(e.target.value))}
                  disabled={!canEdit('system', 'companies')}
                />
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Require Special Characters in Password</p>
                    <p className="text-xs text-gray-500">Passwords must contain at least one special character</p>
                  </div>
                  <Toggle
                    checked={settings.passwordRequireSpecialChars}
                    onChange={(val) => updateSetting('passwordRequireSpecialChars', val)}
                    disabled={!canEdit('system', 'companies')}
                  />
                </div>
              </div>
            )}

            {activeTab === 'maintenance' && (
              <div className="space-y-4">
                <Input
                  id="dataRetentionMonths"
                  label="Data Retention Period (months)"
                  type="number"
                  value={String(settings.dataRetentionMonths)}
                  onChange={(e) => updateSetting('dataRetentionMonths', Number(e.target.value))}
                  disabled={!canEdit('system', 'companies')}
                />
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Auto-Cleanup Old Data</p>
                    <p className="text-xs text-gray-500">Automatically remove data older than retention period</p>
                  </div>
                  <Toggle
                    checked={settings.autoCleanup}
                    onChange={(val) => updateSetting('autoCleanup', val)}
                    disabled={!canEdit('system', 'companies')}
                  />
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Theme</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={settings.defaultTheme}
                    onChange={(e) => updateSetting('defaultTheme', e.target.value as 'light' | 'dark' | 'system')}
                    disabled={!canEdit('system', 'companies')}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                </div>
                <Input
                  id="logoUrl"
                  label="Logo URL"
                  value={settings.logoUrl}
                  onChange={(e) => updateSetting('logoUrl', e.target.value)}
                  placeholder="https://example.com/logo.png"
                  disabled={!canEdit('system', 'companies')}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
