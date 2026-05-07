import * as XLSX from 'xlsx'

interface ExportColumn {
  header: string
  key: string
  width?: number
}

interface ExportOptions {
  filename: string
  columns: ExportColumn[]
  includeTimestamp?: boolean
  sheetName?: string
}

export function exportToXLS<T extends Record<string, unknown>>(
  data: T[],
  options: ExportOptions
) {
  const wb = XLSX.utils.book_new()

  const formatted = data.map(row => {
    const result: Record<string, unknown> = {}
    for (const col of options.columns) {
      result[col.header] = row[col.key]
    }
    return result
  })

  const ws = XLSX.utils.json_to_sheet(formatted)
  ws['!cols'] = options.columns.map(col => ({ wch: col.width ?? 15 }))

  const sheetName = options.sheetName || 'Data'
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31))

  const timestamp = options.includeTimestamp !== false
    ? `_${new Date().toISOString().slice(0, 10)}`
    : ''
  XLSX.writeFile(wb, `${options.filename}${timestamp}.xlsx`)
}

export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[],
  filename: string
) {
  const headers = columns.map(c => c.header)
  const rows = data.map(row =>
    columns.map(col => {
      const val = row[col.key]
      if (val === null || val === undefined) return ''
      const str = String(val)
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str
    })
  )

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportToJson<T extends Record<string, unknown>>(
  data: T[],
  filename: string
) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export const employeeExportColumns: ExportColumn[] = [
  { header: 'ID', key: 'id', width: 15 },
  { header: 'Name', key: 'name', width: 25 },
  { header: 'Status', key: 'status', width: 12 },
  { header: 'Group', key: 'group', width: 20 },
  { header: 'Position', key: 'position', width: 20 },
  { header: 'Department', key: 'department', width: 20 },
  { header: 'Email', key: 'email', width: 25 },
  { header: 'Phone', key: 'phone', width: 15 },
  { header: 'Date Hired', key: 'dateHired', width: 12 },
]

export const payrollExportColumns: ExportColumn[] = [
  { header: 'ID', key: 'id', width: 15 },
  { header: 'Name', key: 'name', width: 30 },
  { header: 'Month', key: 'month', width: 10 },
  { header: 'Year', key: 'year', width: 8 },
  { header: 'Status', key: 'status', width: 12 },
  { header: 'Employees', key: 'employeeCount', width: 10 },
  { header: 'Gross Pay', key: 'grossPay', width: 15 },
  { header: 'Net Pay', key: 'netPay', width: 15 },
]

export const benefitExportColumns: ExportColumn[] = [
  { header: 'ID', key: 'id', width: 15 },
  { header: 'Name', key: 'name', width: 25 },
  { header: 'Description', key: 'description', width: 30 },
  { header: 'Active', key: 'isActive', width: 8 },
]

export const earningExportColumns: ExportColumn[] = [
  { header: 'ID', key: 'id', width: 15 },
  { header: 'Name', key: 'name', width: 25 },
  { header: 'Taxable', key: 'isTaxable', width: 8 },
  { header: 'Active', key: 'isActive', width: 8 },
]

export const deductionExportColumns: ExportColumn[] = [
  { header: 'ID', key: 'id', width: 15 },
  { header: 'Name', key: 'name', width: 25 },
  { header: 'Type', key: 'type', width: 12 },
  { header: 'Active', key: 'isActive', width: 8 },
]

export const groupExportColumns: ExportColumn[] = [
  { header: 'ID', key: 'id', width: 15 },
  { header: 'Name', key: 'name', width: 25 },
  { header: 'Description', key: 'description', width: 30 },
  { header: 'Active', key: 'isActive', width: 8 },
]

export const userExportColumns: ExportColumn[] = [
  { header: 'ID', key: 'id', width: 15 },
  { header: 'Email', key: 'email', width: 25 },
  { header: 'Display Name', key: 'displayName', width: 25 },
  { header: 'Active', key: 'isActive', width: 8 },
  { header: 'Role', key: 'role', width: 12 },
]
