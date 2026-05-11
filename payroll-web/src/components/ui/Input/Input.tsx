import { forwardRef, useId } from "react";
import { clsx } from "clsx";
import type { InputProps } from "./Input/Input.types";

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id: externalId, ...props }, ref) => {
    const autoId = useId();
    const id = externalId || autoId;
    const errorId = `${id}-error`;

    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={clsx(
            "block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50 disabled:pointer-events-none",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500",
            className,
          )}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? errorId : undefined}
          {...props}
        />
        {error && (
          <p id={errorId} className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
