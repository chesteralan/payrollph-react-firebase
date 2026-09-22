import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Save } from "lucide-react";

interface PersonalInfoForm {
  sss: string;
  tin: string;
  philhealth: string;
  hdmf: string;
  bankName: string;
  bankAccount: string;
  dateOfBirth: string;
  gender: "male" | "female" | "";
  civilStatus: "single" | "married" | "widowed" | "separated" | "";
}

interface PersonalInfoSectionProps {
  profileForm: PersonalInfoForm;
  onProfileFormChange: (form: PersonalInfoForm) => void;
  onSaveProfile: () => void;
  saving: boolean;
}

export function PersonalInfoSection({
  profileForm,
  onProfileFormChange,
  onSaveProfile,
  saving,
}: PersonalInfoSectionProps) {
  const update = (partial: Partial<PersonalInfoForm>) =>
    onProfileFormChange({ ...profileForm, ...partial });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="sss"
            label="SSS Number"
            value={profileForm.sss}
            onChange={(e) => update({ sss: e.target.value })}
            placeholder="00-0000000-0"
          />
          <Input
            id="tin"
            label="TIN"
            value={profileForm.tin}
            onChange={(e) => update({ tin: e.target.value })}
            placeholder="000-000-000-000"
          />
          <Input
            id="philhealth"
            label="PhilHealth"
            value={profileForm.philhealth}
            onChange={(e) => update({ philhealth: e.target.value })}
            placeholder="00-000000000-0"
          />
          <Input
            id="hdmf"
            label="HDMF (Pag-IBIG)"
            value={profileForm.hdmf}
            onChange={(e) => update({ hdmf: e.target.value })}
            placeholder="0000-0000-0000"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={profileForm.dateOfBirth}
              onChange={(e) => update({ dateOfBirth: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={profileForm.gender}
              onChange={(e) =>
                update({ gender: e.target.value as "male" | "female" })
              }
            >
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Civil Status
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={profileForm.civilStatus}
              onChange={(e) =>
                update({
                  civilStatus: e.target.value as
                    | "single"
                    | "married"
                    | "widowed"
                    | "separated",
                })
              }
            >
              <option value="">Select</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="widowed">Widowed</option>
              <option value="separated">Separated</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            id="bankName"
            label="Bank Name"
            value={profileForm.bankName}
            onChange={(e) => update({ bankName: e.target.value })}
          />
          <Input
            id="bankAccount"
            label="Bank Account Number"
            value={profileForm.bankAccount}
            onChange={(e) => update({ bankAccount: e.target.value })}
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={onSaveProfile} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
