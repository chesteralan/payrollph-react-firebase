import { Plus, X } from "lucide-react";

interface Contact {
  name: string;
  relationship: string;
  phone: string;
}

interface EmergencyContactFormProps {
  contacts: Contact[];
  onChange: (contacts: Contact[]) => void;
}

export function EmergencyContactForm({
  contacts,
  onChange,
}: EmergencyContactFormProps) {
  const add = () => onChange([...contacts, { name: "", relationship: "", phone: "" }]);
  const remove = (i: number) => onChange(contacts.filter((_, idx) => idx !== i));
  const update = (i: number, field: keyof Contact, value: string) => {
    const next = contacts.map((c, idx) => (idx === i ? { ...c, [field]: value } : c));
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {contacts.map((contact, i) => (
        <div key={i} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
          <div className="flex-1 grid grid-cols-3 gap-2">
            <input
              type="text"
              value={contact.name}
              onChange={(e) => update(i, "name", e.target.value)}
              placeholder="Full name"
              className="px-2 py-1.5 text-sm border border-gray-200 rounded"
            />
            <input
              type="text"
              value={contact.relationship}
              onChange={(e) => update(i, "relationship", e.target.value)}
              placeholder="Relationship"
              className="px-2 py-1.5 text-sm border border-gray-200 rounded"
            />
            <input
              type="tel"
              value={contact.phone}
              onChange={(e) => update(i, "phone", e.target.value)}
              placeholder="Phone number"
              className="px-2 py-1.5 text-sm border border-gray-200 rounded"
            />
          </div>
          <button type="button" onClick={() => remove(i)} className="p-1 hover:bg-gray-200 rounded">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-800"
      >
        <Plus className="w-4 h-4" />
        Add emergency contact
      </button>
    </div>
  );
}
