import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Plus, Trash2, Phone, Mail, MapPin } from "lucide-react";
import type { EmployeeContact } from "./EmployeeProfilePage.types";

interface ContactForm {
  type: "phone" | "email" | "address";
  value: string;
  isPrimary: boolean;
}

interface ContactInfoCardProps {
  contacts: EmployeeContact[];
  showContactForm: boolean;
  contactForm: ContactForm;
  onContactFormChange: (form: ContactForm) => void;
  onShowContactFormChange: (show: boolean) => void;
  onAddContact: () => void;
  onDeleteContact: (contactId: string) => void;
}

export function ContactInfoCard({
  contacts,
  showContactForm,
  contactForm,
  onContactFormChange,
  onShowContactFormChange,
  onAddContact,
  onDeleteContact,
}: ContactInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Information</CardTitle>
      </CardHeader>
      <CardContent>
        {showContactForm && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex gap-4">
              <select
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={contactForm.type}
                onChange={(e) =>
                  onContactFormChange({
                    ...contactForm,
                    type: e.target.value as "phone" | "email" | "address",
                  })
                }
              >
                <option value="phone">Phone</option>
                <option value="email">Email</option>
                <option value="address">Address</option>
              </select>
              <input
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder={
                  contactForm.type === "phone"
                    ? "Phone number"
                    : contactForm.type === "email"
                      ? "Email address"
                      : "Full address"
                }
                value={contactForm.value}
                onChange={(e) =>
                  onContactFormChange({
                    ...contactForm,
                    value: e.target.value,
                  })
                }
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={contactForm.isPrimary}
                  onChange={(e) =>
                    onContactFormChange({
                      ...contactForm,
                      isPrimary: e.target.checked,
                    })
                  }
                />
                Primary
              </label>
              <Button onClick={onAddContact}>Add</Button>
              <Button
                variant="ghost"
                onClick={() => onShowContactFormChange(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
            >
              <div className="flex items-center gap-3">
                {contact.type === "phone" && (
                  <Phone className="w-4 h-4 text-gray-400" />
                )}
                {contact.type === "email" && (
                  <Mail className="w-4 h-4 text-gray-400" />
                )}
                {contact.type === "address" && (
                  <MapPin className="w-4 h-4 text-gray-400" />
                )}
                <div>
                  <div className="text-sm font-medium">{contact.value}</div>
                  <div className="text-xs text-gray-500 capitalize">
                    {contact.type}
                    {contact.isPrimary && " (Primary)"}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteContact(contact.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {contacts.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              No contact information added yet.
            </p>
          )}
        </div>

        {!showContactForm && (
          <Button
            variant="secondary"
            onClick={() => onShowContactFormChange(true)}
            className="mt-4"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
