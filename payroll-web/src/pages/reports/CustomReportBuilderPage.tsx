import { useState } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useCompany } from '../../context/CompanyContext'
import type { Employee, Payroll, PayrollEmployee } from '../../types'
import { exportToXlsx } from '../../utils/exportUtils'

interface ReportField {
  id: string
  label: string
  category: 'employee' | 'payroll' | 'earnings' | 'deductions' | 'benefits'
  type: 'string' | 'number' | 'date'
  enabled: boolean
}

interface ReportFilter {
  field: string
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between'
  value: string
  value2?: string
}

interface SavedReport {
  id: string
  name: string
  description?: string
  fields: string[]
  filters: ReportFilter[]
  groupBy?: string
  sortBy?: string
  sortDirection: 'asc' | 'desc'
  createdAt: Date
}

const AVAILABLE_FIELDS: ReportField[] = [
  // Employee fields
  { id: 'emp_code', label: 'Employee Code', category: 'employee', type: 'string', enabled: true },
  { id: 'emp_name', label: 'Employee Name', category: 'employee', type: 'string', enabled: true },
  { id: 'emp_group', label: 'Group', category: 'employee', type: 'string', enabled: false },
  { id: 'emp_position', label: 'Position', category: 'employee', type: 'string', enabled: false },
  { id: 'emp_area', label: 'Area', category: 'employee', type: 'string', enabled: false },

  // Payroll fields
  { id: 'payroll_name', label: 'Payroll', category: 'payroll', type: 'string', enabled: true },
  { id: 'payroll_period', label: 'Period', category: 'payroll', type: 'string', enabled: false },
  { id: 'days_worked', label: 'Days Worked', category: 'payroll', type: 'number', enabled: false },
  { id: 'absences', label: 'Absences', category: 'payroll', type: 'number', enabled: false },
  { id: 'late_hours', label: 'Late Hours', category: 'payroll', type: 'number', enabled: false },
  { id: 'overtime_hours', label: 'Overtime', category: 'payroll', type: 'number', enabled: false },

  // Earnings
  { id: 'basic_salary', label: 'Basic Salary', category: 'earnings', type: 'number', enabled: true },
  { id: 'gross_pay', label: 'Gross Pay', category: 'earnings', type: 'number', enabled: true },

  // Deductions
  { id: 'total_deductions', label: 'Total Deductions', category: 'deductions', type: 'number', enabled: false },

  // Benefits
  { id: 'employee_benefits', label: 'EE Benefits', category: 'benefits', type: 'number', enabled: false },
  { id: 'employer_benefits', label: 'ER Benefits', category: 'benefits', type: 'number', enabled: false },

  // Summary
  { id: 'net_pay', label: 'Net Pay', category: 'payroll', type: 'number', enabled: true },
]

