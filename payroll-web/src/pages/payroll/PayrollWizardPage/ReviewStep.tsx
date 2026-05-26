import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/Card";

interface ReviewStepProps {
  formData: {
    name: string;
    month: number;
    year: number;
    templateId: string;
  };
  templates: { id: string; name: string }[];
  inclusiveDates: Date[];
  groups: unknown[];
  selectedEmployeeIds: string[];
  employees: unknown[];
  id?: string;
  onBack: () => void;
}

export function ReviewStep({
  formData,
  templates,
  inclusiveDates,
  groups,
  selectedEmployeeIds,
  employees,
  id,
  onBack,
}: ReviewStepProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review & Generate</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Name:</span>
            <p className="font-medium">{formData.name}</p>
          </div>
          <div>
            <span className="text-gray-500">Period:</span>
            <p className="font-medium">
              {new Date(0, formData.month - 1).toLocaleString("default", {
                month: "long",
              })}{" "}
              {formData.year}
            </p>
          </div>
          {formData.templateId && (
            <div>
              <span className="text-gray-500">Template:</span>
              <p className="font-medium">
                {templates.find((t) => t.id === formData.templateId)?.name ||
                  "None"}
              </p>
            </div>
          )}
          <div>
            <span className="text-gray-500">Inclusive Dates:</span>
            <p className="font-medium">{inclusiveDates.length} dates</p>
          </div>
          <div>
            <span className="text-gray-500">Groups:</span>
            <p className="font-medium">{groups.length} filters</p>
          </div>
          <div>
            <span className="text-gray-500">Employees:</span>
            <p className="font-medium">
              {selectedEmployeeIds.length || employees.length} selected
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={() => navigate(`/payroll/${id}`)}>
          <Check className="w-4 h-4 mr-2" />
          Complete Setup
        </Button>
      </CardFooter>
    </Card>
  );
}
