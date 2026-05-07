import { useState, useEffect, useMemo } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useAuth } from '../../hooks/useAuth'
import { usePermissions } from '../../hooks/usePermissions'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { FileSpreadsheet, Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import type { Payroll } from '../../types'

interface PayrollSummary extends Payroll {
  employeeCount: number
  grossPay: number
  netPay: number
  groups: GroupSummary[]
}

interface GroupSummary {
  groupId: string
  groupName: string
  employeeCount: number
  grossPay: number
  netPay: number
}

export function PayrollSummaryPage() {
  const { currentCompanyId } = useAuth()
  const { canView } = usePermissions()
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'locked' | 'published'>('all')
  const [selectedMonth, setSelectedMonth] = useState<number>(0)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [payrolls, setPayrolls] = useState<PayrollSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)
  const [expandedPayrollId, setExpandedPayrollId] = useState<string | null>(null)

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (currentCompanyId) {
      setHasGenerated(false)
      setPayrolls([])
    }
  }, [currentCompanyId])
  /* eslint-enable react-hooks/set-state-in-effect */

  const fetchPayrollDetails = async (payroll: Payroll): Promise<GroupSummary[]> => {
    const empSnap = await getDocs(query(collection(db, 'payroll_employees'), where('payrollId', '==', payroll.id)))
    const employees = empSnap.docs.map(d => ({ id: d.id, ...d.data() })) as { id: string; groupId?: string; grossPay?: number; netPay?: number }[]

    const groupMap = new Map<string, GroupSummary>()

    for (const emp of employees) {
      const groupKey = emp.groupId || 'ungrouped'
      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, {
          groupId: groupKey,
          groupName: emp.groupId || 'Ungrouped',
          employeeCount: 0,
          grossPay: 0,
          netPay: 0
        })
      }
      const group = groupMap.get(groupKey)!
      group.employeeCount++
      group.grossPay += emp.grossPay || 0
      group.netPay += emp.netPay || 0
    }

    return Array.from(groupMap.values())
  }

  const generateReport = async () => {
    if (!currentCompanyId) return
    setLoading(true)
    setHasGenerated(true)
    setExpandedPayrollId(null)

    try {
      let q = query(collection(db, 'payroll'), where('companyId', '==', currentCompanyId))

      if (selectedMonth > 0) {
        q = query(q, where('month', '==', selectedMonth))
      }
      q = query(q, where('year', '==', selectedYear))

      const snap = await getDocs(q)
      let results = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Payroll[]

      results = results.filter(p => {
        if (statusFilter === 'all') return true
        if (statusFilter === 'published') return p.status === 'published'
        if (statusFilter === 'locked') return p.isLocked && p.status !== 'published'
        if (statusFilter === 'draft') return !p.isLocked
        return true
      })

      const summaries: PayrollSummary[] = []
      for (const payroll of results) {
        const empSnap = await getDocs(query(collection(db, 'payroll_employees'), where('payrollId', '==', payroll.id)))
        const employees = empSnap.docs.map(d => ({ id: d.id, ...d.data() })) as { id: string; groupId?: string; grossPay?: number; netPay?: number }[]

        const groups = await fetchPayrollDetails(payroll)

        summaries.push({
          ...payroll,
          employeeCount: employees.length,
          grossPay: employees.reduce((sum, e) => sum + (e.grossPay || 0), 0),
          netPay: employees.reduce((sum, e) => sum + (e.netPay || 0), 0),
          groups
        })
      }

      summaries.sort((a, b) => {
        const dateA = new Date(a.year, a.month - 1).getTime()
        const dateB = new Date(b.year, b.month - 1).getTime()
        return dateB - dateA
      })

      setPayrolls(summaries)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = async (payrollId: string) => {
    if (expandedPayrollId === payrollId) {
      setExpandedPayrollId(null)
    } else {
      setExpandedPayrollId(payrollId)
    }
  }

  const totalGross = useMemo(() => payrolls.reduce((sum, p) => sum + p.grossPay, 0), [payrolls])
  const totalNet = useMemo(() => payrolls.reduce((sum, p) => sum + p.netPay, 0), [payrolls])
  const totalEmployees = useMemo(() => payrolls.reduce((sum, p) => sum + p.employeeCount, 0), [payrolls])

  const handleExportXLS = () => {
    const wb = XLSX.utils.book_new()

    const data = payrolls.map(p => ({
      'Payroll Name': p.name,
      'Period': `${new Date(0, p.month - 1).toLocaleString('default', { month: 'long' })} ${p.year}`,
      'Status': p.status,
      'Employees': p.employeeCount,
      'Gross Pay': p.grossPay,
      'Net Pay': p.netPay
    }))

    data.push({
      'Payroll Name': 'TOTAL',
      'Period': '',
      'Status': '',
      'Employees': totalEmployees,
      'Gross Pay': totalGross,
      'Net Pay': totalNet
    })

    const ws = XLSX.utils.json_to_sheet(data)
    ws['!cols'] = [
      { wch: 30 },
      { wch: 20 },
      { wch: 12 },
      { wch: 10 },
      { wch: 15 },
      { wch: 15 }
    ]
    XLSX.utils.book_append_sheet(wb, ws, 'Payroll Summary')
    XLSX.writeFile(wb, `Payroll_Summary_${selectedYear}.xlsx`)
  }

  const handleExportCSV = () => {
    const headers = ['Payroll Name', 'Period', 'Status', 'Employees', 'Gross Pay', 'Net Pay']
    const rows = payrolls.map(p => [
      p.name,
      `${new Date(0, p.month - 1).toLocaleString('default', { month: 'long' })} ${p.year}`,
      p.status,
      p.employeeCount.toString(),
      p.grossPay.toFixed(2),
      p.netPay.toFixed(2)
    ])

    rows.push(['TOTAL', '', '', totalEmployees.toString(), totalGross.toFixed(2), totalNet.toFixed(2)])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Payroll_Summary_${selectedYear}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatCurrency = (value: number) =>
    value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    locked: 'bg-blue-100 text-blue-800',
    published: 'bg-green-100 text-green-800'
  }

  if (!canView('reports', 'payroll')) return <div className="text-center py-12 text-gray-500">Access denied</div>

  const months = [
    { value: 0, label: 'All Months' },
    ...Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(0, i).toLocaleString('default', { month: 'long' }) }))
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Payroll Summary Report</h1>
        {hasGenerated && payrolls.length > 0 && (
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
          <div className="flex items-end gap-4 flex-wrap">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <select
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
              >
                {months.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <select
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'draft' | 'locked' | 'published')}
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="locked">Locked</option>
                <option value="published">Published</option>
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
          {payrolls.length === 0 ? (
            <Card><CardContent className="pt-6"><p className="text-center text-gray-500 py-8">No payroll data found for the selected filters.</p></CardContent></Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-500">Total Payrolls</div>
                    <div className="text-2xl font-bold">{payrolls.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-500">Total Employees</div>
                    <div className="text-2xl font-bold">{totalEmployees}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-500">Total Gross Pay</div>
                    <div className="text-2xl font-bold">{formatCurrency(totalGross)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-500">Total Net Pay</div>
                    <div className="text-2xl font-bold">{formatCurrency(totalNet)}</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader><CardTitle>Payroll Summary</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Payroll</th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Period</th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Employees</th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Gross Pay</th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Net Pay</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {payrolls.map((p) => (
                        <>
                          <tr
                            key={p.id}
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => toggleExpand(p.id)}
                          >
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.name}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {new Date(0, p.month - 1).toLocaleString('default', { month: 'long' })} {p.year}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[p.status || 'draft']}`}>
                                {p.status || 'draft'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-right">{p.employeeCount}</td>
                            <td className="px-6 py-4 text-sm text-right">{formatCurrency(p.grossPay)}</td>
                            <td className="px-6 py-4 text-sm text-right font-semibold">{formatCurrency(p.netPay)}</td>
                          </tr>
                          {expandedPayrollId === p.id && (
                            <tr>
                              <td colSpan={6} className="px-6 py-4 bg-gray-50">
                                <div className="ml-4">
                                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Group Breakdown</h4>
                                  <table className="w-full">
                                    <thead>
                                      <tr className="text-xs text-gray-500 border-b">
                                        <th className="text-left pb-2">Group</th>
                                        <th className="text-right pb-2">Employees</th>
                                        <th className="text-right pb-2">Gross Pay</th>
                                        <th className="text-right pb-2">Net Pay</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {p.groups.map((g, i) => (
                                        <tr key={i} className="border-b border-gray-100">
                                          <td className="py-2 text-sm text-gray-700">{g.groupName}</td>
                                          <td className="py-2 text-sm text-right">{g.employeeCount}</td>
                                          <td className="py-2 text-sm text-right">{formatCurrency(g.grossPay)}</td>
                                          <td className="py-2 text-sm text-right">{formatCurrency(g.netPay)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                      <tr className="bg-gray-50 font-bold border-t-2 border-gray-300">
                        <td className="px-6 py-4" colSpan={3}>Total</td>
                        <td className="px-6 py-4 text-right">{totalEmployees}</td>
                        <td className="px-6 py-4 text-right">{formatCurrency(totalGross)}</td>
                        <td className="px-6 py-4 text-right">{formatCurrency(totalNet)}</td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  )
}
