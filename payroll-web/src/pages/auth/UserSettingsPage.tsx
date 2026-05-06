import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, setDoc, updateDoc, getDoc } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { ArrowLeft, Save, Lock, Palette } from 'lucide-react'

export function UserSettingsPage() {
  const { user, userCompanies, settings, changePassword } = useAuth()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    theme: 'light' as 'light' | 'dark',
    itemsPerPage: 25,
    defaultCompanyId: '',
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  useEffect(() => {
    if (settings) {
      setFormData({
        theme: settings.theme || 'light',
        itemsPerPage: settings.itemsPerPage || 25,
        defaultCompanyId: settings.defaultCompanyId || '',
      })
    }
  }, [settings])

  const handleSaveSettings = async () => {
    if (!user) return
    setSaving(true)
    setSuccess(false)

    try {
      const settingsRef = doc(db, 'user_settings', user.id)
      const settingsSnap = await getDoc(settingsRef)

      const data = {
        userId: user.id,
        theme: formData.theme,
        itemsPerPage: formData.itemsPerPage,
        defaultCompanyId: formData.defaultCompanyId || undefined,
        updatedAt: new Date()
      }

      if (settingsSnap.exists()) {
        await updateDoc(settingsRef, data)
      } else {
        await setDoc(settingsRef, { ...data, createdAt: new Date() })
      }
      setSuccess(true)
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!user) return
    setPasswordError('')
    setPasswordSuccess(false)

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      return
    }

    setSaving(true)
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword)
      setPasswordSuccess(true)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to change password'
      if (message.includes('wrong-password') || message.includes('INVALID_LOGIN_CREDENTIALS')) {
        setPasswordError('Current password is incorrect')
      } else {
        setPasswordError(message)
      }
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Settings</h1>
          <p className="text-gray-500">{user.displayName} ({user.email})</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Palette className="w-5 h-5 text-gray-400" />
              <CardTitle>Preferences</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
                Settings saved successfully
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={formData.theme}
                onChange={(e) => setFormData({ ...formData, theme: e.target.value as 'light' | 'dark' })}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Items Per Page</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={formData.itemsPerPage}
                onChange={(e) => setFormData({ ...formData, itemsPerPage: Number(e.target.value) })}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {userCompanies.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Company</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={formData.defaultCompanyId}
                  onChange={(e) => setFormData({ ...formData, defaultCompanyId: e.target.value })}
                >
                  <option value="">None (use primary)</option>
                  {userCompanies.map(c => (
                    <option key={c.id} value={c.companyId}>Company {c.companyId}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={handleSaveSettings} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />{saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-gray-400" />
              <CardTitle>Change Password</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {passwordError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
                Password changed successfully
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleChangePassword} disabled={saving}>
                <Lock className="w-4 h-4 mr-2" />Change Password
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
