import { type ButtonHTMLAttributes, forwardRef } from "react";

export interface ToggleProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  ({ checked, onChange, label, disabled, className, ...props }, ref) => {
    return (
      <label
        className={`flex items-center gap-3 cursor-pointer ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <button
          ref={ref}
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => onChange(!checked)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
            checked ? "bg-primary-600" : "bg-gray-200"
          } ${disabled ? "pointer-events-none" : ""} ${className ?? ""}`}
          {...props}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              checked ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        {label && <span className="text-sm text-gray-700">{label}</span>}
      </label>
    );
  },
);

Toggle.displayName = "Toggle";
