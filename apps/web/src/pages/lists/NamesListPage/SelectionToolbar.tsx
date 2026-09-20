import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface SelectionToolbarProps {
  selectedCount: number;
  onBulkEdit: () => void;
  onBulkDelete: () => void;
  onClear: () => void;
}

export function SelectionToolbar({
  selectedCount,
  onBulkEdit,
  onBulkDelete,
  onClear,
}: SelectionToolbarProps) {
  const { canEdit, canDelete } = usePermissions();

  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
      <span className="text-sm text-blue-800">
        {selectedCount} name{selectedCount !== 1 ? "s" : ""} selected
      </span>
      <div className="flex gap-2">
        {canEdit("lists", "names") && (
          <Button size="sm" onClick={onBulkEdit}>
            Bulk Edit
          </Button>
        )}
        {canDelete("lists", "names") && (
          <ConfirmDialog
            title="Bulk Archive"
            message={`Archive ${selectedCount} selected name${selectedCount !== 1 ? "s" : ""}? They can be restored from Trash.`}
            confirmText="Archive All"
            variant="warning"
            onConfirm={onBulkDelete}
          >
            {(open) => (
              <Button size="sm" variant="danger" onClick={open}>
                Bulk Archive
              </Button>
            )}
          </ConfirmDialog>
        )}
        <Button size="sm" variant="ghost" onClick={onClear}>
          Clear Selection
        </Button>
      </div>
    </div>
  );
}
