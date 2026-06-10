import { clsx } from "clsx";
import { Check } from "lucide-react";
import type { StepperProps } from "./Stepper.types";

export function Stepper({ steps, onStepClick }: StepperProps) {
  const completedCount = steps.filter((s) => s.completed).length;
  const progressPct = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${progressPct}% complete`}
          />
        </div>
        <span className="text-xs font-medium text-gray-500 min-w-10 text-right">
          {progressPct}%
        </span>
      </div>

      <div
        className="flex items-center w-full"
        role="list"
        aria-label="Progress steps"
      >
        {steps.map((step, i) => {
          const StepIcon = step.icon;
          return (
            <div key={i} className="flex items-center flex-1" role="listitem">
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => {
                    if (step.completed && onStepClick) onStepClick(i);
                  }}
                  disabled={!step.completed || !onStepClick}
                  className={clsx(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-all",
                    step.completed &&
                      "bg-primary-600 border-primary-600 text-white",
                    step.active &&
                      !step.completed &&
                      "border-primary-600 text-primary-600 bg-primary-50",
                    !step.active &&
                      !step.completed &&
                      "border-gray-300 text-gray-400 bg-white",
                    step.completed && onStepClick && "cursor-pointer hover:shadow-md",
                    step.completed && !onStepClick && "cursor-default",
                    !step.completed && "cursor-default",
                  )}
                  aria-current={step.active ? "step" : undefined}
                  aria-label={`Step ${i + 1}: ${step.label}${step.completed ? " (completed)" : ""}`}
                >
                  {step.completed ? (
                    <Check className="w-5 h-5" aria-hidden="true" />
                  ) : StepIcon ? (
                    <StepIcon className="w-5 h-5" aria-hidden="true" />
                  ) : (
                    <span aria-hidden="true">{i + 1}</span>
                  )}
                </button>
                <div className="ml-3 hidden sm:block">
                  <span
                    className={clsx(
                      "block text-sm font-medium leading-tight",
                      step.completed && "text-primary-600",
                      step.active && !step.completed && "text-gray-900",
                      !step.active && !step.completed && "text-gray-400",
                    )}
                  >
                    {step.label}
                  </span>
                  {step.description && (
                    <span
                      className={clsx(
                        "block text-xs mt-0.5",
                        step.active
                          ? "text-gray-500"
                          : "text-gray-400",
                      )}
                    >
                      {step.description}
                    </span>
                  )}
                </div>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={clsx(
                    "flex-1 h-0.5 mx-4 hidden sm:block",
                    steps[i + 1].completed ? "bg-primary-600" : "bg-gray-200",
                  )}
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
