import { clsx } from 'clsx'
import { Check } from 'lucide-react'

interface Step {
  label: string
  completed: boolean
  active: boolean
}

interface StepperProps {
  steps: Step[]
}

export function Stepper({ steps }: StepperProps) {
  return (
    <div className="flex items-center w-full">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center flex-1">
          <div className="flex items-center">
            <div
              className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2',
                step.completed && 'bg-primary-600 border-primary-600 text-white',
                step.active && !step.completed && 'border-primary-600 text-primary-600 bg-white',
                !step.active && !step.completed && 'border-gray-300 text-gray-400 bg-white'
              )}
            >
              {step.completed ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span
              className={clsx(
                'ml-2 text-sm font-medium',
                step.completed && 'text-primary-600',
                step.active && !step.completed && 'text-gray-900',
                !step.active && !step.completed && 'text-gray-400'
              )}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={clsx(
                'flex-1 h-0.5 mx-4',
                steps[i + 1].completed ? 'bg-primary-600' : 'bg-gray-200'
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}
