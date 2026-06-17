import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

import { useCompanies } from "./useCompanies";
import { CompanyForm } from "./CompanyForm";
import { CompanyTable } from "./CompanyTable";

export function CompaniesPage() {
  const {
    loading,
    showForm,
    editingId,
    showDeleted,
    searchQuery,
    formData,
    columnGroup,
    sortedCompanies,
    sortConfig,
    canView,
    canAdd,
    canEdit,
    canDelete,
    setShowForm,
    setEditingId,
    setShowDeleted,
    setSearchQuery,
    setFormData,
    setColumnGroup,
    handleSubmit,
    handleEdit,
    addPayrollPeriod,
    removePayrollPeriod,
    updatePayrollPeriod,
    handleToggleStatus,
    handleSoftDelete,
    handleRestore,
    handlePermanentDelete,
    handleSort,
  } = useCompanies();

  if (!canView("system", "companies"))
    return <div className="text-center py-12 text-gray-500">Access denied</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => setShowDeleted(!showDeleted)}
          >
            {showDeleted ? "Show Active" : "Show Archived"}
          </Button>
          {canAdd("system", "companies") && (
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Company
            </Button>
          )}
        </div>
      </div>

      {showForm && (
        <CompanyForm
          formData={formData}
          columnGroup={columnGroup}
          editingId={editingId}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingId(null);
          }}
          onFormDataChange={setFormData}
          onColumnGroupChange={setColumnGroup}
          onAddPayrollPeriod={addPayrollPeriod}
          onRemovePayrollPeriod={removePayrollPeriod}
          onUpdatePayrollPeriod={updatePayrollPeriod}
        />
      )}

      <CompanyTable
        companies={sortedCompanies}
        loading={loading}
        searchQuery={searchQuery}
        sortConfig={sortConfig}
        canEdit={canEdit}
        canDelete={canDelete}
        onSearchChange={setSearchQuery}
        onEdit={handleEdit}
        onToggleStatus={handleToggleStatus}
        onSoftDelete={handleSoftDelete}
        onRestore={handleRestore}
        onPermanentDelete={handlePermanentDelete}
        onSort={handleSort}
      />
    </div>
  );
}
