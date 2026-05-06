import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, CheckCircle2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { setupAdminUser, checkSetupNeeded } from '../../services/setup'

export function SetupPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'check' | 'form' | 'success'>('check')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    companyName: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkSetupNeeded()
      .then((needed: boolean) => {
        if (needed) {
          setStep('form')
        } else {
          navigate('/login')
        }
      })
      .catch(() => {
        setStep('form')
      })
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      await setupAdminUser({
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName,
        companyName: formData.companyName,
      })
      setStep('success')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Setup failed'
      if (message.includes('email-already-in-use')) {
        setError('Email is already registered')
      } else if (message.includes('weak-password')) {
        setError('Password is too weak')
      } else if (message.includes('invalid-email')) {
        setError('Invalid email address')
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }

  if (step === 'check') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-500">Checking setup status...</p>
        </div>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Setup Complete</h1>
          <p className="text-gray-500 mb-6">Admin user created successfully. You can now log in.</p>
          <Button onClick={() => navigate('/login')}>Go to Login</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 rounded-lg mb-4">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Initial Setup</h1>
          <p className="text-gray-500 mt-1">Create admin user and first company</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
              {error}
            </div>
          )}

          <Input
            id="email"
            type="email"
            label="Admin Email"
            value={formData.email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
            placeholder="admin@company.com"
            required
          />

          <Input
            id="displayName"
            type="text"
            label="Display Name"
            value={formData.displayName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, displayName: e.target.value })}
            placeholder="Admin User"
            required
          />

          <Input
            id="password"
            type="password"
            label="Password"
            value={formData.password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Minimum 6 characters"
            required
          />

          <Input
            id="confirmPassword"
            type="password"
            label="Confirm Password"
            value={formData.confirmPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, confirmPassword: e.target.value })}
            placeholder="Re-enter password"
            required
          />

          <div className="pt-4 border-t border-gray-200">
            <Input
              id="companyName"
              type="text"
              label="Company Name"
              value={formData.companyName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="Your Company Inc."
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Setting up...' : 'Complete Setup'}
          </Button>
        </form>
      </div>
    </div>
  )
}
