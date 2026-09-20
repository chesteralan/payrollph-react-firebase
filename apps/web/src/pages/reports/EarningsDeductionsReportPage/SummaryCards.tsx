import { Card, CardContent } from "@/components/ui/Card";

interface SummaryCardsProps {
  totalEarnings: number;
  totalDeductions: number;
  totalBenefitsEE: number;
  totalBenefitsER: number;
  formatCurrency: (value: number) => string;
}

export function SummaryCards({
  totalEarnings,
  totalDeductions,
  totalBenefitsEE,
  totalBenefitsER,
  formatCurrency,
}: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-gray-500">Total Earnings</div>
          <div className="text-2xl font-bold">
            {formatCurrency(totalEarnings)}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-gray-500">Total Deductions</div>
          <div className="text-2xl font-bold">
            {formatCurrency(totalDeductions)}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-gray-500">Total Benefits (EE)</div>
          <div className="text-2xl font-bold">
            {formatCurrency(totalBenefitsEE)}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-gray-500">Total Benefits (ER)</div>
          <div className="text-2xl font-bold">
            {formatCurrency(totalBenefitsER)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
