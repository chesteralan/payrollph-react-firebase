import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { EditableCell } from '../../components/ui/EditableCell'
import { PayrollOutputView } from '../../components/payroll/PayrollOutputView'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { ArrowLeft, Lock, Unlock, Save } from 'lucide-react'
import type { Payroll, PayrollEmployee } from '../../types'

const STAGES = ['dtr', 'salaries', 'earnings', 'benefits', 'deductions', 'summary', 'output']

interface ProcessingRow {
  nameId: string
  employeeCode: string
  firstName: string
  lastName: string
  groupId: string
  positionId: string
  areaId: string
  daysWorked: number
  absences: number
  lateHours: number
  overtimeHours: number
  basicSalary: number
  ratePerDay: number
  salaryAmount: number
}

export function PayrollDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [payroll, setPayroll] = useState<Payroll | null>(null)
  const [activeStage, setActiveStage] = useState('dtr')
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState<PayrollEmployee[]>([])
  const [rows, setRows] = useState<ProcessingRow[]>([])
  const [earningsList, setEarningsList] = useState<{ id: string; name: string }[]>([])
  const [deductionsList, setDeductionsList] = useState<{ id: string; name: string }[]>([])
  const [benefitsList, setBenefitsList] = useState<{ id: string; name: string }[]>([])
  const [earningData, setEarningData] = useState<Map<string, Map<string, number>>>(new Map())
  const [deductionData, setDeductionData] = useState<Map<string, Map<string, number>>>(new Map())
  const [benefitData, setBenefitData] = useState<Map<string, Map<string, { employeeShare: number; employerShare: number }>>>(new Map())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (id) loadPayroll()
  }, [id])

  const loadPayroll = async () => {
    if (!id) return
    setLoading(true)
    try {
      const [payrollSnap, empSnap, earningsSnap, deductionsSnap, benefitsSnap] = await Promise.all([
        getDoc(doc(db, 'payroll', id)),
        getDocs(query(collection(db, 'payroll_employees'), where('payrollId', '==', id))),
        getDocs(query(collection(db, 'earnings'))),
        getDocs(query(collection(db, 'deductions'))),
        getDocs(query(collection(db, 'benefits'))),
      ])

      if (payrollSnap.exists()) {
        setPayroll({ id: payrollSnap.id, ...payrollSnap.data() } as Payroll)
      }

      const payEmps = empSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as PayrollEmployee[]
      setEmployees(payEmps)

      setEarningsList(earningsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as { name: string }) })))
      setDeductionsList(deductionsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as { name: string }) })))
      setBenefitsList(benefitsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as { name: string }) })))

      const rowsData: ProcessingRow[] = []
      for (const emp of payEmps) {
        rowsData.push({
          nameId: emp.nameId,
          employeeCode: emp.nameId.substring(0, 6),
          firstName: '',
          lastName: emp.nameId,
          groupId: emp.groupId || '',
          positionId: emp.positionId || '',
          areaId: emp.areaId || '',
          daysWorked: 0,
          absences: 0,
          lateHours: 0,
          overtimeHours: 0,
          basicSalary: 0,
          ratePerDay: 0,
          salaryAmount: 0,
        })
      }
      setRows(rowsData)

      const ed = new Map<string, Map<string, number>>()
      const dd = new Map<string, Map<string, number>>()
      const bd = new Map<string, Map<string, { employeeShare: number; employerShare: number }>>()
      for (const emp of payEmps) {
        ed.set(emp.nameId, new Map())
        dd.set(emp.nameId, new Map())
        bd.set(emp.nameId, new Map())
      }
      setEarningData(ed)
      setDeductionData(dd)
      setBenefitData(bd)
    } finally {
      setLoading(false)
    }
  }

  const toggleLock = async () => {
    if (!payroll || !id) return
    await updateDoc(doc(db, 'payroll', id), { isLocked: !payroll.isLocked })
    setPayroll({ ...payroll, isLocked: !payroll.isLocked })
  }

  const updateRow = useCallback((nameId: string, field: keyof ProcessingRow, value: number) => {
    setRows((prev) => prev.map((r) => (r.nameId === nameId ? { ...r, [field]: value } : r)))
  }, [])

  const updateEarning = (nameId: string, earningId: string, value: number) => {
    setEarningData((prev) => {
      const next = new Map(prev)
      const empMap = new Map(next.get(nameId) || new Map())
      empMap.set(earningId, value)
      next.set(nameId, empMap)
      return next
    })
  }

  const updateDeduction = (nameId: string, deductionId: string, value: number) => {
    setDeductionData((prev) => {
      const next = new Map(prev)
      const empMap = new Map(next.get(nameId) || new Map())
      empMap.set(deductionId, value)
      next.set(nameId, empMap)
      return next
    })
  }

  const updateBenefit = (nameId: string, benefitId: string, employeeShare: number, employerShare: number) => {
    setBenefitData((prev) => {
      const next = new Map(prev)
      const empMap = new Map(next.get(nameId) || new Map())
      empMap.set(benefitId, { employeeShare, employerShare })
      next.set(nameId, empMap)
      return next
    })
  }

  const handleSaveStage = async () => {
    if (!id || saving) return
    setSaving(true)
    try {
      for (const row of rows) {
        await updateDoc(doc(db, 'payroll_employees', employees.find((e) => e.nameId === row.nameId)?.id || ''), {
          daysWorked: row.daysWorked,
          absences: row.absences,
          lateHours: row.lateHours,
          overtimeHours: row.overtimeHours,
        })
      }

      const savePromises: Promise<unknown>[] = []
      earningData.forEach((empMap, nameId) => {
        empMap.forEach((amount, earningId) => {
          if (amount > 0) {
            savePromises.push(
              addDoc(collection(db, 'payroll_employees_earnings'), {
                payrollId: id,
                nameId,
                earningId,
                amount,
                createdAt: serverTimestamp(),
              })
            )
          }
        })
      })
      deductionData.forEach((empMap, nameId) => {
        empMap.forEach((amount, deductionId) => {
          if (amount > 0) {
            savePromises.push(
              addDoc(collection(db, 'payroll_employees_deductions'), {
                payrollId: id,
                nameId,
                deductionId,
                amount,
                createdAt: serverTimestamp(),
              })
            )
          }
        })
      })
      benefitData.forEach((empMap, nameId) => {
        empMap.forEach(({ employeeShare, employerShare }, benefitId) => {
          if (employeeShare > 0 || employerShare > 0) {
            savePromises.push(
              addDoc(collection(db, 'payroll_employees_benefits'), {
                payrollId: id,
                nameId,
                benefitId,
                employeeShare,
                employerShare,
                createdAt: serverTimestamp(),
              })
            )
          }
        })
      })

      await Promise.all(savePromises)
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (value: number) => value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const getEarningTotal = (earningId: string) => rows.reduce((sum, row) => sum + (earningData.get(row.nameId)?.get(earningId) || 0), 0)

  const getDeductionTotal = (deductionId: string) => rows.reduce((sum, row) => sum + (deductionData.get(row.nameId)?.get(deductionId) || 0), 0)

  const getEmployeeGross = (row: ProcessingRow) => {
    const earnings = Array.from(earningData.get(row.nameId)?.values() || []).reduce((s, v) => s + v, 0)
    return row.salaryAmount + earnings
  }

  const getEmployeeNet = (row: ProcessingRow) => {
    const deductions = Array.from(deductionData.get(row.nameId)?.values() || []).reduce((s, v) => s + v, 0)
    const benefits = Array.from(benefitData.get(row.nameId)?.values() || []).reduce((s, v) => s + v.employeeShare, 0)
    return getEmployeeGross(row) - deductions - benefits
  }

  if (loading || !payroll) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/payroll')}><ArrowLeft className="w-4 h-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{payroll.name}</h1>
            <p className="text-gray-500">
              {new Date(0, payroll.month - 1).toLocaleString('default', { month: 'long' })} {payroll.year}
              {payroll.isLocked && ' (Locked)'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {activeStage !== 'output' && !payroll.isLocked && (
            <Button variant="secondary" onClick={handleSaveStage} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />{saving ? 'Saving...' : 'Save'}
            </Button>
          )}
          <Button variant="secondary" onClick={toggleLock}>
            {payroll.isLocked ? <Unlock className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
            {payroll.isLocked ? 'Unlock' : 'Lock'}
          </Button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {STAGES.map((stage) => (
          <button
            key={stage}
            onClick={() => setActiveStage(stage)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors whitespace-nowrap ${
              activeStage === stage
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {stage}
          </button>
        ))}
      </div>

      {activeStage === 'dtr' && (
        <Card>
          <CardHeader>
            <CardTitle>Daily Time Record</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Employee</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Days Worked</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Absences</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Late (hrs)</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Overtime (hrs)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr key={row.nameId} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <div className="text-sm font-medium text-gray-900">{row.employeeCode}</div>
                      <div className="text-xs text-gray-500">{row.lastName}</div>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <EditableCell value={row.daysWorked} onChange={(v) => updateRow(row.nameId, 'daysWorked', Number(v))} type="number" className="text-center" />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <EditableCell value={row.absences} onChange={(v) => updateRow(row.nameId, 'absences', Number(v))} type="number" className="text-center" />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <EditableCell value={row.lateHours} onChange={(v) => updateRow(row.nameId, 'lateHours', Number(v))} type="number" className="text-center" />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <EditableCell value={row.overtimeHours} onChange={(v) => updateRow(row.nameId, 'overtimeHours', Number(v))} type="number" className="text-center" />
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No employees in this payroll. Go to the wizard to add employees.</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {activeStage === 'salaries' && (
        <Card>
          <CardHeader><CardTitle>Salaries</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Employee</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Basic Salary</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Rate/Day</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Salary Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr key={row.nameId} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <div className="text-sm font-medium text-gray-900">{row.employeeCode}</div>
                      <div className="text-xs text-gray-500">{row.lastName}</div>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <EditableCell value={row.basicSalary} onChange={(v) => updateRow(row.nameId, 'basicSalary', Number(v))} type="number" className="text-right" />
                    </td>
                    <td className="px-4 py-2 text-right text-sm text-gray-700">{formatCurrency(row.ratePerDay)}</td>
                    <td className="px-4 py-2 text-right text-sm font-medium text-gray-900">{formatCurrency(row.salaryAmount)}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No employees in this payroll.</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {activeStage === 'earnings' && (
        <Card>
          <CardHeader><CardTitle>Earnings</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50">Employee</th>
                  {earningsList.map((e) => (
                    <th key={e.id} className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase min-w-[120px]">{e.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr key={row.nameId} className="hover:bg-gray-50">
                    <td className="px-4 py-2 sticky left-0 bg-white">
                      <div className="text-sm font-medium text-gray-900">{row.employeeCode}</div>
                      <div className="text-xs text-gray-500">{row.lastName}</div>
                    </td>
                    {earningsList.map((e) => (
                      <td key={e.id} className="px-4 py-2 text-right">
                        <EditableCell
                          value={earningData.get(row.nameId)?.get(e.id) || 0}
                          onChange={(v) => updateEarning(row.nameId, e.id, Number(v))}
                          type="number"
                          className="text-right"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="bg-gray-50 font-medium">
                  <td className="px-4 py-2 sticky left-0 bg-gray-50 text-sm">Total</td>
                  {earningsList.map((e) => (
                    <td key={e.id} className="px-4 py-2 text-right text-sm">{formatCurrency(getEarningTotal(e.id))}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {activeStage === 'benefits' && (
        <Card>
          <CardHeader><CardTitle>Benefits</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50">Employee</th>
                  {benefitsList.map((b) => (
                    <th key={b.id} className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase min-w-[200px]" colSpan={2}>{b.name} (EE / ER)</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr key={row.nameId} className="hover:bg-gray-50">
                    <td className="px-4 py-2 sticky left-0 bg-white">
                      <div className="text-sm font-medium text-gray-900">{row.employeeCode}</div>
                      <div className="text-xs text-gray-500">{row.lastName}</div>
                    </td>
                    {benefitsList.map((b) => {
                      const val = benefitData.get(row.nameId)?.get(b.id) || { employeeShare: 0, employerShare: 0 }
                      return (
                        <td key={b.id} className="px-4 py-2 text-right">
                          <div className="flex gap-1 justify-end">
                            <EditableCell
                              value={val.employeeShare}
                              onChange={(v) => updateBenefit(row.nameId, b.id, Number(v), val.employerShare)}
                              type="number"
                              className="w-20 text-right"
                            />
                            <EditableCell
                              value={val.employerShare}
                              onChange={(v) => updateBenefit(row.nameId, b.id, val.employeeShare, Number(v))}
                              type="number"
                              className="w-20 text-right"
                            />
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {activeStage === 'deductions' && (
        <Card>
          <CardHeader><CardTitle>Deductions</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50">Employee</th>
                  {deductionsList.map((d) => (
                    <th key={d.id} className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase min-w-[120px]">{d.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr key={row.nameId} className="hover:bg-gray-50">
                    <td className="px-4 py-2 sticky left-0 bg-white">
                      <div className="text-sm font-medium text-gray-900">{row.employeeCode}</div>
                      <div className="text-xs text-gray-500">{row.lastName}</div>
                    </td>
                    {deductionsList.map((d) => (
                      <td key={d.id} className="px-4 py-2 text-right">
                        <EditableCell
                          value={deductionData.get(row.nameId)?.get(d.id) || 0}
                          onChange={(v) => updateDeduction(row.nameId, d.id, Number(v))}
                          type="number"
                          className="text-right"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="bg-gray-50 font-medium">
                  <td className="px-4 py-2 sticky left-0 bg-gray-50 text-sm">Total</td>
                  {deductionsList.map((d) => (
                    <td key={d.id} className="px-4 py-2 text-right text-sm">{formatCurrency(getDeductionTotal(d.id))}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {activeStage === 'summary' && (
        <Card>
          <CardHeader><CardTitle>Payroll Summary</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50">Employee</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Basic</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Earnings</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Gross</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Deductions</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Benefits (EE)</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Net Pay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => {
                  const earnings = Array.from(earningData.get(row.nameId)?.values() || []).reduce((s, v) => s + v, 0)
                  const deductions = Array.from(deductionData.get(row.nameId)?.values() || []).reduce((s, v) => s + v, 0)
                  const benefits = Array.from(benefitData.get(row.nameId)?.values() || []).reduce((s, v) => s + v.employeeShare, 0)
                  const gross = row.salaryAmount + earnings
                  const net = gross - deductions - benefits
                  return (
                    <tr key={row.nameId} className="hover:bg-gray-50">
                      <td className="px-4 py-2 sticky left-0 bg-white">
                        <div className="text-sm font-medium text-gray-900">{row.employeeCode}</div>
                        <div className="text-xs text-gray-500">{row.lastName}</div>
                      </td>
                      <td className="px-4 py-2 text-right text-sm">{formatCurrency(row.salaryAmount)}</td>
                      <td className="px-4 py-2 text-right text-sm text-green-600">{formatCurrency(earnings)}</td>
                      <td className="px-4 py-2 text-right text-sm font-medium">{formatCurrency(gross)}</td>
                      <td className="px-4 py-2 text-right text-sm text-red-600">{formatCurrency(deductions)}</td>
                      <td className="px-4 py-2 text-right text-sm">{formatCurrency(benefits)}</td>
                      <td className="px-4 py-2 text-right text-sm font-bold text-gray-900">{formatCurrency(net)}</td>
                    </tr>
                  )
                })}
                {rows.length > 0 && (
                  <tr className="bg-gray-50 font-bold">
                    <td className="px-4 py-2 sticky left-0 bg-gray-50 text-sm">Total</td>
                    <td className="px-4 py-2 text-right text-sm">{formatCurrency(rows.reduce((s, r) => s + r.salaryAmount, 0))}</td>
                    <td className="px-4 py-2 text-right text-sm text-green-600">
                      {formatCurrency(rows.reduce((s, r) => s + Array.from(earningData.get(r.nameId)?.values() || []).reduce((a, v) => a + v, 0), 0))}
                    </td>
                    <td className="px-4 py-2 text-right text-sm">
                      {formatCurrency(rows.reduce((s, r) => s + getEmployeeGross(r), 0))}
                    </td>
                    <td className="px-4 py-2 text-right text-sm text-red-600">
                      {formatCurrency(rows.reduce((s, r) => s + Array.from(deductionData.get(r.nameId)?.values() || []).reduce((a, v) => a + v, 0), 0))}
                    </td>
                    <td className="px-4 py-2 text-right text-sm">
                      {formatCurrency(rows.reduce((s, r) => s + Array.from(benefitData.get(r.nameId)?.values() || []).reduce((a, v) => a + v.employeeShare, 0), 0))}
                    </td>
                    <td className="px-4 py-2 text-right text-sm">
                      {formatCurrency(rows.reduce((s, r) => s + getEmployeeNet(r), 0))}
                    </td>
                  </tr>
                )}
                {rows.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No employees in this payroll.</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {activeStage === 'output' && (
        <PayrollOutputView
          payroll={payroll}
          rows={rows}
          earningData={earningData}
          deductionData={deductionData}
          benefitData={benefitData}
          earningsList={earningsList}
          deductionsList={deductionsList}
          benefitsList={benefitsList}
        />
      )}

      {activeStage !== 'output' && !payroll.isLocked && (
        <div className="flex justify-end">
          <Button onClick={handleSaveStage} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />{saving ? 'Saving...' : 'Save All Changes'}
          </Button>
        </div>
      )}
    </div>
  )
}
