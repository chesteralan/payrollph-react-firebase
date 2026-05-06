import { useState, useEffect, useRef } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { usePermissions } from '../../hooks/usePermissions'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Plus, Edit, Trash2, Upload, X, Check, AlertCircle, Download } from 'lucide-react'

interface NameRecord {
  id: string
  firstName: string
  middleName?: string
  lastName: string
  suffix?: string
}

interface CsvPreviewRow {
  firstName: string
  middleName: string
  lastName: string
  suffix: string
  isValid: boolean
  error?: string
}

export function NamesListPage() {
  const { canView, canAdd, canEdit, canDelete } = usePermissions()
  const [names, setNames] = useState<NameRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ firstName: '', middleName: '', lastName: '', suffix: '' })
  const [showImport, setShowImport] = useState(false)
  const [csvPreview, setCsvPreview] = useState<CsvPreviewRow[]>([])
  const [csvFileName, setCsvFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const [importStats, setImportStats] = useState<{ success: number; failed: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { fetchNames() }, [])

  const fetchNames = async () => {
    setLoading(true)
    const snap = await getDocs(collection(db, 'names'))
    setNames(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as NameRecord[])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) { await updateDoc(doc(db, 'names', editingId), formData) }
    else { await addDoc(collection(db, 'names'), formData) }
    setShowForm(false); setEditingId(null); setFormData({ firstName: '', middleName: '', lastName: '', suffix: '' }); fetchNames()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this name record?')) { await deleteDoc(doc(db, 'names', id)); fetchNames() }
  }

  const handleExportCSV = () => {
    const headers = ['First Name', 'Middle Name', 'Last Name', 'Suffix']
    const csvRows = [headers.join(',')]
    for (const n of names) {
      csvRows.push([n.firstName, n.middleName || '', n.lastName, n.suffix || ''].join(','))
    }
    const csv = csvRows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `NamesList_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvFileName(file.name)
    setImportStats(null)

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const lines = text.split('\n').filter(line => line.trim())

      // Skip header row if it looks like headers
      const startIndex = lines[0].toLowerCase().includes('first') || lines[0].toLowerCase().includes('name') ? 1 : 0

      const preview: CsvPreviewRow[] = []
      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        // Handle both comma and tab separated
        const columns = line.includes('\t') ? line.split('\t') : line.split(',').map(c => c.trim())

        let firstName = '', middleName = '', lastName = '', suffix = ''
        let isValid = true
        let error = ''

        if (columns.length >= 2) {
          firstName = columns[0] || ''
          lastName = columns[1] || ''
          if (columns.length >= 3) middleName = columns[2] || ''
          if (columns.length >= 4) suffix = columns[3] || ''

          if (!firstName || !lastName) {
            isValid = false
            error = 'First and Last name required'
          }
        } else {
          // Try to parse "LastName, FirstName MiddleName" format
          const parts = line.split(',')
          if (parts.length >= 2) {
            lastName = parts[0].trim()
            const nameParts = parts[1].trim().split(' ')
            firstName = nameParts[0] || ''
            middleName = nameParts.slice(1).join(' ')
          } else {
            isValid = false
            error = 'Invalid format'
          }
        }

        preview.push({ firstName, middleName, lastName, suffix, isValid, error })
      }

      setCsvPreview(preview)
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    const validRows = csvPreview.filter(row => row.isValid)
    if (validRows.length === 0) return

    setImporting(true)
    let success = 0
    let failed = 0

    for (const row of validRows) {
      try {
        await addDoc(collection(db, 'names'), {
          firstName: row.firstName,
          middleName: row.middleName || undefined,
          lastName: row.lastName,
          suffix: row.suffix || undefined,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        success++
      } catch {
        failed++
      }
    }

    setImportStats({ success, failed })
    setImporting(false)
    fetchNames()
  }

  const resetImport = () => {
    setShowImport(false)
    setCsvPreview([])
    setCsvFileName('')
    setImportStats(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (!canView('lists', 'names')) return <div className="text-center py-12 text-gray-500">Access denied</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Names List</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />Export CSV
          </Button>
          <Button variant="secondary" onClick={() => setShowImport(true)}>
            <Upload className="w-4 h-4 mr-2" />Import CSV
          </Button>
          {canAdd('lists', 'names') && (
            <Button onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-2" />Add Name</Button>
          )}
        </div>
      </div>

      {showImport && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Import Names from CSV</CardTitle>
              <Button variant="ghost" size="sm" onClick={resetImport}><X className="w-4 h-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!csvPreview.length && !importStats && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600 mb-2">Upload a CSV file with names</p>
                <p className="text-xs text-gray-500 mb-4">
                  Format: firstName, lastName, middleName, suffix (or lastName, firstName middleName)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                  Select File
                </Button>
              </div>
            )}

            {csvFileName && csvPreview.length > 0 && !importStats && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-600">
                    File: <span className="font-medium">{csvFileName}</span>
                    <span className="ml-2">({csvPreview.length} rows found)</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-sm text-green-600">
                      {csvPreview.filter(r => r.isValid).length} valid
                    </span>
                    <span className="text-sm text-red-600">
                      {csvPreview.filter(r => !r.isValid).length} invalid
                    </span>
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2">#</th>
                        <th className="text-left px-3 py-2">First Name</th>
                        <th className="text-left px-3 py-2">Middle Name</th>
                        <th className="text-left px-3 py-2">Last Name</th>
                        <th className="text-left px-3 py-2">Suffix</th>
                        <th className="text-left px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {csvPreview.map((row, index) => (
                        <tr key={index} className={row.isValid ? '' : 'bg-red-50'}>
                          <td className="px-3 py-2 text-gray-500">{index + 1}</td>
                          <td className="px-3 py-2">{row.firstName}</td>
                          <td className="px-3 py-2">{row.middleName}</td>
                          <td className="px-3 py-2">{row.lastName}</td>
                          <td className="px-3 py-2">{row.suffix}</td>
                          <td className="px-3 py-2">
                            {row.isValid ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <span className="flex items-center gap-1 text-red-600 text-xs">
                                <AlertCircle className="w-3 h-3" />{row.error}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="ghost" onClick={resetImport}>Cancel</Button>
                  <Button
                    onClick={handleImport}
                    disabled={importing || csvPreview.filter(r => r.isValid).length === 0}
                  >
                    {importing ? 'Importing...' : `Import ${csvPreview.filter(r => r.isValid).length} Names`}
                  </Button>
                </div>
              </div>
            )}

            {importStats && (
              <div className="text-center py-8">
                <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Import Complete</h3>
                <p className="text-gray-600 mb-4">
                  Successfully imported <span className="font-medium text-green-600">{importStats.success}</span> names
                  {importStats.failed > 0 && (
                    <span>, <span className="font-medium text-red-600">{importStats.failed}</span> failed</span>
                  )}
                </p>
                <Button onClick={resetImport}>Done</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editingId ? 'Edit' : 'Add'} Name</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input id="firstName" label="First Name" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required />
                <Input id="middleName" label="Middle Name" value={formData.middleName} onChange={(e) => setFormData({ ...formData, middleName: e.target.value })} />
                <Input id="lastName" label="Last Name" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required />
                <Input id="suffix" label="Suffix" value={formData.suffix} onChange={(e) => setFormData({ ...formData, suffix: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <Button type="submit">{editingId ? 'Update' : 'Create'}</Button>
                <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setEditingId(null) }}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      <Card><CardContent className="p-0">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? <tr><td colSpan={2} className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
              : names.length === 0 ? <tr><td colSpan={2} className="px-6 py-4 text-center text-gray-500">No names found</td></tr>
              : names.map((n) => (
                <tr key={n.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {n.firstName} {n.middleName || ''} {n.lastName}{n.suffix ? `, ${n.suffix}` : ''}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {canEdit('lists', 'names') && <Button variant="ghost" size="sm" onClick={() => { setEditingId(n.id); setFormData({ firstName: n.firstName, middleName: n.middleName || '', lastName: n.lastName, suffix: n.suffix || '' }); setShowForm(true) }}><Edit className="w-4 h-4" /></Button>}
                      {canDelete('lists', 'names') && <Button variant="ghost" size="sm" onClick={() => handleDelete(n.id)}><Trash2 className="w-4 h-4" /></Button>}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </CardContent></Card>
    </div>
  )
}
