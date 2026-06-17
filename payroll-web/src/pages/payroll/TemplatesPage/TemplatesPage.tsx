import { useTemplatesPage } from "./useTemplatesPage";
import { WizardContent } from "./TemplatesPage.wizard";
import { TemplateTable } from "./TemplatesPage.table";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";

export function TemplatesPage() {
  const {
    templates,
    loading,
    showWizard,
    editingId,
    wizardStep,
    setWizardStep,
    basicForm,
    setBasicForm,
    selectedGroups,
    setSelectedGroups,
    selectedPositions,
    setSelectedPositions,
    selectedAreas,
    setSelectedAreas,
    selectedStatuses,
    setSelectedStatuses,
    selectedEarnings,
    setSelectedEarnings,
    selectedDeductions,
    setSelectedDeductions,
    selectedBenefits,
    setSelectedBenefits,
    selectedPrintColumns,
    setSelectedPrintColumns,
    groups,
    positions,
    areas,
    statuses,
    earningsList,
    deductionsList,
    benefitsList,
    printFormats,
    openWizard,
    closeWizard,
    handleClone,
    handleDelete,
    handleSubmit,
    toggleItem,
    canView,
    canAdd,
    canEdit,
    canDelete,
  } = useTemplatesPage();

  if (!canView("payroll", "templates"))
    return <div className="text-center py-12 text-gray-500">Access denied</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Payroll Templates</h1>
        {canAdd("payroll", "templates") && (
          <Button onClick={() => openWizard()}>
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        )}
      </div>

      {showWizard && (
        <WizardContent
          wizardStep={wizardStep}
          setWizardStep={setWizardStep}
          editingId={editingId}
          basicForm={basicForm}
          setBasicForm={setBasicForm}
          selectedGroups={selectedGroups}
          selectedPositions={selectedPositions}
          selectedAreas={selectedAreas}
          selectedStatuses={selectedStatuses}
          selectedEarnings={selectedEarnings}
          selectedDeductions={selectedDeductions}
          selectedBenefits={selectedBenefits}
          selectedPrintColumns={selectedPrintColumns}
          groups={groups}
          positions={positions}
          areas={areas}
          statuses={statuses}
          earningsList={earningsList}
          deductionsList={deductionsList}
          benefitsList={benefitsList}
          printFormats={printFormats}
          onToggle={toggleItem}
          setSelectedGroups={setSelectedGroups}
          setSelectedPositions={setSelectedPositions}
          setSelectedAreas={setSelectedAreas}
          setSelectedStatuses={setSelectedStatuses}
          setSelectedEarnings={setSelectedEarnings}
          setSelectedDeductions={setSelectedDeductions}
          setSelectedBenefits={setSelectedBenefits}
          setSelectedPrintColumns={setSelectedPrintColumns}
          handleSubmit={handleSubmit}
          onClose={closeWizard}
        />
      )}

      <TemplateTable
        templates={templates}
        loading={loading}
        printFormats={printFormats}
        canAdd={canAdd}
        canEdit={canEdit}
        canDelete={canDelete}
        onClone={handleClone}
        onEdit={openWizard}
        onDelete={handleDelete}
      />
    </div>
  );
}
