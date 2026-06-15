import { useCustomReportBuilder } from "./useCustomReportBuilder";
import { AVAILABLE_FIELDS, CATEGORIES } from "./CustomReportBuilderPage.constants";
import type { ReportFilter } from "./CustomReportBuilderPage.types";

function FieldSelector({
  selectedFields,
  onToggle,
}: {
  selectedFields: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold mb-3">Report Fields</h3>
      {CATEGORIES.map((category) => (
        <div key={category} className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2 capitalize">
            {category}
          </h4>
          {AVAILABLE_FIELDS.filter((f) => f.category === category).map(
            (field) => (
              <label key={field.id} className="flex items-center gap-2 mb-1">
                <input
                  type="checkbox"
                  checked={selectedFields.includes(field.id)}
                  onChange={() => onToggle(field.id)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">{field.label}</span>
              </label>
            ),
          )}
        </div>
      ))}
    </div>
  );
}

function ReportConfiguration({
  reportName,
  setReportName,
  sortBy,
  setSortBy,
  sortDirection,
  setSortDirection,
  groupBy,
  setGroupBy,
}: {
  reportName: string;
  setReportName: (v: string) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  sortDirection: "asc" | "desc";
  setSortDirection: (v: "asc" | "desc") => void;
  groupBy: string;
  setGroupBy: (v: string) => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold mb-3">Report Configuration</h3>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Report Name</label>
        <input
          type="text"
          value={reportName}
          onChange={(e) => setReportName(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="My Custom Report"
        />
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="">None</option>
            {AVAILABLE_FIELDS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Direction</label>
          <select
            value={sortDirection}
            onChange={(e) =>
              setSortDirection(e.target.value as "asc" | "desc")
            }
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Group By (Optional)
        </label>
        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
        >
          <option value="">No Grouping</option>
          {AVAILABLE_FIELDS.filter((f) => f.type === "string").map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function FilterEditor({
  filters,
  onAdd,
  onUpdate,
  onRemove,
}: {
  filters: ReportFilter[];
  onAdd: () => void;
  onUpdate: (index: number, updates: Partial<ReportFilter>) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold">Filters</h3>
        <button
          onClick={onAdd}
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          + Add Filter
        </button>
      </div>
      {filters.map((filter, index) => (
        <div
          key={index}
          className="grid grid-cols-12 gap-2 mb-3 items-end"
        >
          <div className="col-span-4">
            <label className="block text-xs text-gray-600 mb-1">Field</label>
            <select
              value={filter.field}
              onChange={(e) =>
                onUpdate(index, { field: e.target.value })
              }
              className="w-full px-2 py-1 border rounded text-sm"
            >
              {AVAILABLE_FIELDS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-3">
            <label className="block text-xs text-gray-600 mb-1">
              Operator
            </label>
            <select
              value={filter.operator}
              onChange={(e) =>
                onUpdate(index, {
                  operator: e.target.value as ReportFilter["operator"],
                })
              }
              className="w-full px-2 py-1 border rounded text-sm"
            >
              <option value="contains">Contains</option>
              <option value="equals">Equals</option>
              <option value="greater_than">Greater Than</option>
              <option value="less_than">Less Than</option>
              <option value="between">Between</option>
            </select>
          </div>
          <div className="col-span-4">
            <label className="block text-xs text-gray-600 mb-1">Value</label>
            <input
              type="text"
              value={String(filter.value)}
              onChange={(e) =>
                onUpdate(index, { value: e.target.value })
              }
              className="w-full px-2 py-1 border rounded text-sm"
              placeholder="Enter value"
            />
          </div>
          <div className="col-span-1">
            <button
              onClick={() => onRemove(index)}
              className="text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function SavedReportsTable({
  savedReports,
  onLoad,
}: {
  savedReports: { id: string; name: string; fields: string[]; createdAt: Date }[];
  onLoad: (report: { id: string; name: string; fields: string[]; createdAt: Date }) => void;
}) {
  if (savedReports.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3">Report Name</th>
              <th className="text-left px-6 py-3">Fields</th>
              <th className="text-left px-6 py-3">Created</th>
              <th className="text-right px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={4} className="text-center py-8 text-gray-500">
                No saved reports yet
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-6 py-3">Report Name</th>
            <th className="text-left px-6 py-3">Fields</th>
            <th className="text-left px-6 py-3">Created</th>
            <th className="text-right px-6 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {savedReports.map((report) => (
            <tr key={report.id} className="border-b hover:bg-gray-50">
              <td className="px-6 py-4">{report.name}</td>
              <td className="px-6 py-4">{report.fields.length} fields</td>
              <td className="px-6 py-4">
                {report.createdAt.toLocaleDateString()}
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => onLoad(report)}
                  className="text-primary-600 hover:text-primary-700"
                >
                  Load
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportPreview({
  selectedFields,
  previewData,
  onExport,
}: {
  selectedFields: string[];
  previewData: Record<string, unknown>[];
  onExport: () => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Report Preview</h3>
        <button
          onClick={onExport}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Export to Excel
        </button>
      </div>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {selectedFields.map((fieldId) => {
                const field = AVAILABLE_FIELDS.find(
                  (f) => f.id === fieldId,
                );
                return (
                  <th
                    key={fieldId}
                    className="text-left px-4 py-3 text-sm font-medium"
                  >
                    {field?.label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {previewData.length === 0 ? (
              <tr>
                <td
                  colSpan={selectedFields.length}
                  className="text-center py-8 text-gray-500"
                >
                  No data to display. Generate a report first.
                </td>
              </tr>
            ) : (
              previewData.map((row, index) => (
                <tr
                  key={index}
                  className={`border-b ${
                    row.__isGroupHeader
                      ? "bg-gray-100 font-semibold"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {row.__isGroupHeader ? (
                    <td
                      colSpan={selectedFields.length}
                      className="px-4 py-2"
                    >
                      {String(row.__groupKey)}
                    </td>
                  ) : (
                    selectedFields.map((fieldId) => (
                      <td key={fieldId} className="px-4 py-3 text-sm">
                        {String(row[fieldId as keyof typeof row] || "")}
                      </td>
                    ))
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function CustomReportBuilderPage() {
  const {
    reportName,
    setReportName,
    selectedFields,
    filters,
    groupBy,
    setGroupBy,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    isGenerating,
    previewData,
    savedReports,
    activeTab,
    setActiveTab,
    toggleField,
    addFilter,
    updateFilter,
    removeFilter,
    generateReport,
    exportReport,
    saveReport,
    loadReport,
  } = useCustomReportBuilder();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Custom Report Builder
        </h1>
        <p className="text-gray-600">
          Build custom reports with selected fields and filters
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex gap-6">
          {(["builder", "saved", "preview"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Builder Tab */}
      {activeTab === "builder" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <FieldSelector
              selectedFields={selectedFields}
              onToggle={toggleField}
            />
          </div>
          <div className="lg:col-span-2 space-y-6">
            <ReportConfiguration
              reportName={reportName}
              setReportName={setReportName}
              sortBy={sortBy}
              setSortBy={setSortBy}
              sortDirection={sortDirection}
              setSortDirection={setSortDirection}
              groupBy={groupBy}
              setGroupBy={setGroupBy}
            />
            <FilterEditor
              filters={filters}
              onAdd={addFilter}
              onUpdate={updateFilter}
              onRemove={removeFilter}
            />
            <div className="flex gap-3">
              <button
                onClick={generateReport}
                disabled={isGenerating || selectedFields.length === 0}
                className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {isGenerating ? "Generating..." : "Generate Report"}
              </button>
              <button
                onClick={saveReport}
                disabled={!reportName}
                className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Save Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved Reports Tab */}
      {activeTab === "saved" && (
        <SavedReportsTable
          savedReports={savedReports}
          onLoad={loadReport}
        />
      )}

      {/* Preview Tab */}
      {activeTab === "preview" && (
        <ReportPreview
          selectedFields={selectedFields}
          previewData={previewData}
          onExport={exportReport}
        />
      )}
    </div>
  );
}
