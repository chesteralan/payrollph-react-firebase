// @ts-nocheck
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "../../config/firebase";
import { Button } from "../../components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Users,
  FileText,
  Upload,
  Download,
  File,
} from "lucide-react";
import type {
  Employee,
  EmployeeContact,
  EmployeeProfile,
  EmployeeSalary,
  EmployeeDocument,
  DocumentCategory,
} from "../../types";

type ProfileTab = "info" | "contact" | "compensation" | "dtr" | "documents";

export function EmployeeProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<ProfileTab>("info");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [contacts, setContacts] = useState<EmployeeContact[]>([]);
  const [salary, setSalary] = useState<EmployeeSalary | null>(null);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [positions, setPositions] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [areas, setAreas] = useState<{ id: string; name: string }[]>([]);
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docCategory, setDocCategory] = useState<DocumentCategory>("Other");
  const [docNotes, setDocNotes] = useState("");

  const [profileForm, setProfileForm] = useState({
    sss: "",
    tin: "",
    philhealth: "",
    hdmf: "",
    bankName: "",
    bankAccount: "",
    dateOfBirth: "",
    gender: "" as "male" | "female" | "",
    civilStatus: "" as "single" | "married" | "widowed" | "separated" | "",
  });

  const [contactForm, setContactForm] = useState({
    type: "phone" as "phone" | "email" | "address",
    value: "",
    isPrimary: false,
  });
  const [showContactForm, setShowContactForm] = useState(false);

  const [salaryForm, setSalaryForm] = useState({
    amount: "",
    frequency: "monthly" as "monthly" | "semi-monthly" | "weekly" | "daily",
    effectiveDate: "",
  });

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [
        empSnap,
        profileSnap,
        contactsSnap,
        salarySnap,
        groupsSnap,
        positionsSnap,
        areasSnap,
        docsSnap,
      ] = await Promise.all([
        getDoc(doc(db, "employees", id)),
        getDocs(
          query(
            collection(db, "employee_profiles"),
            where("employeeId", "==", id),
          ),
        ),
        getDocs(
          query(
            collection(db, "employee_contacts"),
            where("employeeId", "==", id),
          ),
        ),
        getDocs(
          query(
            collection(db, "employee_salaries"),
            where("employeeId", "==", id),
            where("isActive", "==", true),
          ),
        ),
        getDocs(query(collection(db, "employees_groups"))),
        getDocs(query(collection(db, "employees_positions"))),
        getDocs(query(collection(db, "employees_areas"))),
        getDocs(
          query(
            collection(db, "employee_documents"),
            where("employeeId", "==", id),
          ),
        ),
      ]);

      if (empSnap.exists())
        setEmployee({ id: empSnap.id, ...empSnap.data() } as Employee);
      if (!profileSnap.empty) {
        const p = profileSnap.docs[0].data();
        setProfile({ id: profileSnap.docs[0].id, ...p } as EmployeeProfile);
        setProfileForm({
          sss: p.sss || "",
          tin: p.tin || "",
          philhealth: p.philhealth || "",
          hdmf: p.hdmf || "",
          bankName: p.bankName || "",
          bankAccount: p.bankAccount || "",
          dateOfBirth: p.dateOfBirth
            ? new Date(p.dateOfBirth).toISOString().split("T")[0]
            : "",
          gender: p.gender || "",
          civilStatus: p.civilStatus || "",
        });
      }
      setContacts(
        contactsSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as EmployeeContact[],
      );
      if (!salarySnap.empty) {
        const s = salarySnap.docs[0].data();
        setSalary({ id: salarySnap.docs[0].id, ...s } as EmployeeSalary);
        setSalaryForm({
          amount: String(s.amount || ""),
          frequency: s.frequency || "monthly",
          effectiveDate: s.effectiveDate
            ? new Date(s.effectiveDate).toISOString().split("T")[0]
            : "",
        });
      }
      setGroups(
        groupsSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as { name: string }),
        })),
      );
      setPositions(
        positionsSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as { name: string }),
        })),
      );
      setAreas(
        areasSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as { name: string }),
        })),
      );
      setDocuments(
        docsSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as EmployeeDocument[],
      );
    } finally {
      setLoading(false);
    }
  };

  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    if (id) loadData();
  }, [id]);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  const handleSaveProfile = async () => {
    if (!id || !employee) return;
    setSaving(true);
    try {
      const data = {
        employeeId: id,
        nameId: employee.nameId,
        ...profileForm,
        dateOfBirth: profileForm.dateOfBirth
          ? new Date(profileForm.dateOfBirth)
          : null,
        updatedAt: new Date(),
      };
      if (profile) {
        await updateDoc(doc(db, "employee_profiles", profile.id), data);
      } else {
        const ref = await addDoc(collection(db, "employee_profiles"), {
          ...data,
          createdAt: new Date(),
        });
        setProfile({ id: ref.id, ...data } as EmployeeProfile);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAddContact = async () => {
    if (!id || !contactForm.value) return;
    await addDoc(collection(db, "employee_contacts"), {
      employeeId: id,
      ...contactForm,
      createdAt: new Date(),
    });
    setContactForm({ type: "phone", value: "", isPrimary: false });
    setShowContactForm(false);
    loadData();
  };

  const handleDeleteContact = async (contactId: string) => {
    if (confirm("Delete this contact?")) {
      await deleteDoc(doc(db, "employee_contacts", contactId));
      loadData();
    }
  };

  const handleSaveSalary = async () => {
    if (!id || !salaryForm.amount) return;
    setSaving(true);
    try {
      const data = {
        employeeId: id,
        amount: Number(salaryForm.amount),
        frequency: salaryForm.frequency,
        effectiveDate: salaryForm.effectiveDate
          ? new Date(salaryForm.effectiveDate)
          : new Date(),
        isPrimary: true,
        isActive: true,
      };
      if (salary) {
        await updateDoc(doc(db, "employee_salaries", salary.id), data);
        setSalary({ ...salary, ...data });
      } else {
        const ref = await addDoc(collection(db, "employee_salaries"), {
          ...data,
          createdAt: new Date(),
        });
        setSalary({ id: ref.id, ...data } as EmployeeSalary);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateEmployee = async (field: string, value: string) => {
    if (!employee) return;
    await updateDoc(doc(db, "employees", employee.id), {
      [field]: value,
      updatedAt: new Date(),
    });
    setEmployee({ ...employee, [field]: value });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !id) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const storagePath = `employees/${id}/${Date.now()}_${selectedFile.name}`;
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, selectedFile);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          addToast({
            type: "error",
            title: "Upload failed",
            message: error.message,
          });
          setUploading(false);
        },
        async () => {
          const fileUrl = await getDownloadURL(uploadTask.snapshot.ref);
          await addDoc(collection(db, "employee_documents"), {
            employeeId: id,
            fileName: selectedFile.name,
            fileType: selectedFile.type,
            fileSize: selectedFile.size,
            fileUrl,
            storagePath,
            uploadedAt: new Date(),
            category: docCategory,
            notes: docNotes || null,
          });
          addToast({
            type: "success",
            title: "Document uploaded",
            message: `${selectedFile.name} uploaded successfully`,
          });
          setSelectedFile(null);
          setDocNotes("");
          setUploadProgress(0);
          setUploading(false);
          loadData();
        },
      );
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      addToast({
        type: "error",
        title: "Upload failed",
        message: (error as any).message,
      });
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (doc: EmployeeDocument) => {
    try {
      if (doc.storagePath) {
        await deleteObject(ref(storage, doc.storagePath));
      }
      await deleteDoc(doc(db, "employee_documents", doc.id));
      addToast({
        type: "success",
        title: "Document deleted",
        message: `${doc.fileName} deleted successfully`,
      });
      loadData();
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      addToast({
        type: "error",
        title: "Delete failed",
        message: (error as any).message,
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatCurrency = (value: number) =>
    value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  if (loading || !employee)
    return <div className="text-center py-12 text-gray-500">Loading...</div>;

  const TABS: { key: ProfileTab; label: string; icon: React.ReactNode }[] = [
    {
      key: "info",
      label: "Personal Info",
      icon: <Users className="w-4 h-4" />,
    },
    { key: "contact", label: "Contact", icon: <Phone className="w-4 h-4" /> },
    {
      key: "compensation",
      label: "Compensation",
      icon: <Briefcase className="w-4 h-4" />,
    },
    { key: "dtr", label: "DTR History", icon: <MapPin className="w-4 h-4" /> },
    {
      key: "documents",
      label: "Documents",
      icon: <FileText className="w-4 h-4" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/employees")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {employee.employeeCode}
          </h1>
          <p className="text-gray-500">Employee Profile</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "info" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Employment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Group
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={employee.groupId || ""}
                    onChange={(e) =>
                      handleUpdateEmployee("groupId", e.target.value)
                    }
                  >
                    <option value="">Select Group</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={employee.positionId || ""}
                    onChange={(e) =>
                      handleUpdateEmployee("positionId", e.target.value)
                    }
                  >
                    <option value="">Select Position</option>
                    {positions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Area
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={employee.areaId || ""}
                    onChange={(e) =>
                      handleUpdateEmployee("areaId", e.target.value)
                    }
                  >
                    <option value="">Select Area</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
                    value={employee.statusId}
                    readOnly
                  />
                </div>
                <Input
                  id="hireDate"
                  label="Hire Date"
                  type="date"
                  value={
                    employee.hireDate
                      ? new Date(employee.hireDate).toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    handleUpdateEmployee("hireDate", e.target.value)
                  }
                />
                <Input
                  id="regularizationDate"
                  label="Regularization Date"
                  type="date"
                  value={
                    employee.regularizationDate
                      ? new Date(employee.regularizationDate)
                          .toISOString()
                          .split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    handleUpdateEmployee("regularizationDate", e.target.value)
                  }
                />
              </div>
            </CardContent>
          </Card>

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
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, sss: e.target.value })
                  }
                  placeholder="00-0000000-0"
                />
                <Input
                  id="tin"
                  label="TIN"
                  value={profileForm.tin}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, tin: e.target.value })
                  }
                  placeholder="000-000-000-000"
                />
                <Input
                  id="philhealth"
                  label="PhilHealth"
                  value={profileForm.philhealth}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      philhealth: e.target.value,
                    })
                  }
                  placeholder="00-000000000-0"
                />
                <Input
                  id="hdmf"
                  label="HDMF (Pag-IBIG)"
                  value={profileForm.hdmf}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, hdmf: e.target.value })
                  }
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
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        dateOfBirth: e.target.value,
                      })
                    }
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
                      setProfileForm({
                        ...profileForm,
                        gender: e.target.value as "male" | "female",
                      })
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
                      setProfileForm({
                        ...profileForm,
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
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, bankName: e.target.value })
                  }
                />
                <Input
                  id="bankAccount"
                  label="Bank Account Number"
                  value={profileForm.bankAccount}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      bankAccount: e.target.value,
                    })
                  }
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "contact" && (
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
                      setContactForm({
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
                      setContactForm({ ...contactForm, value: e.target.value })
                    }
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={contactForm.isPrimary}
                      onChange={(e) =>
                        setContactForm({
                          ...contactForm,
                          isPrimary: e.target.checked,
                        })
                      }
                    />
                    Primary
                  </label>
                  <Button onClick={handleAddContact}>Add</Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowContactForm(false)}
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
                    onClick={() => handleDeleteContact(contact.id)}
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
                onClick={() => setShowContactForm(true)}
                className="mt-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Contact
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "compensation" && (
        <Card>
          <CardHeader>
            <CardTitle>Salary & Compensation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                Current Salary
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <Input
                  id="salaryAmount"
                  label="Amount"
                  type="number"
                  value={salaryForm.amount}
                  onChange={(e) =>
                    setSalaryForm({ ...salaryForm, amount: e.target.value })
                  }
                  placeholder="0.00"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frequency
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={salaryForm.frequency}
                    onChange={(e) =>
                      setSalaryForm({
                        ...salaryForm,
                        frequency: e.target.value as
                          | "monthly"
                          | "semi-monthly"
                          | "weekly"
                          | "daily",
                      })
                    }
                  >
                    <option value="monthly">Monthly</option>
                    <option value="semi-monthly">Semi-monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="daily">Daily</option>
                  </select>
                </div>
                <Input
                  id="effectiveDate"
                  label="Effective Date"
                  type="date"
                  value={salaryForm.effectiveDate}
                  onChange={(e) =>
                    setSalaryForm({
                      ...salaryForm,
                      effectiveDate: e.target.value,
                    })
                  }
                />
              </div>
              {salary && (
                <div className="mt-4 text-sm text-gray-500">
                  Effective:{" "}
                  {new Date(salary.effectiveDate).toLocaleDateString()}
                </div>
              )}
              <div className="flex justify-end mt-4">
                <Button onClick={handleSaveSalary} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Saving..." : "Save Salary"}
                </Button>
              </div>
            </div>

            {salary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">Monthly Rate</div>
                  <div className="text-lg font-semibold">
                    {formatCurrency(
                      salary.frequency === "monthly"
                        ? salary.amount
                        : salary.frequency === "semi-monthly"
                          ? salary.amount * 2
                          : salary.frequency === "weekly"
                            ? salary.amount * 4.33
                            : salary.amount * 22,
                    )}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">Daily Rate</div>
                  <div className="text-lg font-semibold">
                    {formatCurrency(
                      salary.frequency === "daily"
                        ? salary.amount
                        : salary.amount / 22,
                    )}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">Hourly Rate</div>
                  <div className="text-lg font-semibold">
                    {formatCurrency(
                      (salary.frequency === "daily"
                        ? salary.amount
                        : salary.amount / 22) / 8,
                    )}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">Pay Frequency</div>
                  <div className="text-lg font-semibold capitalize">
                    {salary.frequency}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "dtr" && (
        <Card>
          <CardHeader>
            <CardTitle>DTR History</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-500 py-8">
              Attendance records will appear here once DTR entries are created.
            </p>
          </CardContent>
        </Card>
      )}

      {activeTab === "documents" && (
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                Upload New Document
              </h3>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                  <input
                    type="file"
                    id="fileUpload"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <label htmlFor="fileUpload" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {selectedFile
                        ? selectedFile.name
                        : "Click to select a file or drag and drop"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Any file type supported
                    </p>
                  </label>
                </div>

                {selectedFile && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        value={docCategory}
                        onChange={(e) =>
                          setDocCategory(e.target.value as DocumentCategory)
                        }
                      >
                        <option value="ID">ID</option>
                        <option value="Contract">Contract</option>
                        <option value="Tax Form">Tax Form</option>
                        <option value="Medical">Medical</option>
                        <option value="Certificate">Certificate</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes (Optional)
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="Add notes about this document"
                        value={docNotes}
                        onChange={(e) => setDocNotes(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {uploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Uploading...</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {selectedFile && (
                  <div className="flex justify-end">
                    <Button onClick={handleUpload} disabled={uploading}>
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? "Uploading..." : "Upload Document"}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                Uploaded Documents
              </h3>
              {documents.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No documents uploaded yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 font-medium text-gray-600">
                          File Name
                        </th>
                        <th className="text-left py-2 px-3 font-medium text-gray-600">
                          Category
                        </th>
                        <th className="text-left py-2 px-3 font-medium text-gray-600">
                          Size
                        </th>
                        <th className="text-left py-2 px-3 font-medium text-gray-600">
                          Upload Date
                        </th>
                        <th className="text-right py-2 px-3 font-medium text-gray-600">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((doc) => (
                        <tr
                          key={doc.id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <File className="w-4 h-4 text-gray-400" />
                              <span className="font-medium text-gray-900">
                                {doc.fileName}
                              </span>
                            </div>
                            {doc.notes && (
                              <p className="text-xs text-gray-500 mt-0.5 ml-6">
                                {doc.notes}
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              {doc.category}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-gray-500">
                            {formatFileSize(doc.fileSize)}
                          </td>
                          <td className="py-3 px-3 text-gray-500">
                            {new Date(doc.uploadedAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex justify-end gap-2">
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-600 hover:text-primary-700"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                              <ConfirmDialog
                                title="Delete Document"
                                message={`Delete "${doc.fileName}"? This action cannot be undone.`}
                                confirmText="Delete"
                                onConfirm={() => handleDeleteDocument(doc)}
                              >
                                {(open) => (
                                  <button
                                    onClick={open}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </ConfirmDialog>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
