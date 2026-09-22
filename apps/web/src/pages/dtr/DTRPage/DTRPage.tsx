import { Button } from "@/components/ui/Button";
import { Download, Upload } from "lucide-react";
import { EmployeeSelector } from "./EmployeeSelector";
import { DTRCalendar } from "./DTRCalendar";
import { DayEntryModal } from "./DayEntryModal";
import { LeaveApplicationModal } from "./LeaveApplicationModal";
import { DTRImportModal } from "./DTRImportModal";
import { DTRSummaryTable } from "./DTRSummaryTable";
import { useDTRPage } from "./useDTRPage";

export function DTRPage() {
  const {
    employees,
    selectedEmployeeId,
    setSelectedEmployeeId,
    selectedMonth,
    selectedYear,
    setSelectedYear,
    leaveBalances,
    leaveApplications,
    benefits,
    showDayModal,
    setShowDayModal,
    selectedDay,
    dayForm,
    setDayForm,
    showLeaveModal,
    setShowLeaveModal,
    leaveForm,
    setLeaveForm,
    viewMode,
    setViewMode,
    dtrSearchQuery,
    setDtrSearchQuery,
    showImportModal,
    setShowImportModal,
    importPreview,
    importErrors,
    fileInputRef,
    filteredMonthEntries,
    entryMap,
    stats,
    today,
    dim,
    fdm,
    hasExistingEntry,
    computedHoursWorked,
    canView,
    canEdit,
    canDelete,
    handlePrevMonth,
    handleNextMonth,
    openDayModal,
    saveDayEntry,
    deleteDayEntry,
    applyLeave,
    approveLeave,
    rejectLeave,
    handleExport,
    handleFileSelect,
    handleImport,
  } = useDTRPage();

  if (!canView("employees", "calendar"))
    return <div className="text-center py-12 text-gray-500">Access denied</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Daily Time Record</h1>
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <EmployeeSelector
        employees={employees}
        selectedEmployeeId={selectedEmployeeId}
        onEmployeeChange={setSelectedEmployeeId}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onYearChange={setSelectedYear}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {viewMode === "calendar" && selectedEmployeeId && (
        <DTRCalendar
          stats={stats}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          daysInMonth={dim}
          firstDayOfMonth={fdm}
          today={today}
          entryMap={entryMap}
          onDayClick={openDayModal}
          leaveBalances={leaveBalances}
          leaveApplications={leaveApplications}
          benefits={benefits}
          onApplyLeave={() => setShowLeaveModal(true)}
          onApproveLeave={approveLeave}
          onRejectLeave={rejectLeave}
          canEdit={canEdit("employees", "calendar")}
        />
      )}

      {viewMode === "summary" && (
        <DTRSummaryTable
          entries={filteredMonthEntries}
          searchQuery={dtrSearchQuery}
          onSearchChange={setDtrSearchQuery}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
        />
      )}

      <DayEntryModal
        show={showDayModal}
        selectedDay={selectedDay}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        dayForm={dayForm}
        hasExistingEntry={hasExistingEntry}
        canDelete={canDelete("employees", "calendar")}
        hoursWorked={computedHoursWorked}
        onClose={() => setShowDayModal(false)}
        onChange={setDayForm}
        onSave={saveDayEntry}
        onDelete={deleteDayEntry}
      />

      <LeaveApplicationModal
        show={showLeaveModal}
        leaveForm={leaveForm}
        benefits={benefits}
        onClose={() => setShowLeaveModal(false)}
        onChange={setLeaveForm}
        onSubmit={applyLeave}
      />

      <DTRImportModal
        show={showImportModal}
        importPreview={importPreview}
        importErrors={importErrors}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
      />
    </div>
  );
}
