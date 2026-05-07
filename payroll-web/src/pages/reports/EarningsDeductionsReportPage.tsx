import { useState, useEffect, useMemo } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useAuth } from '../../hooks/useAuth'
import { usePermissions } from '../../hooks/usePermissions'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { FileSpreadsheet, Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import type { Payroll, PayrollEmployeeEarning, PayrollEmployeeDeduction, PayrollEmployeeBenefit } from '../../types'

interface EarningTypeSummary {
  earningId: string
  name: string
  totalAmount: number
  employeeCount: number
}

interface DeductionTypeSummary {
  deductionId: string
  name: string
  totalAmount: number
  employeeCount: number
}

interface BenefitSummary {
  benefitId: string
  name: string
  totalEE: number
  totalER: number
  employeeCount: number
}

interface EmployeeBreakdown {
  nameId: string
  employeeCode: string
  firstName: string
  lastName: string
  groupName: string
  earnings: { name: string; amount: number }[]
  deductions: { name: string; amount: number }[]
  benefits: { name: string; eeShare: number; erShare: number }[]
  totalEarnings: number
  totalDeductions: number
  totalBenefits: number
}

interface PayrollOption {
  id: string
  name: string
  month: number
  year: number
}

export function EarningsDeductionsReportPage() {
  const { currentCompanyId } = useAuth()
  const { canView } = usePermissions()

  const [startMonth, setStartMonth] = useState(new Date().getMonth() + 1)
  const [startYear, setStartYear] = useState(new Date().getFullYear())
  const [endMonth, setEndMonth] = useState(new Date().getMonth() + 1)
  const [endYear, setEndYear] = useState(new Date().getFullYear())
  const [payrollOptions, setPayrollOptions] = useState<PayrollOption[]>([])
  const [selectedPayrolls, setSelectedPayrolls] = useState<string[]>([])
  const [groupFilter, setGroupFilter] = useState<string>('all')
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([])

  const [loading, setLoading] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)

  const [earningSummaries, setEarningSummaries] = useState<EarningTypeSummary[]>([])
  const [deductionSummaries, setDeductionSummaries] = useState<DeductionTypeSummary[]>([])
  const [benefitSummaries, setBenefitSummaries] = useState<BenefitSummary[]>([])
  const [employeeBreakdowns, setEmployeeBreakdowns] = useState<EmployeeBreakdown[]>([])

  const [earningNames, setEarningNames] = useState<Map<string, string>>(new Map())
  const [deductionNames, setDeductionNames] = useState<Map<string, string>>(new Map())
  const [benefitNames, setBenefitNames] = useState<Map<string, string>>(new Map())

  const loadPayrolls = async () => {
    if (!currentCompanyId) return
    const snap = await getDocs(query(collection(db, 'payroll'), where('companyId', '==', currentCompanyId)))
    const payrolls = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Payroll[]
    payrolls.sort((a, b) => {
      const dateA = new Date(a.year, a.month - 1).getTime()
      const dateB = new Date(b.year, b.month - 1).getTime()
      return dateB - dateA
    })
    setPayrollOptions(payrolls.map(p => ({ id: p.id, name: p.name, month: p.month, year: p.year })))
  }

  const loadLists = async () => {
    if (!currentCompanyId) return
    const [earningsSnap, deductionsSnap, benefitsSnap, groupsSnap] = await Promise.all([
      getDocs(query(collection(db, 'earnings'), where('companyId', '==', currentCompanyId))),
      getDocs(query(collection(db, 'deductions'), where('companyId', '==', currentCompanyId))),
      getDocs(query(collection(db, 'benefits'), where('companyId', '==', currentCompanyId))),
      getDocs(query(collection(db, 'groups'), where('companyId', '==', currentCompanyId)))
    ])

    const eNames = new Map<string, string>()
    earningsSnap.docs.forEach(d => eNames.set(d.id, d.data().name || d.id))
    setEarningNames(eNames)

    const dNames = new Map<string, string>()
    deductionsSnap.docs.forEach(d => dNames.set(d.id, d.data().name || d.id))
    setDeductionNames(dNames)

    const bNames = new Map<string, string>()
    benefitsSnap.docs.forEach(d => bNames.set(d.id, d.data().name || d.id))
    setBenefitNames(bNames)

    setGroups(groupsSnap.docs.map(d => ({ id: d.id, name: d.data().name || d.id })))
  }

  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    if (currentCompanyId) {
      loadPayrolls()
      loadLists()
    }
  }, [currentCompanyId])
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  const generateReport = async () => {
    if (!currentCompanyId) return
    setLoading(true)
    setHasGenerated(true)

    try {
      let targetPayrollIds = selectedPayrolls

      if (targetPayrollIds.length === 0) {
        const snap = await getDocs(query(collection(db, 'payroll'), where('companyId', '==', currentCompanyId)))
        const payrolls = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Payroll[]
        targetPayrollIds = payrolls
          .filter(p => {
            const start = startYear * 12 + startMonth
            const end = endYear * 12 + endMonth
            const payrollDate = p.year * 12 + p.month
            return payrollDate >= start && payrollDate <= end
          })
          .map(p => p.id)
      }

      if (targetPayrollIds.length === 0) {
        setEarningSummaries([])
        setDeductionSummaries([])
        setBenefitSummaries([])
        setEmployeeBreakdowns([])
        setLoading(false)
        return
      }

      const [empSnap, earnSnap, dedSnap, benSnap, employeesSnap] = await Promise.all([
        getDocs(query(collection(db, 'payroll_employees'), where('payrollId', 'in', targetPayrollIds))),
        getDocs(query(collection(db, 'payroll_employee_earnings'), where('payrollId', 'in', targetPayrollIds))),
        getDocs(query(collection(db, 'payroll_employee_deductions'), where('payrollId', 'in', targetPayrollIds))),
        getDocs(query(collection(db, 'payroll_employee_benefits'), where('payrollId', 'in', targetPayrollIds))),
        getDocs(query(collection(db, 'employees'), where('companyId', '==', currentCompanyId)))
      ])

      const employees = new Map(employeesSnap.docs.map(d => [d.data().nameId, { id: d.id, ...d.data() }]))
      const payrollEmps = empSnap.docs.map(d => ({ id: d.id, ...d.data() })) as PayrollEmployee[]

      let filteredEmps = payrollEmps
      if (groupFilter !== 'all') {
        filteredEmps = filteredEmps.filter(e => e.groupId === groupFilter)
      }

      const earnings = earnSnap.docs.map(d => ({ id: d.id, ...d.data() })) as PayrollEmployeeEarning[]
      const deductions = dedSnap.docs.map(d => ({ id: d.id, ...d.data() })) as PayrollEmployeeDeduction[]
      const benefits = benSnap.docs.map(d => ({ id: d.id, ...d.data() })) as PayrollEmployeeBenefit[]

      const earningMap = new Map<string, EarningTypeSummary>()
      const deductionMap = new Map<string, DeductionTypeSummary>()
      const benefitMap = new Map<string, BenefitSummary>()
      const empBreakdownMap = new Map<string, EmployeeBreakdown>()

      for (const emp of filteredEmps) {
        const empData = employees.get(emp.nameId)
        const key = emp.nameId
        if (!empBreakdownMap.has(key)) {
          empBreakdownMap.set(key, {
            nameId: emp.nameId,
            employeeCode: empData?.employeeCode || emp.nameId,
            firstName: empData?.firstName || '',
            lastName: empData?.lastName || emp.nameId,
            groupName: emp.groupId || 'Ungrouped',
            earnings: [],
            deductions: [],
            benefits: [],
            totalEarnings: 0,
            totalDeductions: 0,
            totalBenefits: 0
          })
        }
      }

      for (const earn of earnings) {
        const emp = filteredEmps.find(e => e.nameId === earn.nameId)
        if (!emp) continue

        const name = earningNames.get(earn.earningId) || earn.earningId
        const amount = earn.amount || 0

        if (!earningMap.has(earn.earningId)) {
          earningMap.set(earn.earningId, { earningId: earn.earningId, name, totalAmount: 0, employeeCount: 0 })
        }
        const summary = earningMap.get(earn.earningId)!
        summary.totalAmount += amount
        summary.employeeCount = new Set(earnings.filter(e => e.earningId === earn.earningId).map(e => e.nameId)).size

        const breakdown = empBreakdownMap.get(earn.nameId)
        if (breakdown) {
          breakdown.earnings.push({ name, amount })
          breakdown.totalEarnings += amount
        }
      }

      for (const ded of deductions) {
        const emp = filteredEmps.find(e => e.nameId === ded.nameId)
        if (!emp) continue

        const name = deductionNames.get(ded.deductionId) || ded.deductionId
        const amount = ded.amount || 0

        if (!deductionMap.has(ded.deductionId)) {
          deductionMap.set(ded.deductionId, { deductionId: ded.deductionId, name, totalAmount: 0, employeeCount: 0 })
        }
        const summary = deductionMap.get(ded.deductionId)!
        summary.totalAmount += amount
        summary.employeeCount = new Set(deductions.filter(d => d.deductionId === ded.deductionId).map(d => d.nameId)).size

        const breakdown = empBreakdownMap.get(ded.nameId)
        if (breakdown) {
          breakdown.deductions.push({ name, amount })
          breakdown.totalDeductions += amount
        }
      }

      for (const ben of benefits) {
        const emp = filteredEmps.find(e => e.nameId === ben.nameId)
        if (!emp) continue

        const name = benefitNames.get(ben.benefitId) || ben.benefitId
        const eeShare = ben.employeeShare || 0
        const erShare = ben.employerShare || 0

        if (!benefitMap.has(ben.benefitId)) {
          benefitMap.set(ben.benefitId, { benefitId: ben.benefitId, name, totalEE: 0, totalER: 0, employeeCount: 0 })
        }
        const summary = benefitMap.get(ben.benefitId)!
        summary.totalEE += eeShare
        summary.totalER += erShare
        summary.employeeCount = new Set(benefits.filter(b => b.benefitId === ben.benefitId).map(b => b.nameId)).size

        const breakdown = empBreakdownMap.get(ben.nameId)
        if (breakdown) {
          breakdown.benefits.push({ name, eeShare, erShare })
          breakdown.totalBenefits += eeShare + erShare
        }
      }

      setEarningSummaries(Array.from(earningMap.values()).sort((a, b) => b.totalAmount - a.totalAmount))
      setDeductionSummaries(Array.from(deductionMap.values()).sort((a, b) => b.totalAmount - a.totalAmount))
      setBenefitSummaries(Array.from(benefitMap.values()).sort((a, b) => (b.totalEE + b.totalER) - (a.totalEE + a.totalER)))
      setEmployeeBreakdowns(Array.from(empBreakdownMap.values()).sort((a, b) => a.lastName.localeCompare(b.lastName)))
    } finally {
      setLoading(false)
    }
  }

  const totalEarnings = useMemo(() => earningSummaries.reduce((sum, e) => sum + e.totalAmount, 0), [earningSummaries])
  const totalDeductions = useMemo(() => deductionSummaries.reduce((sum, d) => sum + d.totalAmount, 0), [deductionSummaries])
  const totalBenefitsEE = useMemo(() => benefitSummaries.reduce((sum, b) => sum + b.totalEE, 0), [benefitSummaries])
  const totalBenefitsER = useMemo(() => benefitSummaries.reduce((sum, b) => sum + b.totalER, 0), [benefitSummaries])

  const handleExportXLS = () => {
    const wb = XLSX.utils.book_new()

    const summaryData = [
      { 'Type': 'EARNINGS', 'Name': '', 'Total Amount': '', 'Employee Count': '' },
      ...earningSummaries.map(e => ({
        'Type': '',
        'Name': e.name,
        'Total Amount': e.totalAmount,
        'Employee Count': e.employeeCount
      })),
      { 'Type': 'TOTAL EARNINGS', 'Name': '', 'Total Amount': totalEarnings, 'Employee Count': '' },
      { 'Type': '', 'Name': '', 'Total Amount': '', 'Employee Count': '' },
      { 'Type': 'DEDUCTIONS', 'Name': '', 'Total Amount': '', 'Employee Count': '' },
      ...deductionSummaries.map(d => ({
        'Type': '',
        'Name': d.name,
        'Total Amount': d.totalAmount,
        'Employee Count': d.employeeCount
      })),
      { 'Type': 'TOTAL DEDUCTIONS', 'Name': '', 'Total Amount': totalDeductions, 'Employee Count': '' },
      { 'Type': '', 'Name': '', 'Total Amount': '', 'Employee Count': '' },
       { 'Type': 'BENEFITS', 'Name': '', 'Total Amount': '', 'Employee Count': '' },
      ...benefitSummaries.map(b => ({
        'Type': '',
        'Name': b.name,
        'Total Amount': b.totalEE + b.totalER,
        'Employee Count': b.employeeCount
      })),
      { 'Type': 'TOTAL BENEFITS', 'Name': '', 'Total Amount': totalBenefitsEE + totalBenefitsER, 'Employee Count': '' }
    ]

    const ws1 = XLSX.utils.json_to_sheet(summaryData)
    ws1['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 20 }, { wch: 15 }]
    XLSX.utils.book_append_sheet(wb, ws1, 'Summary')

    const detailData = employeeBreakdowns.map(emp => ({
      'Employee Code': emp.employeeCode,
      'Name': `${emp.firstName} ${emp.lastName}`,
      'Group': emp.groupName,
      'Total Earnings': emp.totalEarnings,
      'Total Deductions': emp.totalDeductions,
      'Total Benefits': emp.totalBenefits
    }))

    const ws2 = XLSX.utils.json_to_sheet(detailData)
    ws2['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }]
    XLSX.utils.book_append_sheet(wb, ws2, 'Employee Details')

    XLSX.writeFile(wb, `Earnings_Deductions_Report_${startYear}_${endYear}.xlsx`)
  }

  const handleExportCSV = () => {
    const headers = ['Employee Code', 'Name', 'Group', 'Total Earnings', 'Total Deductions', 'Total Benefits']
    const rows = employeeBreakdowns.map(emp => [
      emp.employeeCode,
      `${emp.firstName} ${emp.lastName}`,
      emp.groupName,
      emp.totalEarnings.toFixed(2),
      emp.totalDeductions.toFixed(2),
      emp.totalBenefits.toFixed(2)
    ])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Earnings_Deductions_Report_${startYear}_${endYear}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatCurrency = (value: number) =>
    value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(0, i).toLocaleString('default', { month: 'long' })
  }))

  if (!canView('reports', 'payroll')) return <div className="text-center py-12 text-gray-500">Access denied</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Earnings/Deductions Breakdown Report</h1>
        {hasGenerated && employeeBreakdowns.length > 0 && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />Export CSV
            </Button>
            <Button variant="secondary" onClick={handleExportXLS}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />Export XLS
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle>Report Parameters</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <div className="flex items-center gap-2">
                <select
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={startMonth}
                  onChange={(e) => setStartMonth(Number(e.target.value))}
                >
                  {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <select
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={startYear}
                  onChange={(e) => setStartYear(Number(e.target.value))}
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <span className="text-gray-500">to</span>
                <select
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={endMonth}
                  onChange={(e) => setEndMonth(Number(e.target.value))}
                >
                  {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <select
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={endYear}
                  onChange={(e) => setEndYear(Number(e.target.value))}
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payroll Selection (leave empty for date range)</label>
              <select
                multiple
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm h-32"
                value={selectedPayrolls}
                onChange={(e) => setSelectedPayrolls(Array.from(e.target.selectedOptions, opt => opt.value))}
              >
                {payrollOptions.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Group Filter</label>
              <select
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
              >
                <option value="all">All Groups</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>

            <Button onClick={generateReport} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {hasGenerated && (
        <>
          {employeeBreakdowns.length === 0 ? (
            <Card><CardContent className="pt-6"><p className="text-center text-gray-500 py-8">No data found for the selected filters.</p></CardContent></Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-500">Total Earnings</div>
                    <div className="text-2xl font-bold">{formatCurrency(totalEarnings)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-500">Total Deductions</div>
                    <div className="text-2xl font-bold">{formatCurrency(totalDeductions)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-500">Total Benefits (EE)</div>
                    <div className="text-2xl font-bold">{formatCurrency(totalBenefitsEE)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-500">Total Benefits (ER)</div>
                    <div className="text-2xl font-bold">{formatCurrency(totalBenefitsER)}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle>Earnings by Type</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Earning Type</th>
                          <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Employees</th>
                          <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {earningSummaries.map((e, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900">{e.name}</td>
                            <td className="px-6 py-4 text-sm text-right">{e.employeeCount}</td>
                            <td className="px-6 py-4 text-sm text-right">{formatCurrency(e.totalAmount)}</td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50 font-bold border-t-2 border-gray-300">
                          <td className="px-6 py-4">Total</td>
                          <td className="px-6 py-4 text-right"></td>
                          <td className="px-6 py-4 text-right">{formatCurrency(totalEarnings)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Deductions by Type</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Deduction Type</th>
                          <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Employees</th>
                          <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {deductionSummaries.map((d, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900">{d.name}</td>
                            <td className="px-6 py-4 text-sm text-right">{d.employeeCount}</td>
                            <td className="px-6 py-4 text-sm text-right">{formatCurrency(d.totalAmount)}</td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50 font-bold border-t-2 border-gray-300">
                          <td className="px-6 py-4">Total</td>
                          <td className="px-6 py-4 text-right"></td>
                          <td className="px-6 py-4 text-right">{formatCurrency(totalDeductions)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader><CardTitle>Benefits Summary</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Benefit Type</th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">EE Share</th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">ER Share</th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Employees</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {benefitSummaries.map((b, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">{b.name}</td>
                          <td className="px-6 py-4 text-sm text-right">{formatCurrency(b.totalEE)}</td>
                          <td className="px-6 py-4 text-sm text-right">{formatCurrency(b.totalER)}</td>
                          <td className="px-6 py-4 text-sm text-right font-semibold">{formatCurrency(b.totalEE + b.totalER)}</td>
                          <td className="px-6 py-4 text-sm text-right">{b.employeeCount}</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-bold border-t-2 border-gray-300">
                        <td className="px-6 py-4">Total</td>
                        <td className="px-6 py-4 text-right">{formatCurrency(totalBenefitsEE)}</td>
                        <td className="px-6 py-4 text-right">{formatCurrency(totalBenefitsER)}</td>
                        <td className="px-6 py-4 text-right">{formatCurrency(totalBenefitsEE + totalBenefitsER)}</td>
                        <td className="px-6 py-4 text-right"></td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Employee Breakdown</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Employee</th>
                          <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Group</th>
                          <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Earnings</th>
                          <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Deductions</th>
                          <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Benefits</th>
                          <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Net</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {employeeBreakdowns.map((emp, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {emp.employeeCode} - {emp.firstName} {emp.lastName}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">{emp.groupName}</td>
                            <td className="px-6 py-4 text-sm text-right">{formatCurrency(emp.totalEarnings)}</td>
                            <td className="px-6 py-4 text-sm text-right">{formatCurrency(emp.totalDeductions)}</td>
                            <td className="px-6 py-4 text-sm text-right">{formatCurrency(emp.totalBenefits)}</td>
                            <td className="px-6 py-4 text-sm text-right font-semibold">
                              {formatCurrency(emp.totalEarnings - emp.totalDeductions)}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50 font-bold border-t-2 border-gray-300">
                          <td className="px-6 py-4" colSpan={2}>Total</td>
                          <td className="px-6 py-4 text-right">{formatCurrency(totalEarnings)}</td>
                          <td className="px-6 py-4 text-right">{formatCurrency(totalDeductions)}</td>
                          <td className="px-6 py-4 text-right">{formatCurrency(totalBenefitsEE + totalBenefitsER)}</td>
                          <td className="px-6 py-4 text-right">{formatCurrency(totalEarnings - totalDeductions)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  )
}
