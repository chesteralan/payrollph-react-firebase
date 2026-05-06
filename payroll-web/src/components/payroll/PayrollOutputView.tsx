import { useState, useMemo } from 'react'
import * as XLSX from 'xlsx'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Printer, FileSpreadsheet, Download } from 'lucide-react'

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

interface CompanyInfo {
  name: string
  address?: string
  tin?: string
  printHeader?: string
  printFooter?: string
}

interface OutputViewProps {
  payroll: {
    name: string
    month: number
    year: number
    isLocked: boolean
  }
  company?: CompanyInfo
  rows: ProcessingRow[]
  earningData: Map<string, Map<string, number>>
  deductionData: Map<string, Map<string, number>>
  benefitData: Map<string, Map<string, { employeeShare: number; employerShare: number }>>
  earningsList: { id: string; name: string }[]
  deductionsList: { id: string; name: string }[]
  benefitsList: { id: string; name: string }[]
}

export function PayrollOutputView({ payroll, company, rows, earningData, deductionData, benefitData, earningsList, deductionsList, benefitsList }: OutputViewProps) {
  const [activeMode, setActiveMode] = useState<OutputMode>('register')
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)

  const formatCurrency = (value: number) => value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const getEmployeeGross = (row: ProcessingRow) => {
    const earnings = Array.from(earningData.get(row.nameId)?.values() || []).reduce((s, v) => s + v, 0)
    return row.salaryAmount + earnings
  }

  const getEmployeeNet = (row: ProcessingRow) => {
    const deductions = Array.from(deductionData.get(row.nameId)?.values() || []).reduce((s, v) => s + v, 0)
    const benefits = Array.from(benefitData.get(row.nameId)?.values() || []).reduce((s, v) => s + v.employeeShare, 0)
    return getEmployeeGross(row) - deductions - benefits
  }

  const getEmployeeEarnings = (row: ProcessingRow) => {
    const empEarnings = earningData.get(row.nameId) || new Map()
    return earningsList.map(e => ({
      name: e.name,
      amount: empEarnings.get(e.id) || 0
    })).filter(e => e.amount > 0)
  }

  const getEmployeeDeductions = (row: ProcessingRow) => {
    const empDeductions = deductionData.get(row.nameId) || new Map()
    return deductionsList.map(d => ({
      name: d.name,
      amount: empDeductions.get(d.id) || 0
    })).filter(d => d.amount > 0)
  }

  const getEmployeeBenefits = (row: ProcessingRow) => {
    const empBenefits = benefitData.get(row.nameId) || new Map()
    return benefitsList.map(b => {
      const val = empBenefits.get(b.id) || { employeeShare: 0, employerShare: 0 }
      return { name: b.name, employeeShare: val.employeeShare, employerShare: val.employerShare }
    }).filter(b => b.employeeShare > 0 || b.employerShare > 0)
  }

  const totals = useMemo(() => {
    const totalBasic = rows.reduce((s, r) => s + r.salaryAmount, 0)
    const totalEarnings = rows.reduce((s, r) => s + Array.from(earningData.get(r.nameId)?.values() || []).reduce((a, v) => a + v, 0), 0)
    const totalGross = rows.reduce((s, r) => s + getEmployeeGross(r), 0)
    const totalDeductions = rows.reduce((s, r) => s + Array.from(deductionData.get(r.nameId)?.values() || []).reduce((a, v) => a + v, 0), 0)
    const totalBenefitsEE = rows.reduce((s, r) => s + Array.from(benefitData.get(r.nameId)?.values() || []).reduce((a, v) => a + v.employeeShare, 0), 0)
    const totalBenefitsER = rows.reduce((s, r) => s + Array.from(benefitData.get(r.nameId)?.values() || []).reduce((a, v) => a + v.employerShare, 0), 0)
    const totalNet = rows.reduce((s, r) => s + getEmployeeNet(r), 0)
    return { totalBasic, totalEarnings, totalGross, totalDeductions, totalBenefitsEE, totalBenefitsER, totalNet }
  }, [rows, earningData, deductionData, benefitData])

  const handlePrint = () => {
    window.print()
  }

  const handleExportXLS = () => {
    const wb = XLSX.utils.book_new()

    const registerData = rows.map(row => ({
      'Employee ID': row.employeeCode,
      'Name': `${row.firstName} ${row.lastName}`,
      'Basic Salary': row.salaryAmount,
      'Earnings': Array.from(earningData.get(row.nameId)?.values() || []).reduce((s, v) => s + v, 0),
      'Gross Pay': getEmployeeGross(row),
      'Deductions': Array.from(deductionData.get(row.nameId)?.values() || []).reduce((s, v) => s + v, 0),
      'Benefits (EE)': Array.from(benefitData.get(row.nameId)?.values() || []).reduce((s, v) => s + v.employeeShare, 0),
      'Net Pay': getEmployeeNet(row)
    }))

    registerData.push({
      'Employee ID': 'TOTAL',
      'Name': '',
      'Basic Salary': totals.totalBasic,
      'Earnings': totals.totalEarnings,
      'Gross Pay': totals.totalGross,
      'Deductions': totals.totalDeductions,
      'Benefits (EE)': totals.totalBenefitsEE,
      'Net Pay': totals.totalNet
    })

    const ws = XLSX.utils.json_to_sheet(registerData)
    XLSX.utils.book_append_sheet(wb, ws, 'Payroll Register')

  const monthName = new Date(0, payroll.month - 1).toLocaleString('default', { month: 'long' })

  const PrintHeader = () => {
    if (!company) return null
    return (
      <div className="print-header text-center mb-6 pb-4 border-b border-gray-300">
        {company.printHeader ? (
          <div dangerouslySetInnerHTML={{ __html: company.printHeader }} />
        ) : (
          <>
            <h2 className="text-xl font-bold text-gray-900">{company.name}</h2>
            {company.address && <p className="text-sm text-gray-600">{company.address}</p>}
            {company.tin && <p className="text-sm text-gray-600">TIN: {company.tin}</p>}
          </>
        )}
        <h3 className="text-lg font-semibold text-gray-800 mt-2">{payroll.name} - {monthName} {payroll.year}</h3>
      </div>
    )
  }

  const PrintFooter = () => {
    if (!company?.printFooter) return null
    return (
      <div className="print-footer text-center mt-6 pt-4 border-t border-gray-300 text-sm text-gray-500">
        <div dangerouslySetInnerHTML={{ __html: company.printFooter }} />
      </div>
    )
  }
    XLSX.writeFile(wb, `Payroll_${payroll.name}_${monthName}_${payroll.year}.xlsx`)
  }

  const handleExportCSV = () => {
    const headers = ['Employee ID', 'Name', 'Basic Salary', 'Earnings', 'Gross Pay', 'Deductions', 'Benefits (EE)', 'Net Pay']
    const csvRows = [
      headers.join(','),
      ...rows.map(row => [
        row.employeeCode,
        `${row.firstName} ${row.lastName}`,
        row.salaryAmount,
        Array.from(earningData.get(row.nameId)?.values() || []).reduce((s, v) => s + v, 0),
        getEmployeeGross(row),
        Array.from(deductionData.get(row.nameId)?.values() || []).reduce((s, v) => s + v, 0),
        Array.from(benefitData.get(row.nameId)?.values() || []).reduce((s, v) => s + v.employeeShare, 0),
        getEmployeeNet(row)
      ].join(',')),
      ['TOTAL', '', totals.totalBasic, totals.totalEarnings, totals.totalGross, totals.totalDeductions, totals.totalBenefitsEE, totals.totalNet].join(',')
    ]
    const csv = csvRows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Payroll_${payroll.name}_${payroll.month}_${payroll.year}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const monthName = new Date(0, payroll.month - 1).toLocaleString('default', { month: 'long' })

  const MODES: { key: OutputMode; label: string }[] = [
    { key: 'register', label: 'Payroll Register' },
    { key: 'payslip', label: 'Payslips' },
    { key: 'transmittal', label: 'Transmittal' },
    { key: 'journal', label: 'Journal Entry' },
    { key: 'denomination', label: 'Denomination' }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{payroll.name}</h1>
          <p className="text-gray-500">{monthName} {payroll.year}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />Print
          </Button>
          <Button variant="secondary" onClick={handleExportXLS}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />Export XLS
          </Button>
          <Button variant="secondary" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />Export CSV
          </Button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {MODES.map(mode => (
          <button
            key={mode.key}
            onClick={() => setActiveMode(mode.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeMode === mode.key
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {activeMode === 'register' && (
        <Card>
          <CardHeader>
            <CardTitle>Payroll Register</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <PrintHeader />
            <table className="w-full print:text-sm">
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
                {rows.map(row => {
                  const earnings = Array.from(earningData.get(row.nameId)?.values() || []).reduce((s, v) => s + v, 0)
                  const deductions = Array.from(deductionData.get(row.nameId)?.values() || []).reduce((s, v) => s + v, 0)
                  const benefits = Array.from(benefitData.get(row.nameId)?.values() || []).reduce((s, v) => s + v.employeeShare, 0)
                  const gross = row.salaryAmount + earnings
                  const net = gross - deductions - benefits
                  return (
                    <tr key={row.nameId} className="hover:bg-gray-50">
                      <td className="px-4 py-2 sticky left-0 bg-white">
                        <div className="text-sm font-medium text-gray-900">{row.employeeCode}</div>
                        <div className="text-xs text-gray-500">{row.lastName}{row.firstName ? `, ${row.firstName}` : ''}</div>
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
                  <tr className="bg-gray-50 font-bold border-t-2 border-gray-300">
                    <td className="px-4 py-2 sticky left-0 bg-gray-50 text-sm">Total ({rows.length} employees)</td>
                    <td className="px-4 py-2 text-right text-sm">{formatCurrency(totals.totalBasic)}</td>
                    <td className="px-4 py-2 text-right text-sm text-green-600">{formatCurrency(totals.totalEarnings)}</td>
                    <td className="px-4 py-2 text-right text-sm">{formatCurrency(totals.totalGross)}</td>
                    <td className="px-4 py-2 text-right text-sm text-red-600">{formatCurrency(totals.totalDeductions)}</td>
                    <td className="px-4 py-2 text-right text-sm">{formatCurrency(totals.totalBenefitsEE)}</td>
                    <td className="px-4 py-2 text-right text-sm">{formatCurrency(totals.totalNet)}</td>
                  </tr>
                )}
                {rows.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No employees in this payroll.</td></tr>
                )}
              </tbody>
            </table>
            <PrintFooter />
          </CardContent>
        </Card>
      )}

      {activeMode === 'payslip' && (
        <div className="space-y-4">
          {selectedEmployee && (
            <Button variant="secondary" onClick={() => setSelectedEmployee(null)} className="mb-4">
              ← Back to All Payslips
            </Button>
          )}

          {selectedEmployee ? (
            <div className="max-w-2xl mx-auto">
              {rows.filter(r => r.nameId === selectedEmployee).map(row => {
                const earnings = getEmployeeEarnings(row)
                const deductions = getEmployeeDeductions(row)
                const benefits = getEmployeeBenefits(row)
                const totalEarnings = earnings.reduce((s, e) => s + e.amount, 0)
                const totalDeductions = deductions.reduce((s, d) => s + d.amount, 0)
                const totalBenefitsEE = benefits.reduce((s, b) => s + b.employeeShare, 0)
                const gross = row.salaryAmount + totalEarnings
                const net = gross - totalDeductions - totalBenefitsEE

                return (
                  <Card key={row.nameId} className="print:shadow-none">
                    <CardHeader className="border-b border-gray-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">Payslip</CardTitle>
                          <p className="text-sm text-gray-500 mt-1">{monthName} {payroll.year}</p>
                        </div>
                        <div className="text-right text-sm">
                          <div className="font-medium">{row.employeeCode}</div>
                          <div>{row.lastName}{row.firstName ? `, ${row.firstName}` : ''}</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Earnings</h3>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Basic Salary</span>
                            <span className="font-medium">{formatCurrency(row.salaryAmount)}</span>
                          </div>
                          {earnings.map(e => (
                            <div key={e.name} className="flex justify-between text-sm">
                              <span>{e.name}</span>
                              <span>{formatCurrency(e.amount)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between text-sm font-semibold pt-2 border-t border-gray-200">
                            <span>Total Earnings</span>
                            <span>{formatCurrency(row.salaryAmount + totalEarnings)}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Deductions</h3>
                        <div className="space-y-1">
                          {deductions.map(d => (
                            <div key={d.name} className="flex justify-between text-sm">
                              <span>{d.name}</span>
                              <span>{formatCurrency(d.amount)}</span>
                            </div>
                          ))}
                          {benefits.map(b => (
                            <div key={b.name} className="flex justify-between text-sm">
                              <span>{b.name} (Employee Share)</span>
                              <span>{formatCurrency(b.employeeShare)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between text-sm font-semibold pt-2 border-t border-gray-200">
                            <span>Total Deductions</span>
                            <span>{formatCurrency(totalDeductions + totalBenefitsEE)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Net Pay</span>
                          <span>{formatCurrency(net)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardHeader><CardTitle>Employee Payslips</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rows.map(row => (
                    <button
                      key={row.nameId}
                      onClick={() => setSelectedEmployee(row.nameId)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 text-left transition-colors"
                    >
                      <div className="text-sm font-medium text-gray-900">{row.employeeCode}</div>
                      <div className="text-sm text-gray-500">{row.lastName}{row.firstName ? `, ${row.firstName}` : ''}</div>
                      <div className="text-sm font-semibold text-gray-900 mt-2">
                        Net: {formatCurrency(getEmployeeNet(row))}
                      </div>
                    </button>
                  ))}
                </div>
                {rows.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No employees in this payroll.</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeMode === 'transmittal' && (
        <Card>
          <CardHeader>
            <CardTitle>Bank Transmittal List</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Employee net pay amounts for bank transfer</p>
          </CardHeader>
          <CardContent className="p-0">
            <PrintHeader />
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Employee ID</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Employee Name</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Net Pay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row, index) => (
                  <tr key={row.nameId} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-500">{index + 1}</td>
                    <td className="px-4 py-2 text-sm font-medium">{row.employeeCode}</td>
                    <td className="px-4 py-2 text-sm">{row.lastName}{row.firstName ? `, ${row.firstName}` : ''}</td>
                    <td className="px-4 py-2 text-right text-sm font-semibold">{formatCurrency(getEmployeeNet(row))}</td>
                  </tr>
                ))}
                {rows.length > 0 && (
                  <tr className="bg-gray-50 font-bold border-t-2 border-gray-300">
                    <td className="px-4 py-2" colSpan={3}>Total ({rows.length} employees)</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(totals.totalNet)}</td>
                  </tr>
                )}
                {rows.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No employees in this payroll.</td></tr>
                )}
              </tbody>
            </table>
            <PrintFooter />
          </CardContent>
        </Card>
      )}

      {activeMode === 'journal' && (
        <Card>
          <CardHeader>
            <CardTitle>Journal Entry</CardTitle>
            <p className="text-sm text-gray-500 mt-1">{monthName} {payroll.year} - Accounting summary</p>
          </CardHeader>
          <CardContent className="p-0">
            <PrintHeader />
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Account</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Debit</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm font-medium">Salaries & Wages Expense</td>
                  <td className="px-4 py-2 text-right text-sm font-semibold">{formatCurrency(totals.totalBasic)}</td>
                  <td className="px-4 py-2 text-right text-sm">-</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm font-medium">Earnings Expense</td>
                  <td className="px-4 py-2 text-right text-sm font-semibold">{formatCurrency(totals.totalEarnings)}</td>
                  <td className="px-4 py-2 text-right text-sm">-</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm font-medium">Employer Benefits Expense</td>
                  <td className="px-4 py-2 text-right text-sm font-semibold">{formatCurrency(totals.totalBenefitsER)}</td>
                  <td className="px-4 py-2 text-right text-sm">-</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm font-medium">Withholding Tax Payable</td>
                  <td className="px-4 py-2 text-right text-sm">-</td>
                  <td className="px-4 py-2 text-right text-sm">{formatCurrency(0.00)}</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm font-medium">Employee Benefits Payable</td>
                  <td className="px-4 py-2 text-right text-sm">-</td>
                  <td className="px-4 py-2 text-right text-sm">{formatCurrency(totals.totalBenefitsEE)}</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm font-medium">Other Deductions Payable</td>
                  <td className="px-4 py-2 text-right text-sm">-</td>
                  <td className="px-4 py-2 text-right text-sm">{formatCurrency(totals.totalDeductions)}</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm font-medium">Salaries & Wages Payable</td>
                  <td className="px-4 py-2 text-right text-sm">-</td>
                  <td className="px-4 py-2 text-right text-sm font-semibold">{formatCurrency(totals.totalNet)}</td>
                </tr>
                <tr className="bg-gray-50 font-bold border-t-2 border-gray-300">
                  <td className="px-4 py-2 text-sm">Total</td>
                  <td className="px-4 py-2 text-right text-sm">
                    {formatCurrency(totals.totalBasic + totals.totalEarnings + totals.totalBenefitsER)}
                  </td>
                  <td className="px-4 py-2 text-right text-sm">
                    {formatCurrency(totals.totalBenefitsEE + totals.totalDeductions + totals.totalNet)}
                  </td>
                </tr>
              </tbody>
            </table>
            <PrintFooter />
          </CardContent>
        </Card>
      )}

      {activeMode === 'denomination' && (
        <Card>
          <CardHeader>
            <CardTitle>Cash Denomination Breakdown</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Cash payout preparation</p>
          </CardHeader>
          <CardContent>
            <PrintHeader />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Denomination Count</h3>
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Denomination</th>
                      <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[1000, 500, 200, 100, 50, 20, 10, 5, 1, 0.25, 0.10, 0.05].map(denom => {
                      const count = Math.floor(totals.totalNet / denom)
                      return (
                        <tr key={denom} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm font-medium">₱{denom >= 1 ? denom.toLocaleString() : denom.toFixed(2)}</td>
                          <td className="px-4 py-2 text-right text-sm">{count}</td>
                          <td className="px-4 py-2 text-right text-sm">{formatCurrency(count * denom)}</td>
                        </tr>
                      )
                    })}
                    <tr className="bg-gray-50 font-bold border-t-2 border-gray-300">
                      <td className="px-4 py-2 text-sm">Total</td>
                      <td className="px-4 py-2 text-right text-sm"></td>
                      <td className="px-4 py-2 text-right text-sm">{formatCurrency(totals.totalNet)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Per Employee Cash Breakdown</h3>
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Employee</th>
                      <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 uppercase">Net Pay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map(row => (
                      <tr key={row.nameId} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm">
                          <div className="font-medium">{row.employeeCode}</div>
                          <div className="text-xs text-gray-500">{row.lastName}{row.firstName ? `, ${row.firstName}` : ''}</div>
                        </td>
                        <td className="px-4 py-2 text-right text-sm font-semibold">{formatCurrency(getEmployeeNet(row))}</td>
                      </tr>
                    ))}
                    {rows.length > 0 && (
                      <tr className="bg-gray-50 font-bold border-t-2 border-gray-300">
                        <td className="px-4 py-2 text-sm">Total</td>
                        <td className="px-4 py-2 text-right text-sm">{formatCurrency(totals.totalNet)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <PrintFooter />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
