import { useCallback } from "react";
import { useBlocker } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Button } from "../Button";

interface ConfirmLeaveDialogProps {
  isDirty: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmLeaveDialog({
  isDirty,
  title = "Unsaved Changes",
  message = "You have unsaved changes. Are you sure you want to leave? Your changes will be lost.",
  confirmText = "Leave",
  cancelText = "Stay",
}: ConfirmLeaveDialogProps) {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname,
  );

  const handleConfirm = useCallback(() => {
    if (blocker.state === "blocked") {
      blocker.proceed();
    }
  }, [blocker]);

  const handleCancel = useCallback(() => {
    if (blocker.state === "blocked") {
      blocker.reset();
    }
  }, [blocker]);

  if (blocker.state !== "blocked") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={handleCancel}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="leave-dialog-title"
        className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-yellow-100">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
          </div>
          <h3
            id="leave-dialog-title"
            className="text-lg font-semibold text-gray-900"
          >
            {title}
          </h3>
        </div>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={handleCancel}>
            {cancelText}
          </Button>
          <Button
            className="bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500"
            onClick={handleConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
