import { ArrowLeft, Lock, Save, Send, Unlock } from "lucide-react";
import { PayrollOutputView } from "@/components/payroll/PayrollOutputView";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { usePayrollDetail } from "./usePayrollDetail";
import { DTRStage, StageSelector } from "./PayrollStages";
import { ComputationSummary } from "./ComputationSummary";
import { ValidationPanel } from "./ValidationPanel";
import { SalariesStage } from "./SalariesStage";
import { EarningsStage } from "./EarningsStage";
import { BenefitsStage } from "./BenefitsStage";
import { DeductionsStage } from "./DeductionsStage";

function PayrollHeader({
  payroll,
  term,
  activeStage,
  saving,
  isLocked,
  isPublished,
  onNavigateBack,
  onSave,
  onToggleLock,
  onPublish,
}: {
  payroll: { name: string; month: number; year: number; isPublished?: boolean; isLocked?: boolean };
  term: { name: string } | null;
  activeStage: string;
  saving: boolean;
  isLocked: boolean;
  isPublished: boolean;
  onNavigateBack: () => void;
  onSave: () => void;
  onToggleLock: () => void;
  onPublish: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onNavigateBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{payroll.name}</h1>
          <p className="text-gray-500">
            {new Date(0, payroll.month - 1).toLocaleString("default", {
              month: "long",
            })}{" "}
            {payroll.year}
            {term && (
              <span className="ml-2 text-blue-600 font-medium">
                Term: {term.name}
              </span>
            )}
            {isPublished && (
              <span className="ml-2 text-green-600 font-medium">Published</span>
            )}
            {isLocked && !isPublished && (
              <span className="ml-2 text-orange-600 font-medium">Locked</span>
            )}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        {activeStage !== "output" && !isLocked && (
          <Button variant="secondary" onClick={onSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save"}
          </Button>
        )}
        {!isLocked && (
          <Button variant="secondary" onClick={onToggleLock}>
            {isLocked ? (
              <Unlock className="w-4 h-4 mr-2" />
            ) : (
              <Lock className="w-4 h-4 mr-2" />
            )}
            {isLocked ? "Unlock" : "Lock"}
          </Button>
        )}
        {!isPublished && (
          <Button onClick={onPublish} disabled={isLocked}>
            <Send className="w-4 h-4 mr-2" />
            Publish
          </Button>
        )}
      </div>
    </div>
  );
}

export function PayrollDetailPage() {
  const {
    STAGES,
    payroll,
    activeStage,
    setActiveStage,
    loading,
    rows,
    earningsList,
    deductionsList,
    benefitsList,
    earningData,
    deductionData,
    benefitData,
    saving,
    showValidation,
    setShowValidation,
    validationErrors,
    company,
    startDate,
    endDate,
    actualWorkdays,
    defaultWorkdays,
    term,
    navigate,
    toggleLock,
    handlePublish,
    handleSaveStage,
    updateRow,
    updateEarning,
    updateDeduction,
    updateBenefit,
    getEarningTotal,
    getDeductionTotal,
    getEmployeeGross,
    getEmployeeNet,
  } = usePayrollDetail();

  if (loading || !payroll) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  const isLocked = payroll.isLocked ?? false;
  const isPublished = payroll.isPublished ?? false;

  return (
    <div className="space-y-6">
      <PayrollHeader
        payroll={payroll}
        term={term}
        activeStage={activeStage}
        saving={saving}
        isLocked={isLocked}
        isPublished={isPublished}
        onNavigateBack={() => navigate("/payroll")}
        onSave={handleSaveStage}
        onToggleLock={toggleLock}
        onPublish={handlePublish}
      />

      {showValidation && validationErrors.length > 0 && (
        <ValidationPanel
          errors={validationErrors}
          onClose={() => setShowValidation(false)}
        />
      )}

      <StageSelector
        stages={STAGES}
        activeStage={activeStage}
        onStageChange={setActiveStage}
      />

      {activeStage === "dtr" && (
        <DTRStage
          rows={rows}
          startDate={startDate}
          endDate={endDate}
          updateRow={updateRow}
          onManageDTR={() => navigate("/dtr")}
        />
      )}

      {activeStage === "salaries" && (
        <SalariesStage
          rows={rows}
          actualWorkdays={actualWorkdays}
          defaultWorkdays={defaultWorkdays}
          updateRow={updateRow}
        />
      )}

      {activeStage === "earnings" && (
        <EarningsStage
          rows={rows}
          earningsList={earningsList}
          earningData={earningData}
          updateEarning={updateEarning}
          getEarningTotal={getEarningTotal}
        />
      )}

      {activeStage === "benefits" && (
        <BenefitsStage
          rows={rows}
          benefitsList={benefitsList}
          benefitData={benefitData}
          updateBenefit={updateBenefit}
        />
      )}

      {activeStage === "deductions" && (
        <DeductionsStage
          rows={rows}
          deductionsList={deductionsList}
          deductionData={deductionData}
          updateDeduction={updateDeduction}
          getDeductionTotal={getDeductionTotal}
        />
      )}

      {activeStage === "summary" && (
        <Card>
          <CardHeader>
            <CardTitle>Payroll Summary</CardTitle>
            <p className="text-sm text-gray-500">
              Auto-calculated from DTR, Salaries, Earnings, Benefits, and
              Deductions
            </p>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <ComputationSummary
              rows={rows}
              earningData={earningData}
              deductionData={deductionData}
              benefitData={benefitData}
              getEmployeeGross={getEmployeeGross}
              getEmployeeNet={getEmployeeNet}
            />
          </CardContent>
        </Card>
      )}

      {activeStage === "output" && (
        <PayrollOutputView
          payroll={payroll}
          company={company || undefined}
          rows={rows}
          earningData={earningData}
          deductionData={deductionData}
          benefitData={benefitData}
          earningsList={earningsList}
          deductionsList={deductionsList}
          benefitsList={benefitsList}
        />
      )}

      {activeStage !== "output" && !isLocked && (
        <div className="flex justify-end">
          <Button onClick={handleSaveStage} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save All Changes"}
          </Button>
        </div>
      )}
    </div>
  );
}
