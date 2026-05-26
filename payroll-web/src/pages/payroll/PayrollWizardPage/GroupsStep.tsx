import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import type { PayrollGroup, EmployeeGroup, EmployeePosition, EmployeeArea, EmployeeStatus } from './PayrollWizardPage.types';

interface GroupsStepProps {
  groups: PayrollGroup[];
  onAddGroup: (group: PayrollGroup) => void;
  onRemoveGroup: (index: number) => void;
  onNext: () => void;
  onBack: () => void;
  loading: boolean;
  lookups: {
    groups: EmployeeGroup[];
    positions: EmployeePosition[];
    areas: EmployeeArea[];
    statuses: EmployeeStatus[];
  };
}

function GroupForm({
  onAdd,
  lookups,
}: {
  onAdd: (group: PayrollGroup) => void;
  lookups: {
    groups: EmployeeGroup[];
    positions: EmployeePosition[];
    areas: EmployeeArea[];
    statuses: EmployeeStatus[];
  };
}) {
  const [groupId, setGroupId] = useState('');
  const [positionId, setPositionId] = useState('');
  const [areaId, setAreaId] = useState('');
  const [statusId, setStatusId] = useState('');

  const handleAdd = () => {
    if (groupId || positionId || areaId || statusId) {
      onAdd({
        id: '',
        payrollId: '',
        groupId,
        positionId,
        areaId,
        statusId,
        order: 0,
        page: 1,
      });
      setGroupId('');
      setPositionId('');
      setAreaId('');
      setStatusId('');
    }
  };

  return (
    <div className="flex gap-2 flex-wrap">
      <select
        value={groupId}
        onChange={(e) => setGroupId(e.target.value)}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm"
      >
        <option value="">Any Group</option>
        {lookups.groups.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </select>
      <select
        value={positionId}
        onChange={(e) => setPositionId(e.target.value)}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm"
      >
        <option value="">Any Position</option>
        {lookups.positions.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <select
        value={areaId}
        onChange={(e) => setAreaId(e.target.value)}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm"
      >
        <option value="">Any Area</option>
        {lookups.areas.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
      <select
        value={statusId}
        onChange={(e) => setStatusId(e.target.value)}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm"
      >
        <option value="">Any Status</option>
        {lookups.statuses.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <Button
        onClick={handleAdd}
        disabled={!groupId && !positionId && !areaId && !statusId}
      >
        Add Filter
      </Button>
    </div>
  );
}

export function GroupsStep({
  groups,
  onAddGroup,
  onRemoveGroup,
  onNext,
  onBack,
  loading,
  lookups,
}: GroupsStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Employee Groups</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <GroupForm onAdd={onAddGroup} lookups={lookups} />
        <div className="space-y-2">
          {groups.map((g, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
            >
              <span className="text-sm">
                Group: {g.groupId || 'All'} | Position:{' '}
                {g.positionId || 'All'} | Area: {g.areaId || 'All'} |
                Status: {g.statusId || 'All'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveGroup(i)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {groups.length === 0 && (
            <p className="text-sm text-gray-500">
              No groups added. Add filters or leave empty to include all
              employees.
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} disabled={loading}>
          Next
        </Button>
      </CardFooter>
    </Card>
  );
}
