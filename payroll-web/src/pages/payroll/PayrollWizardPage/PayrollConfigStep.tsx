import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

interface PayrollConfigStepProps {
  formData: {
    name: string;
    month: number;
    year: number;
    templateId: string;
    termId: string;
  };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      name: string;
      month: number;
      year: number;
      templateId: string;
      termId: string;
    }>
  >;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  templates: { id: string; name: string }[];
  terms: { id: string; name: string; type: string }[];
  onTermChange: (termId: string) => void;
  onNext: () => void;
  loading: boolean;
}

export function PayrollConfigStep({
  formData,
  setFormData,
  errors,
  setErrors,
  templates,
  terms,
  onTermChange,
  onNext,
  loading,
}: PayrollConfigStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payroll Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Input
            id="name"
            label="Payroll Name"
            value={formData.name}
            onChange={(e) => {
              setFormData((prev: any) => ({ ...prev, name: e.target.value }));
              setErrors((prev: any) => ({ ...prev, name: "" }));
            }}
            placeholder="e.g., January 2026 Payroll"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Month
            </label>
            <select
              value={formData.month}
              onChange={(e) =>
                setFormData((prev: any) => ({
                  ...prev,
                  month: parseInt(e.target.value),
                }))
              }
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString("default", {
                    month: "long",
                  })}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Input
              id="year"
              label="Year"
              type="number"
              value={formData.year}
              onChange={(e) => {
                setFormData((prev: any) => ({
                  ...prev,
                  year: parseInt(e.target.value),
                }));
                setErrors((prev: any) => ({ ...prev, year: "" }));
              }}
            />
            {errors.year && (
              <p className="mt-1 text-sm text-red-600">{errors.year}</p>
            )}
          </div>
        </div>
        {templates.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template (Optional)
            </label>
            <select
              value={formData.templateId}
              onChange={(e) =>
                setFormData((prev: any) => ({
                  ...prev,
                  templateId: e.target.value,
                }))
              }
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">No template</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {terms.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Term (Optional)
            </label>
            <select
              value={formData.termId}
              onChange={(e) => onTermChange(e.target.value)}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">No term</option>
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.type})
                </option>
              ))}
            </select>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button onClick={onNext} disabled={!formData.name || loading}>
          {loading ? "Saving..." : "Next"}
        </Button>
      </CardFooter>
    </Card>
  );
}
