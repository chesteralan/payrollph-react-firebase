import { Copy, Edit, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { PayrollTemplate, PrintFormat } from "./TemplatesPage.types";
import type { Department, Section } from "@/types";

interface TemplateTableProps {
  templates: PayrollTemplate[];
  loading: boolean;
  printFormats: PrintFormat[];
  canAdd: (department: Department, section: Section) => boolean;
  canEdit: (department: Department, section: Section) => boolean;
  canDelete: (department: Department, section: Section) => boolean;
  onClone: (template: PayrollTemplate) => void;
  onEdit: (template: PayrollTemplate) => void;
  onDelete: (id: string) => void;
}

export function TemplateTable({
  templates,
  loading,
  printFormats,
  canAdd,
  canEdit,
  canDelete,
  onClone,
  onEdit,
  onDelete,
}: TemplateTableProps) {
  const getPrintFormatName = (formatId: string | undefined): string => {
    const pf = printFormats.find((f) => f.id === formatId);
    return pf
      ? pf.name
      : (formatId || "register").charAt(0).toUpperCase() +
          (formatId || "register").slice(1);
  };

  return (
    <Card>
      <CardContent className="p-0">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Print Format
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Components
              </th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-4 text-center text-gray-500"
                >
                  Loading...
                </td>
              </tr>
            ) : templates.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-4 text-center text-gray-500"
                >
                  No templates found
                </td>
              </tr>
            ) : (
              templates.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {t.name}
                    </div>
                    {t.description && (
                      <div className="text-xs text-gray-500">
                        {t.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {getPrintFormatName(t.printFormat)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {(t.earnings?.length || 0) +
                      (t.deductions?.length || 0) +
                      (t.benefits?.length || 0)}{" "}
                    items
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {canAdd("payroll", "templates") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onClone(t)}
                          title="Clone"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      )}
                      {canEdit("payroll", "templates") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(t)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {canDelete("payroll", "templates") && (
                        <ConfirmDialog
                          title="Delete Template"
                          message={`Delete "${t.name}"?`}
                          confirmText="Delete"
                          onConfirm={() => onDelete(t.id)}
                        >
                          {(open) => (
                            <Button variant="ghost" size="sm" onClick={open}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </ConfirmDialog>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
