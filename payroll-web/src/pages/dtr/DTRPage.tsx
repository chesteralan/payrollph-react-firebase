import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { usePermissions } from '../../hooks/usePermissions'
import { Clock, Timer, Sun } from 'lucide-react'

export function DTRPage() {
  const { canView } = usePermissions()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  if (!canView('employees', 'calendar')) return <div className="text-center py-12 text-gray-500">Access denied</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Daily Time Record</h1>
      <Card>
        <CardHeader><CardTitle>Filter</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input id="date" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            <Button>Search</Button>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Clock className="w-8 h-8 text-blue-500" /><div><p className="text-sm text-gray-500">Time In</p><p className="text-xl font-bold">--:--</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Clock className="w-8 h-8 text-red-500" /><div><p className="text-sm text-gray-500">Time Out</p><p className="text-xl font-bold">--:--</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Timer className="w-8 h-8 text-green-500" /><div><p className="text-sm text-gray-500">Hours Worked</p><p className="text-xl font-bold">0.0</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Sun className="w-8 h-8 text-yellow-500" /><div><p className="text-sm text-gray-500">Overtime</p><p className="text-xl font-bold">0.0</p></div></div></CardContent></Card>
      </div>
    </div>
  )
}
