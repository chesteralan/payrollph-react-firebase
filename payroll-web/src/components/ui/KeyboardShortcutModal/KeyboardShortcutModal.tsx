import { useEffect } from "react";
import { X, Command } from "lucide-react";

interface ShortcutGroup {
  group: string;
  shortcuts: { keys: string[]; description: string }[];
}

interface KeyboardShortcutModalProps {
  open: boolean;
  onClose: () => void;
}

const DEFAULT_SHORTCUTS: ShortcutGroup[] = [
  {
    group: "Navigation",
    shortcuts: [
      { keys: ["⌘", "K"], description: "Open search palette" },
      { keys: ["⌘", "/"], description: "Focus dashboard search" },
      { keys: ["⌘", "1"], description: "Go to Dashboard" },
      { keys: ["⌘", "2"], description: "Go to Employees" },
      { keys: ["⌘", "3"], description: "Go to Payroll" },
    ],
  },
  {
    group: "Actions",
    shortcuts: [
      { keys: ["⌘", "N"], description: "New payroll run" },
      { keys: ["⌘", "S"], description: "Save current form" },
      { keys: ["⌘", "Z"], description: "Undo" },
      { keys: ["⌘", "⇧", "Z"], description: "Redo" },
      { keys: ["⌘", "P"], description: "Print current view" },
    ],
  },
  {
    group: "Editing",
    shortcuts: [
      { keys: ["Enter"], description: "Edit cell / Confirm" },
      { keys: ["Esc"], description: "Cancel / Close" },
      { keys: ["Tab"], description: "Next field" },
      { keys: ["⇧", "Tab"], description: "Previous field" },
    ],
  },
];

export function KeyboardShortcutModal({
  open,
  onClose,
}: KeyboardShortcutModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Command className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-6">
          {DEFAULT_SHORTCUTS.map((group) => (
            <div key={group.group}>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                {group.group}
              </h3>
              <div className="space-y-1.5">
                {group.shortcuts.map((shortcut, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-gray-600">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-0.5">
                      {shortcut.keys.map((key, j) => (
                        <kbd
                          key={j}
                          className="px-1.5 py-0.5 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded min-w-[22px] text-center"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-400 text-center">
          Press <kbd className="px-1 py-0.5 bg-gray-100 border rounded">?</kbd> to toggle this modal
        </div>
      </div>
    </div>
  );
}
