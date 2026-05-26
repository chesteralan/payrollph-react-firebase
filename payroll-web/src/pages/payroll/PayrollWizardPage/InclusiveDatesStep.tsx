import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

interface InclusiveDatesStepProps {
  errors: Record<string, string>;
  dateStr: string;
  onDateStrChange: (val: string) => void;
  inclusiveDates: Date[];
  onAddDate: () => void;
  onRemoveDate: (index: number) => void;
  onNext: () => void;
  onBack: () => void;
  loading: boolean;
}

export function InclusiveDatesStep({
  errors,
  dateStr,
  onDateStrChange,
  inclusiveDates,
  onAddDate,
  onRemoveDate,
  onNext,
  onBack,
  loading,
}: InclusiveDatesStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Inclusive Dates</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {errors.dates && <p className="text-sm text-red-600">{errors.dates}</p>}
        <div className="flex gap-2">
          <Input
            id="date"
            type="date"
            value={dateStr}
            onChange={(e) => onDateStrChange(e.target.value)}
          />
          <Button onClick={onAddDate} disabled={!dateStr}>
            Add Date
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {inclusiveDates.map((date, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
            >
              <span>{date.toLocaleDateString()}</span>
              <button
                onClick={() => onRemoveDate(i)}
                className="text-primary-400 hover:text-primary-600"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={inclusiveDates.length === 0 || loading}
        >
          Next
        </Button>
      </CardFooter>
    </Card>
  );
}
