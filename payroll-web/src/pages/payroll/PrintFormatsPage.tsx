import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, serverTimestamp } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useAuth } from '../../hooks/useAuth'
import { usePermissions } from '../../hooks/usePermissions'
import { useToast } from '../../components/ui/Toast'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Plus, Edit, Trash2, Copy, X, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import type { PrintFormat } from '../../types'

const WIZARD_STEPS = ['Basic Info', 'Layout', 'Header/Footer', 'Columns', 'Review']
const OUTPUT_TYPES = [
  { value: 'register', label: 'Payroll Register' },
  { value: 'payslip', label: 'Payslip' },
  { value: 'transmittal', label: 'Bank Transmittal' },
  { value: 'journal', label: 'Journal Entry' },
  { value: 'denomination', label: 'Cash Denomination' }
]
const PAPER_SIZES = ['A4', 'Letter', 'Legal']
const FONT_SIZES = [
  { value: 'xs', label: 'Extra Small' },
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' }
]
const AVAILABLE_COLUMNS = [
  { id: 'basic', label: 'Basic Salary' },
  { id: 'earnings', label: 'Earnings' },
  { id: 'gross', label: 'Gross Pay' },
  { id: 'deductions', label: 'Deductions' },
  { id: 'benefits', label: 'Benefits (EE)' },
  { id: 'net', label: 'Net Pay' },
  { id: 'daysWorked', label: 'Days Worked' },
  { id: 'absences', label: 'Absences' },
  { id: 'late', label: 'Late Hours' },
  { id: 'overtime', label: 'Overtime Hours' }
]

