import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Sheet } from "@/components/ui/Sheet";

interface NameFormData {
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
}

interface NameFormProps {
  isOpen: boolean;
  editingId: string | null;
  formData: NameFormData;
  onUpdate: (data: NameFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export function NameForm({
  isOpen,
  editingId,
  formData,
  onUpdate,
  onSubmit,
  onCancel,
}: NameFormProps) {
  const setField = (field: keyof NameFormData, value: string) => {
    onUpdate({ ...formData, [field]: value });
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onCancel}
      title={editingId ? "Edit Name" : "Add Name"}
      footer={
        <div className="flex gap-2">
          <Button type="submit" form="name-form">
            {editingId ? "Update" : "Create"}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      }
    >
      <form id="name-form" onSubmit={onSubmit} className="space-y-4">
        <Input
          id="firstName"
          label="First Name"
          value={formData.firstName}
          onChange={(e) => setField("firstName", e.target.value)}
          required
        />
        <Input
          id="middleName"
          label="Middle Name"
          value={formData.middleName}
          onChange={(e) => setField("middleName", e.target.value)}
        />
        <Input
          id="lastName"
          label="Last Name"
          value={formData.lastName}
          onChange={(e) => setField("lastName", e.target.value)}
          required
        />
        <Input
          id="suffix"
          label="Suffix"
          value={formData.suffix}
          onChange={(e) => setField("suffix", e.target.value)}
        />
      </form>
    </Sheet>
  );
}
