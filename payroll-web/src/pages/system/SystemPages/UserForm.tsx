import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface UserFormData {
  username: string;
  email: string;
  displayName: string;
  password: string;
}

interface UserFormProps {
  editingId: string | null;
  formData: UserFormData;
  onChange: (data: UserFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export function UserForm({
  editingId,
  formData,
  onChange,
  onSubmit,
  onCancel,
}: UserFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{editingId ? "Edit" : "Add"} User</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="username"
              label="Username"
              value={formData.username}
              onChange={(e) =>
                onChange({ ...formData, username: e.target.value })
              }
              required
            />
            <Input
              id="email"
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                onChange({ ...formData, email: e.target.value })
              }
              required
            />
            <Input
              id="displayName"
              label="Display Name"
              value={formData.displayName}
              onChange={(e) =>
                onChange({ ...formData, displayName: e.target.value })
              }
              required
            />
            {!editingId && (
              <Input
                id="password"
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  onChange({ ...formData, password: e.target.value })
                }
                required
              />
            )}
          </div>
          <div className="flex gap-2">
            <Button type="submit">{editingId ? "Update" : "Create"}</Button>
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
