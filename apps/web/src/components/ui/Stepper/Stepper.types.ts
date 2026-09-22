import type { LucideIcon } from "lucide-react";

export interface Step {
  label: string;
  completed: boolean;
  active: boolean;
  description?: string;
  icon?: LucideIcon;
}

export interface StepperProps {
  steps: Step[];
  onStepClick?: (index: number) => void;
}
