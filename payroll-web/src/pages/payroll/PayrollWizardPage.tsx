import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { collection, doc, getDoc, getDocs, query, where, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useAuth } from '../../hooks/useAuth'
import { Stepper } from '../../components/ui/Stepper'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { ArrowLeft, ArrowRight, Check, Trash2 } from 'lucide-react'
import type { PayrollGroup } from '../../types'

const STEPS = ['Config', 'Inclusive Dates', 'Groups', 'Employees', 'Review & Generate']

export function PayrollWizardPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentCompanyId } = useAuth()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ name: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), templateId: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [inclusiveDates, setInclusiveDates] = useState<Date[]>([])
  const [groups, setGroups] = useState<PayrollGroup[]>([])
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([])
  const [templates, setTemplates] = useState<{ id: string; name: string }[]>([])
  const [employees, setEmployees] = useState<{ id: string; nameId: string; employeeCode: string }[]>([])
  const [dateStr, setDateStr] = useState('')

  useEffect(() => {
    if (currentCompanyId) {
      fetchTemplates()
      fetchEmployees()
      if (id) fetchPayroll()
    }
  }, [id, currentCompanyId])

  const fetchTemplates = async () => {
    if (!currentCompanyId) return
    const snap = await getDocs(query(collection(db, 'payroll_templates'), where('companyId', '==', currentCompanyId)))
    setTemplates(snap.docs.map((d) => ({ id: d.id, name: (d.data() as { name: string }).name })))
  }

  const fetchEmployees = async () => {
    if (!currentCompanyId) return
    const snap = await getDocs(query(collection(db, 'employees'), where('companyId', '==', currentCompanyId)))
    setEmployees(snap.docs.map((d) => ({ id: d.id, ...(d.data() as { nameId: string; employeeCode: string }) })))
  }

  const fetchPayroll = async () => {
    if (!id) return
    const snap = await getDoc(doc(db, 'payroll', id))
    if (snap.exists()) {
      const data = snap.data() as { name: string; month: number; year: number; templateId?: string }
      setFormData({ name: data.name, month: data.month, year: data.year, templateId: data.templateId || '' })

      const [datesSnap, groupsSnap] = await Promise.all([
        getDocs(query(collection(db, 'payroll_inclusive_dates'), where('payrollId', '==', id))),
        getDocs(query(collection(db, 'payroll_groups'), where('payrollId', '==', id))),
      ])
      setInclusiveDates(datesSnap.docs.map((d) => (d.data() as { date: { toDate: () => Date } }).date.toDate()))
      setGroups(groupsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PayrollGroup, 'id'>) })))
    }
  }

  const createPayroll = async (): Promise<string> => {
    if (!currentCompanyId) throw new Error('No company selected')
    const docRef = await addDoc(collection(db, 'payroll'), {
      name: formData.name,
      month: formData.month,
      year: formData.year,
      templateId: formData.templateId || null,
      companyId: currentCompanyId,
      status: 'draft',
      isActive: true,
      isLocked: false,
      createdBy: currentCompanyId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return docRef.id
  }

  const handleNext = async () => {
    if (step === 0) {
      const newErrors: Record<string, string> = {}
      if (!formData.name.trim()) newErrors.name = 'Payroll name is required'
      if (formData.year < 2000 || formData.year > 2100) newErrors.year = 'Year must be between 2000 and 2100'
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        return
      }
      setErrors({})
      setLoading(true)
      try {
        let payrollId = id
        if (!payrollId) {
          payrollId = await createPayroll()
        } else {
          await updateDoc(doc(db, 'payroll', payrollId), { name: formData.name, month: formData.month, year: formData.year, templateId: formData.templateId || null })
        }
        navigate(`/payroll/${payrollId}/wizard`, { replace: true })
        setStep(1)
      } finally {
        setLoading(false)
      }
    } else if (step === 1) {
      if (inclusiveDates.length === 0) {
        setErrors({ dates: 'Add at least one inclusive date' })
        return
      }
      setErrors({})
      setLoading(true)
      try {
        const payrollId = id || (await createPayroll())
        const existing = await getDocs(query(collection(db, 'payroll_inclusive_dates'), where('payrollId', '==', payrollId)))
        for (const d of existing.docs) await deleteDoc(doc(db, 'payroll_inclusive_dates', d.id))
        for (const date of inclusiveDates) {
          await addDoc(collection(db, 'payroll_inclusive_dates'), { payrollId, date })
        }
        setStep(2)
      } finally {
        setLoading(false)
      }
    } else if (step === 2) {
      setLoading(true)
      try {
        const payrollId = id!
        const existing = await getDocs(query(collection(db, 'payroll_groups'), where('payrollId', '==', payrollId)))
        for (const d of existing.docs) await deleteDoc(doc(db, 'payroll_groups', d.id))
        for (let i = 0; i < groups.length; i++) {
          const { id: _id, ...groupData } = groups[i]
          await addDoc(collection(db, 'payroll_groups'), { ...groupData, payrollId, order: i, page: 1 })
        }
        setStep(3)
      } finally {
        setLoading(false)
      }
    } else {
      setStep(step + 1)
    }
  }

  const handleBack = () => setStep(Math.max(0, step - 1))

  const addDate = () => {
    if (dateStr) {
      setInclusiveDates([...inclusiveDates, new Date(dateStr)])
      setDateStr('')
    }
  }

  const removeDate = (index: number) => setInclusiveDates(inclusiveDates.filter((_, i) => i !== index))

  const addGroup = (group: PayrollGroup) => setGroups([...groups, group])

  const removeGroup = (index: number) => setGroups(groups.filter((_, i) => i !== index))

  const toggleEmployee = (empId: string) => {
    setSelectedEmployeeIds((prev) => prev.includes(empId) ? prev.filter((eid) => eid !== empId) : [...prev, empId])
  }

  const steps = STEPS.map((label, i) => ({ label, completed: i < step, active: i === step }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll Setup Wizard</h1>
          <p className="text-gray-500 mt-1">{formData.name || 'New Payroll Run'}</p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/payroll')}>Cancel</Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Stepper steps={steps} />
        </CardContent>
      </Card>

      {step === 0 && (
        <Card>
          <CardHeader><CardTitle>Payroll Configuration</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input id="name" label="Payroll Name" value={formData.name} onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setErrors(prev => ({ ...prev, name: '' })) }} placeholder="e.g., January 2026 Payroll" />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <select value={formData.month} onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })} className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                  ))}
                </select>
              </div>
              <div>
                <Input id="year" label="Year" type="number" value={formData.year} onChange={(e) => { setFormData({ ...formData, year: parseInt(e.target.value) }); setErrors(prev => ({ ...prev, year: '' })) }} />
                {errors.year && <p className="mt-1 text-sm text-red-600">{errors.year}</p>}
              </div>
            </div>
            {templates.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template (Optional)</label>
                <select value={formData.templateId} onChange={(e) => setFormData({ ...formData, templateId: e.target.value })} className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                  <option value="">No template</option>
                  {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button onClick={handleNext} disabled={!formData.name || loading}>{loading ? 'Saving...' : 'Next'}</Button>
          </CardFooter>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardHeader><CardTitle>Inclusive Dates</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {errors.dates && <p className="text-sm text-red-600">{errors.dates}</p>}
            <div className="flex gap-2">
              <Input id="date" type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)} />
              <Button onClick={addDate} disabled={!dateStr}>Add Date</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {inclusiveDates.map((date, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm">
                  <span>{date.toLocaleDateString()}</span>
                  <button onClick={() => removeDate(i)} className="text-primary-400 hover:text-primary-600"><Trash2 className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="ghost" onClick={handleBack}>Back</Button>
            <Button onClick={handleNext} disabled={inclusiveDates.length === 0 || loading}>Next</Button>
          </CardFooter>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader><CardTitle>Employee Groups</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <GroupForm onAdd={addGroup} />
            <div className="space-y-2">
              {groups.map((g, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <span className="text-sm">Group: {g.groupId || 'All'} | Position: {g.positionId || 'All'} | Area: {g.areaId || 'All'} | Status: {g.statusId || 'All'}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeGroup(i)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
              {groups.length === 0 && <p className="text-sm text-gray-500">No groups added. Add filters or leave empty to include all employees.</p>}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="ghost" onClick={handleBack}>Back</Button>
            <Button onClick={handleNext} disabled={loading}>Next</Button>
          </CardFooter>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader><CardTitle>Select Employees</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {employees.map((emp) => (
                <label key={emp.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-md cursor-pointer">
                  <input type="checkbox" checked={selectedEmployeeIds.includes(emp.id)} onChange={() => toggleEmployee(emp.id)} className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  <span className="text-sm font-medium">{emp.employeeCode}</span>
                  <span className="text-sm text-gray-500">{emp.nameId}</span>
                </label>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="ghost" onClick={handleBack}>Back</Button>
            <Button onClick={handleNext}>Next</Button>
          </CardFooter>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader><CardTitle>Review & Generate</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Name:</span><p className="font-medium">{formData.name}</p></div>
              <div><span className="text-gray-500">Period:</span><p className="font-medium">{new Date(0, formData.month - 1).toLocaleString('default', { month: 'long' })} {formData.year}</p></div>
              <div><span className="text-gray-500">Inclusive Dates:</span><p className="font-medium">{inclusiveDates.length} dates</p></div>
              <div><span className="text-gray-500">Groups:</span><p className="font-medium">{groups.length} filters</p></div>
              <div><span className="text-gray-500">Employees:</span><p className="font-medium">{selectedEmployeeIds.length || employees.length} selected</p></div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="ghost" onClick={handleBack}>Back</Button>
            <Button onClick={() => navigate(`/payroll/${id}`)}><Check className="w-4 h-4 mr-2" />Complete Setup</Button>
          </CardFooter>
        </Card>
      )}

      {step < 4 && (
        <div className="flex justify-between">
          {step > 0 && <Button variant="ghost" onClick={handleBack}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>}
          <div className="ml-auto">
            <Button onClick={handleNext} disabled={loading}>
              {loading ? 'Saving...' : step < 4 ? 'Next' : 'Complete'} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function GroupForm({ onAdd }: { onAdd: (group: PayrollGroup) => void }) {
  const [groupId, setGroupId] = useState('')
  const [positionId, setPositionId] = useState('')
  const [areaId, setAreaId] = useState('')
  const [statusId, setStatusId] = useState('')

  const handleAdd = () => {
    if (groupId || positionId || areaId || statusId) {
      onAdd({ id: '', payrollId: '', groupId, positionId, areaId, statusId, order: 0, page: 1 })
      setGroupId(''); setPositionId(''); setAreaId(''); setStatusId('')
    }
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
        <option value="">Any Group</option>
      </select>
      <select value={positionId} onChange={(e) => setPositionId(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
        <option value="">Any Position</option>
      </select>
      <select value={areaId} onChange={(e) => setAreaId(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
        <option value="">Any Area</option>
      </select>
      <select value={statusId} onChange={(e) => setStatusId(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
        <option value="">Any Status</option>
      </select>
      <Button onClick={handleAdd} disabled={!groupId && !positionId && !areaId && !statusId}>Add Filter</Button>
    </div>
  )
}
