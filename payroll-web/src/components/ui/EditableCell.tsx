import { useState, memo } from 'react'

interface EditableCellProps {
  value: string | number
  onChange: (value: string) => void
  type?: 'text' | 'number'
  className?: string
}

export const EditableCell = memo(function EditableCell({ value, onChange, type = 'text', className }: EditableCellProps) {
  const [editing, setEditing] = useState(false)
  const [localValue, setLocalValue] = useState(String(value))

  if (editing) {
    return (
      <input
        type={type}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={() => { setEditing(false); onChange(localValue) }}
        onKeyDown={(e) => { if (e.key === 'Enter') { setEditing(false); onChange(localValue) } }}
        className="w-full px-2 py-1 text-sm border border-primary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
        autoFocus
      />
    )
  }

  return (
    <div
      onClick={() => { setEditing(true); setLocalValue(String(value)) }}
      className={`px-2 py-1 text-sm rounded cursor-text hover:bg-primary-50 ${className || ''}`}
    >
      {type === 'number' ? Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value}
    </div>
  )
})
