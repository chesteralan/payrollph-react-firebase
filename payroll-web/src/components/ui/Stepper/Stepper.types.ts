export interface Step {
  label: string;
  completed: boolean;
  active: boolean;
}

export interface StepperProps {
  steps: Step[];
}
