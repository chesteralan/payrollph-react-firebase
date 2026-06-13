import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { db, storage } from "@/config/firebase";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";
import { ArrowLeft } from "lucide-react";
import type {
  DocumentCategory,
  Employee,
  EmployeeContact,
  EmployeeDocument,
  EmployeeProfile,
  EmployeeSalary,
  ProfileTab,
  SelectOption,
} from "./EmployeeProfilePage.types";
import { ProfileTabs } from "./ProfileTabs";
import { EmploymentDetails } from "./EmploymentDetails";
import { PersonalInfoSection } from "./PersonalInfoSection";
import { ContactInfoCard } from "./ContactInfoCard";
import { SalaryCard } from "./SalaryCard";
import { DTRHistoryCard } from "./DTRHistoryCard";
import { DocumentsCard } from "./DocumentsCard";

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
  const [groups, setGroups] = useState<SelectOption[]>([]);
  const [positions, setPositions] = useState<SelectOption[]>([]);
  const [areas, setAreas] = useState<SelectOption[]>([]);
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

  const loadData = useCallback(async () => {
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
  }, [id]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (id) loadData();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [id, loadData]);

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
      addToast({
        type: "error",
        title: "Upload failed",
        message: error instanceof Error ? error.message : String(error),
      });
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (document: EmployeeDocument) => {
    try {
      if (document.storagePath) {
        await deleteObject(ref(storage, document.storagePath));
      }
      await deleteDoc(doc(db, "employee_documents", document.id));
      addToast({
        type: "success",
        title: "Document deleted",
        message: `${doc.fileName} deleted successfully`,
      });
      loadData();
    } catch (error) {
      addToast({
        type: "error",
        title: "Delete failed",
        message: error instanceof Error ? error.message : String(error),
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

      <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "info" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EmploymentDetails
            employee={employee}
            groups={groups}
            positions={positions}
            areas={areas}
            onUpdateEmployee={handleUpdateEmployee}
          />
          <PersonalInfoSection
            profileForm={profileForm}
            onProfileFormChange={setProfileForm}
            onSaveProfile={handleSaveProfile}
            saving={saving}
          />
        </div>
      )}

      {activeTab === "contact" && (
        <ContactInfoCard
          contacts={contacts}
          showContactForm={showContactForm}
          contactForm={contactForm}
          onContactFormChange={setContactForm}
          onShowContactFormChange={setShowContactForm}
          onAddContact={handleAddContact}
          onDeleteContact={handleDeleteContact}
        />
      )}

      {activeTab === "compensation" && (
        <SalaryCard
          salaryForm={salaryForm}
          onSalaryFormChange={setSalaryForm}
          salary={salary}
          onSaveSalary={handleSaveSalary}
          saving={saving}
          formatCurrency={formatCurrency}
        />
      )}

      {activeTab === "dtr" && <DTRHistoryCard />}

      {activeTab === "documents" && (
        <DocumentsCard
          documents={documents}
          selectedFile={selectedFile}
          uploading={uploading}
          uploadProgress={uploadProgress}
          docCategory={docCategory}
          docNotes={docNotes}
          onFileSelect={handleFileSelect}
          onDocCategoryChange={setDocCategory}
          onDocNotesChange={setDocNotes}
          onUpload={handleUpload}
          onDeleteDocument={handleDeleteDocument}
          formatFileSize={formatFileSize}
        />
      )}
    </div>
  );
}