export function PrintFormatsPage() {
  const { currentCompanyId } = useAuth()
  const { canView, canAdd, canEdit, canDelete } = usePermissions()
  const { addToast } = useToast()
  const [formats, setFormats] = useState<PrintFormat[]>([])
  const [loading, setLoading] = useState(true)
  const [showWizard, setShowWizard] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [wizardStep, setWizardStep] = useState(0)

  const [basicForm, setBasicForm] = useState({ name: '', description: '', outputType: 'register' as PrintFormat['outputType'] })
  const [layoutForm, setLayoutForm] = useState({ paperSize: 'A4' as PrintFormat['paperSize'], orientation: 'portrait' as PrintFormat['orientation'], fontSize: 'sm' as PrintFormat['fontSize'] })
  const [headerForm, setHeaderForm] = useState({ showHeader: true, showFooter: false, headerHtml: '', footerHtml: '', showCompanyLogo: true, showCompanyName: true, showCompanyAddress: true, showCompanyTIN: true, showTitle: true, showPeriod: true, showSignatureLines: false, signatureLabels: ['Prepared by', 'Checked by', 'Approved by'] })
  const [selectedColumns, setSelectedColumns] = useState<string[]>(['basic', 'earnings', 'gross', 'deductions', 'benefits', 'net'])
  const [includeTotals, setIncludeTotals] = useState(true)

  const fetchFormats = async () => {
    setLoading(true)
    const q = currentCompanyId ? query(collection(db, 'print_formats'), where('companyId', '==', currentCompanyId)) : query(collection(db, 'print_formats'))
    const snap = await getDocs(q)
    setFormats(snap.docs.map(d => ({ id: d.id, ...d.data() })) as PrintFormat[])
    setLoading(false)
  }

  useEffect(() => { fetchFormats() }, [currentCompanyId])

  const resetWizard = () => {
    setWizardStep(0)
    setBasicForm({ name: '', description: '', outputType: 'register' })
    setLayoutForm({ paperSize: 'A4', orientation: 'portrait', fontSize: 'sm' })
    setHeaderForm({ showHeader: true, showFooter: false, headerHtml: '', footerHtml: '', showCompanyLogo: true, showCompanyName: true, showCompanyAddress: true, showCompanyTIN: true, showTitle: true, showPeriod: true, showSignatureLines: false, signatureLabels: ['Prepared by', 'Checked by', 'Approved by'] })
    setSelectedColumns(['basic', 'earnings', 'gross', 'deductions', 'benefits', 'net'])
    setIncludeTotals(true)
  }

  const openWizard = (format?: PrintFormat) => {
    resetWizard()
    if (format) {
      setEditingId(format.id)
      setBasicForm({ name: format.name, description: format.description || '', outputType: format.outputType })
      setLayoutForm({ paperSize: format.paperSize, orientation: format.orientation, fontSize: format.fontSize })
      setHeaderForm({
        showHeader: format.showHeader, showFooter: format.showFooter,
        headerHtml: format.headerHtml || '', footerHtml: format.footerHtml || '',
        showCompanyLogo: format.showCompanyLogo, showCompanyName: format.showCompanyName,
        showCompanyAddress: format.showCompanyAddress, showCompanyTIN: format.showCompanyTIN,
        showTitle: format.showTitle, showPeriod: format.showPeriod,
        showSignatureLines: format.showSignatureLines,
        signatureLabels: format.signatureLabels || ['Prepared by', 'Checked by', 'Approved by']
      })
      setSelectedColumns(format.columnOrder || ['basic', 'earnings', 'gross', 'deductions', 'benefits', 'net'])
      setIncludeTotals(format.includeTotals)
    }
    setShowWizard(true)
  }

  const handleClone = async (format: PrintFormat) => {
    const cloneData = {
      name: `${format.name} (Copy)`,
      description: format.description || '',
      companyId: currentCompanyId || format.companyId || '',
      outputType: format.outputType,
      paperSize: format.paperSize,
      orientation: format.orientation,
      fontSize: format.fontSize,
      showHeader: format.showHeader,
      showFooter: format.showFooter,
      headerHtml: format.headerHtml || null,
      footerHtml: format.footerHtml || null,
      showCompanyLogo: format.showCompanyLogo,
      showCompanyName: format.showCompanyName,
      showCompanyAddress: format.showCompanyAddress,
      showCompanyTIN: format.showCompanyTIN,
      showTitle: format.showTitle,
      showPeriod: format.showPeriod,
      showSignatureLines: format.showSignatureLines,
      signatureLabels: format.signatureLabels || [],
      columnOrder: format.columnOrder || [],
      includeTotals: format.includeTotals,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
    await addDoc(collection(db, 'print_formats'), cloneData)
    addToast({ type: 'success', title: 'Print format cloned' })
    fetchFormats()
  }

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'print_formats', id))
    addToast({ type: 'success', title: 'Print format deleted' })
    fetchFormats()
  }

  const handleSubmit = async () => {
    const data = {
      name: basicForm.name,
      description: basicForm.description,
      companyId: currentCompanyId || '',
      outputType: basicForm.outputType,
      paperSize: layoutForm.paperSize,
      orientation: layoutForm.orientation,
      fontSize: layoutForm.fontSize,
      showHeader: headerForm.showHeader,
      showFooter: headerForm.showFooter,
      headerHtml: headerForm.headerHtml || null,
      footerHtml: headerForm.footerHtml || null,
      showCompanyLogo: headerForm.showCompanyLogo,
      showCompanyName: headerForm.showCompanyName,
      showCompanyAddress: headerForm.showCompanyAddress,
      showCompanyTIN: headerForm.showCompanyTIN,
      showTitle: headerForm.showTitle,
      showPeriod: headerForm.showPeriod,
      showSignatureLines: headerForm.showSignatureLines,
      signatureLabels: headerForm.signatureLabels,
      columnOrder: selectedColumns,
      includeTotals,
      isActive: true,
      updatedAt: serverTimestamp()
    }

    if (editingId) {
      await updateDoc(doc(db, 'print_formats', editingId), data)
      addToast({ type: 'success', title: 'Print format updated' })
    } else {
      await addDoc(collection(db, 'print_formats'), { ...data, createdAt: serverTimestamp() })
      addToast({ type: 'success', title: 'Print format created' })
    }
    setShowWizard(false)
    setEditingId(null)
    resetWizard()
    fetchFormats()
  }

  const toggleItem = (list: string[], id: string, setter: (l: string[]) => void) => {
    setter(list.includes(id) ? list.filter(i => i !== id) : [...list, id])
  }

  const canProceed = () => {
    if (wizardStep === 0) return basicForm.name.trim().length > 0
    return true
  }

  if (!canView('payroll', 'templates')) return <div className="text-center py-12 text-gray-500">Access denied</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Print Format Templates</h1>
          <p className="text-gray-500 mt-1">Configure print layouts for payroll output views</p>
        </div>
        {canAdd('payroll', 'templates') && (
          <Button onClick={() => openWizard()}><Plus className="w-4 h-4 mr-2" />New Print Format</Button>
        )}
      </div>

      {showWizard && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{editingId ? 'Edit' : 'Create'} Print Format</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => { setShowWizard(false); setEditingId(null); resetWizard() }}><X className="w-4 h-4" /></Button>
            </div>
            <div className="flex items-center gap-2 mt-4">
              {WIZARD_STEPS.map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button onClick={() => i <= wizardStep && setWizardStep(i)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${i === wizardStep ? 'bg-primary-600 text-white' : i < wizardStep ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {i < wizardStep ? <Check className="w-3 h-3" /> : <span className="w-4 h-4 flex items-center justify-center">{i + 1}</span>}
                    <span className="hidden sm:inline">{step}</span>
                  </button>
                  {i < WIZARD_STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-gray-400" />}
                </div>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {wizardStep === 0 && (
              <div className="space-y-4 max-w-lg">
                <Input id="name" label="Format Name" value={basicForm.name} onChange={(e) => setBasicForm({ ...basicForm, name: e.target.value })} required />
                <Input id="description" label="Description" value={basicForm.description} onChange={(e) => setBasicForm({ ...basicForm, description: e.target.value })} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Output Type</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" value={basicForm.outputType} onChange={(e) => setBasicForm({ ...basicForm, outputType: e.target.value as PrintFormat['outputType'] })}>
                    {OUTPUT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
            )}

            {wizardStep === 1 && (
              <div className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paper Size</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" value={layoutForm.paperSize} onChange={(e) => setLayoutForm({ ...layoutForm, paperSize: e.target.value as PrintFormat['paperSize'] })}>
                    {PAPER_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Orientation</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" value={layoutForm.orientation} onChange={(e) => setLayoutForm({ ...layoutForm, orientation: e.target.value as PrintFormat['orientation'] })}>
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" value={layoutForm.fontSize} onChange={(e) => setLayoutForm({ ...layoutForm, fontSize: e.target.value as PrintFormat['fontSize'] })}>
                    {FONT_SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <ToggleField label="Show Header" checked={headerForm.showHeader} onChange={(v) => setHeaderForm({ ...headerForm, showHeader: v })} />
                  <ToggleField label="Show Footer" checked={headerForm.showFooter} onChange={(v) => setHeaderForm({ ...headerForm, showFooter: v })} />
                  <ToggleField label="Company Logo" checked={headerForm.showCompanyLogo} onChange={(v) => setHeaderForm({ ...headerForm, showCompanyLogo: v })} />
                  <ToggleField label="Company Name" checked={headerForm.showCompanyName} onChange={(v) => setHeaderForm({ ...headerForm, showCompanyName: v })} />
                  <ToggleField label="Company Address" checked={headerForm.showCompanyAddress} onChange={(v) => setHeaderForm({ ...headerForm, showCompanyAddress: v })} />
                  <ToggleField label="Company TIN" checked={headerForm.showCompanyTIN} onChange={(v) => setHeaderForm({ ...headerForm, showCompanyTIN: v })} />
                  <ToggleField label="Report Title" checked={headerForm.showTitle} onChange={(v) => setHeaderForm({ ...headerForm, showTitle: v })} />
                  <ToggleField label="Payroll Period" checked={headerForm.showPeriod} onChange={(v) => setHeaderForm({ ...headerForm, showPeriod: v })} />
                  <ToggleField label="Signature Lines" checked={headerForm.showSignatureLines} onChange={(v) => setHeaderForm({ ...headerForm, showSignatureLines: v })} />
                </div>
                {headerForm.showSignatureLines && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Signature Labels (comma-separated)</label>
                    <Input id="sigLabels" value={headerForm.signatureLabels.join(', ')} onChange={(e) => setHeaderForm({ ...headerForm, signatureLabels: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
                  </div>
                )}
                {headerForm.showHeader && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Custom Header HTML (optional)</label>
                    <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono" rows={3} value={headerForm.headerHtml} onChange={(e) => setHeaderForm({ ...headerForm, headerHtml: e.target.value })} placeholder="<div>Custom header content...</div>" />
                  </div>
                )}
                {headerForm.showFooter && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Custom Footer HTML (optional)</label>
                    <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono" rows={3} value={headerForm.footerHtml} onChange={(e) => setHeaderForm({ ...headerForm, footerHtml: e.target.value })} placeholder="<div>Custom footer content...</div>" />
                  </div>
                )}
              </div>
            )}

            {wizardStep === 3 && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">Select and order columns for register output. Drag not supported - order is saved as listed.</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {AVAILABLE_COLUMNS.map(col => (
                    <button key={col.id} onClick={() => toggleItem(selectedColumns, col.id, setSelectedColumns)} className={`flex items-center gap-2 p-3 border rounded-lg text-sm transition-colors ${selectedColumns.includes(col.id) ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      {selectedColumns.includes(col.id) ? <Check className="w-4 h-4" /> : <div className="w-4 h-4 border rounded" />}
                      {col.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <input type="checkbox" id="includeTotals" checked={includeTotals} onChange={(e) => setIncludeTotals(e.target.checked)} className="rounded border-gray-300" />
                  <label htmlFor="includeTotals" className="text-sm text-gray-700">Include totals row</label>
                </div>
              </div>
            )}

            {wizardStep === 4 && (
              <div className="space-y-6">
                <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <h3 className="font-medium">Format Summary</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-gray-500">Name:</span><span className="font-medium">{basicForm.name}</span>
                    <span className="text-gray-500">Output Type:</span><span className="capitalize">{OUTPUT_TYPES.find(t => t.value === basicForm.outputType)?.label}</span>
                    <span className="text-gray-500">Paper:</span><span>{layoutForm.paperSize} {layoutForm.orientation}</span>
                    <span className="text-gray-500">Font Size:</span><span className="capitalize">{layoutForm.fontSize}</span>
                    <span className="text-gray-500">Header:</span><span>{headerForm.showHeader ? 'Yes' : 'No'}</span>
                    <span className="text-gray-500">Footer:</span><span>{headerForm.showFooter ? 'Yes' : 'No'}</span>
                    <span className="text-gray-500">Signature Lines:</span><span>{headerForm.showSignatureLines ? `${headerForm.signatureLabels.length} labels` : 'No'}</span>
                    <span className="text-gray-500">Columns:</span><span>{selectedColumns.length} selected</span>
                    <span className="text-gray-500">Totals:</span><span>{includeTotals ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-6 pt-4 border-t">
              <Button variant="ghost" disabled={wizardStep === 0} onClick={() => setWizardStep(s => s - 1)}><ChevronLeft className="w-4 h-4 mr-2" />Previous</Button>
              {wizardStep < 4 ? (
                <Button disabled={!canProceed()} onClick={() => setWizardStep(s => s + 1)}>Next<ChevronRight className="w-4 h-4 ml-2" /></Button>
              ) : (
                <Button onClick={handleSubmit}>{editingId ? 'Update' : 'Create'} Format<Check className="w-4 h-4 ml-2" /></Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card><CardContent className="p-0">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Output Type</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Paper</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Columns</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
              : formats.length === 0 ? <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No print formats found</td></tr>
              : formats.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{f.name}</div>
                    {f.description && <div className="text-xs text-gray-500">{f.description}</div>}
                  </td>
                  <td className="px-6 py-4 text-sm capitalize text-gray-500">{OUTPUT_TYPES.find(t => t.value === f.outputType)?.label || f.outputType}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{f.paperSize} {f.orientation}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{f.columnOrder?.length || 0} columns</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {canAdd('payroll', 'templates') && <Button variant="ghost" size="sm" onClick={() => handleClone(f)} title="Clone"><Copy className="w-4 h-4" /></Button>}
                      {canEdit('payroll', 'templates') && <Button variant="ghost" size="sm" onClick={() => openWizard(f)}><Edit className="w-4 h-4" /></Button>}
                      {canDelete('payroll', 'templates') && (
                        <ConfirmDialog title="Delete Print Format" message={`Delete "${f.name}"?`} confirmText="Delete" onConfirm={() => handleDelete(f.id)}>
                          {(open) => <Button variant="ghost" size="sm" onClick={open}><Trash2 className="w-4 h-4" /></Button>}
                        </ConfirmDialog>
                      )}
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

function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  )
}
