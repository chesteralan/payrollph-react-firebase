import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Department, Section } from "@/types";

interface BulkActionBarProps {
  selectedCount: number;
  bulkLoading: boolean;
  canEdit: (department: Department, section: Section) => boolean;
  canDelete: (department: Department, section: Section) => boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  onDelete: () => void;
  onClearSelection: () => void;
}

export function BulkActionBar({
  selectedCount,
  bulkLoading,
  canEdit,
  canDelete,
  onActivate,
  onDeactivate,
  onDelete,
  onClearSelection,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
      <span className="text-sm text-blue-800">
        {selectedCount} user{selectedCount !== 1 ? "s" : ""} selected
      </span>
      <div className="flex gap-2">
        {canEdit("system", "users") && (
          <>
            <Button
              size="sm"
              onClick={onActivate}
              disabled={bulkLoading}
            >
              Activate
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={onDeactivate}
              disabled={bulkLoading}
            >
              Deactivate
            </Button>
          </>
        )}
        {canDelete("system", "users") && (
          <ConfirmDialog
            title="Bulk Delete Users"
            message={`Delete ${selectedCount} selected user${selectedCount !== 1 ? "s" : ""}? This cannot be undone.`}
            confirmText="Delete All"
            variant="danger"
            onConfirm={onDelete}
          >
            {(open) => (
              <Button
                size="sm"
                variant="danger"
                onClick={open}
                disabled={bulkLoading}
              >
                Delete
              </Button>
            )}
          </ConfirmDialog>
        )}
        <Button size="sm" variant="ghost" onClick={onClearSelection}>
          Clear Selection
        </Button>
      </div>
    </div>
  );
}