export default function CustomReportBuilderPage() {
  const { currentCompanyId } = useCompany()
  const [reportName, setReportName] = useState('')
  const [selectedFields, setSelectedFields] = useState<string[]>(['emp_name', 'emp_code', 'basic_salary', 'gross_pay', 'net_pay'])
  const [filters, setFilters] = useState<ReportFilter[]>([])
  const [groupBy, setGroupBy] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('emp_name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [isGenerating, setIsGenerating] = useState(false)
  const [previewData, setPreviewData] = useState<Record<string, unknown>[]>([])
  const [savedReports, setSavedReports] = useState<SavedReport[]>([])
  const [activeTab, setActiveTab] = useState<'builder' | 'saved' | 'preview'>('builder')

  const categories = ['employee', 'payroll', 'earnings', 'deductions', 'benefits'] as const

  const toggleField = (fieldId: string) => {
    setSelectedFields(prev =>
      prev.includes(fieldId)
        ? prev.filter(f => f !== fieldId)
        : [...prev, fieldId]
    )
  }

  const addFilter = () => {
    setFilters(prev => [...prev, { field: 'emp_name', operator: 'contains', value: '' }])
  }

  const updateFilter = (index: number, updates: Partial<ReportFilter>) => {
    setFilters(prev => prev.map((f, i) => i === index ? { ...f, ...updates } : f))
  }

  const removeFilter = (index: number) => {
    setFilters(prev => prev.filter((_, i) => i !== index))
  }

  const generateReport = async () => {
    if (!currentCompanyId || selectedFields.length === 0) return

    setIsGenerating(true)
    try {
      // Fetch data
      const [employeesSnap, payrollsSnap, payrollEmpsSnap] = await Promise.all([
        getDocs(query(collection(db, 'employees'), where('companyId', '==', currentCompanyId))),
        getDocs(query(collection(db, 'payrolls'), where('companyId', '==', currentCompanyId))),
        getDocs(query(collection(db, 'payroll_employees'), where('companyId', '==', currentCompanyId))),
      ])

      const employees = employeesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Employee[]
      const payrolls = payrollsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Payroll[]
      const payrollEmps = payrollEmpsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as PayrollEmployee[]

      // Build report data
      let data = payrollEmps.map(pe => {
        const emp = employees.find(e => e.nameId === pe.nameId)
        const payroll = payrolls.find(p => p.id === pe.payrollId)

        return {
          emp_code: emp?.employeeCode || '',
          emp_name: '', // Would need name lookup
          payroll_name: payroll?.name || '',
          basic_salary: pe.basicSalary || 0,
          gross_pay: pe.grossPay || 0,
          net_pay: pe.netPay || 0,
          days_worked: pe.daysWorked || 0,
          absences: pe.absences || 0,
          late_hours: pe.lateHours || 0,
          overtime_hours: pe.overtimeHours || 0,
        }
      })

      // Apply filters
      filters.forEach(filter => {
        data = data.filter(row => {
          const value = row[filter.field as keyof typeof row]
          if (filter.operator === 'contains') {
            return String(value).toLowerCase().includes(filter.value.toLowerCase())
          }
          if (filter.operator === 'equals') {
            return String(value) === filter.value
          }
          if (filter.operator === 'greater_than') {
            return Number(value) > Number(filter.value)
          }
          if (filter.operator === 'less_than') {
            return Number(value) < Number(filter.value)
          }
          return true
        })
      })

      // Apply sorting
      if (sortBy) {
        data.sort((a, b) => {
          const aVal = a[sortBy as keyof typeof a]
          const bVal = b[sortBy as keyof typeof b]
          const direction = sortDirection === 'asc' ? 1 : -1

          if (typeof aVal === 'number' && typeof bVal === 'number') {
            return (aVal - bVal) * direction
          }
          return String(aVal).localeCompare(String(bVal)) * direction
        })
      }

      // Apply grouping
      if (groupBy) {
        const grouped = data.reduce((acc, row) => {
          const key = String(row[groupBy as keyof typeof row] || 'Unknown')
          if (!acc[key]) acc[key] = []
          acc[key].push(row)
          return acc
        }, {} as Record<string, typeof data>)

        data = Object.entries(grouped).flatMap(([key, rows]) => [
          { __isGroupHeader: true, __groupKey: key },
          ...rows,
        ])
      }

      setPreviewData(data)
      setActiveTab('preview')
    } catch (error) {
      console.error('Failed to generate report:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const exportReport = () => {
    const columns = selectedFields
      .map(fieldId => AVAILABLE_FIELDS.find(f => f.id === fieldId))
      .filter(Boolean)
      .map(f => ({
        header: f!.label,
        key: f!.id,
        width: 15,
      }))

    exportToXlsx(
      previewData.filter(row => !row.__isGroupHeader),
      columns,
      `custom_report_${new Date().toISOString().split('T')[0]}`,
      'Custom Report'
    )
  }

  const saveReport = () => {
    if (!reportName) return

    const newReport: SavedReport = {
      id: `report_${Date.now()}`,
      name: reportName,
      fields: selectedFields,
      filters,
      groupBy,
      sortBy,
      sortDirection,
      createdAt: new Date(),
    }

    setSavedReports(prev => [...prev, newReport])
    setReportName('')
  }

  const loadReport = (report: SavedReport) => {
    setSelectedFields(report.fields)
    setFilters(report.filters)
    setGroupBy(report.groupBy || '')
    setSortBy(report.sortBy || '')
    setSortDirection(report.sortDirection)
    setActiveTab('builder')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Custom Report Builder</h1>
        <p className="text-gray-600">Build custom reports with selected fields and filters</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex gap-6">
          {(['builder', 'saved', 'preview'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Builder Tab */}
      {activeTab === 'builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Fields Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-3">Report Fields</h3>
              {categories.map(category => (
                <div key={category} className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 capitalize">
                    {category}
                  </h4>
                  {AVAILABLE_FIELDS.filter(f => f.category === category).map(field => (
                    <label key={field.id} className="flex items-center gap-2 mb-1">
                      <input
                        type="checkbox"
                        checked={selectedFields.includes(field.id)}
                        onChange={() => toggleField(field.id)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{field.label}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Report Name */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-3">Report Configuration</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Report Name</label>
                <input
                  type="text"
                  value={reportName}
                  onChange={e => setReportName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="My Custom Report"
                />
              </div>

              {/* Sorting */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">None</option>
                    {AVAILABLE_FIELDS.map(f => (
                      <option key={f.id} value={f.id}>{f.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Direction</label>
                  <select
                    value={sortDirection}
                    onChange={e => setSortDirection(e.target.value as 'asc' | 'desc')}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                </div>
              </div>

              {/* Grouping */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Group By (Optional)</label>
                <select
                  value={groupBy}
                  onChange={e => setGroupBy(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">No Grouping</option>
                  {AVAILABLE_FIELDS.filter(f => f.type === 'string').map(f => (
                    <option key={f.id} value={f.id}>{f.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">Filters</h3>
                <button
                  onClick={addFilter}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  + Add Filter
                </button>
              </div>

              {filters.map((filter, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 mb-3 items-end">
                  <div className="col-span-4">
                    <label className="block text-xs text-gray-600 mb-1">Field</label>
                    <select
                      value={filter.field}
                      onChange={e => updateFilter(index, { field: e.target.value })}
                      className="w-full px-2 py-1 border rounded text-sm"
                    >
                      {AVAILABLE_FIELDS.map(f => (
                        <option key={f.id} value={f.id}>{f.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs text-gray-600 mb-1">Operator</label>
                    <select
                      value={filter.operator}
                      onChange={e => updateFilter(index, { operator: e.target.value as ReportFilter['operator'] })}
                      className="w-full px-2 py-1 border rounded text-sm"
                    >
                      <option value="contains">Contains</option>
                      <option value="equals">Equals</option>
                      <option value="greater_than">Greater Than</option>
                      <option value="less_than">Less Than</option>
                      <option value="between">Between</option>
                    </select>
                  </div>
                  <div className="col-span-4">
                    <label className="block text-xs text-gray-600 mb-1">Value</label>
                    <input
                      type="text"
                      value={filter.value}
                      onChange={e => updateFilter(index, { value: e.target.value })}
                      className="w-full px-2 py-1 border rounded text-sm"
                      placeholder="Enter value"
                    />
                  </div>
                  <div className="col-span-1">
                    <button
                      onClick={() => removeFilter(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={generateReport}
                disabled={isGenerating || selectedFields.length === 0}
                className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {isGenerating ? 'Generating...' : 'Generate Report'}
              </button>
              <button
                onClick={saveReport}
                disabled={!reportName}
                className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Save Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved Reports Tab */}
      {activeTab === 'saved' && (
        <div className="bg-white rounded-lg shadow">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3">Report Name</th>
                <th className="text-left px-6 py-3">Fields</th>
                <th className="text-left px-6 py-3">Created</th>
                <th className="text-right px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {savedReports.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-500">
                    No saved reports yet
                  </td>
                </tr>
              ) : (
                savedReports.map(report => (
                  <tr key={report.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">{report.name}</td>
                    <td className="px-6 py-4">{report.fields.length} fields</td>
                    <td className="px-6 py-4">{report.createdAt.toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => loadReport(report)}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        Load
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Preview Tab */}
      {activeTab === 'preview' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Report Preview</h3>
            <button
              onClick={exportReport}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Export to Excel
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {selectedFields.map(fieldId => {
                    const field = AVAILABLE_FIELDS.find(f => f.id === fieldId)
                    return (
                      <th key={fieldId} className="text-left px-4 py-3 text-sm font-medium">
                        {field?.label}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {previewData.length === 0 ? (
                  <tr>
                    <td colSpan={selectedFields.length} className="text-center py-8 text-gray-500">
                      No data to display. Generate a report first.
                    </td>
                  </tr>
                ) : (
                  previewData.map((row, index) => (
                    <tr key={index} className={`border-b ${row.__isGroupHeader ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50'}`}>
                      {row.__isGroupHeader ? (
                        <td colSpan={selectedFields.length} className="px-4 py-2">
                          {row.__groupKey}
                        </td>
                      ) : (
                        selectedFields.map(fieldId => (
                          <td key={fieldId} className="px-4 py-3 text-sm">
                            {String(row[fieldId as keyof typeof row] || '')}
                          </td>
                        ))
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
