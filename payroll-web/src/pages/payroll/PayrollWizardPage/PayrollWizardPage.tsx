import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Stepper } from "@/components/ui/Stepper";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type {
  PayrollGroup,
  PayrollTemplate,
  EmployeeGroup,
  EmployeePosition,
  EmployeeArea,
  EmployeeStatus,
  Term,
} from "./PayrollWizardPage.types";
import { PayrollConfigStep } from "./PayrollConfigStep";
import { InclusiveDatesStep } from "./InclusiveDatesStep";
import { GroupsStep } from "./GroupsStep";
import { EmployeeSelectionStep } from "./EmployeeSelectionStep";
import { ReviewStep } from "./ReviewStep";

const STEPS = [
  "Config",
  "Inclusive Dates",
  "Groups",
  "Employees",
  "Review & Generate",
];

export function PayrollWizardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentCompanyId } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    templateId: "",
    termId: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [inclusiveDates, setInclusiveDates] = useState<Date[]>([]);
  const [groups, setGroups] = useState<PayrollGroup[]>([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [templates, setTemplates] = useState<
    { id: string; name: string; data?: PayrollTemplate }[]
  >([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [employees, setEmployees] = useState<
    { id: string; nameId: string; employeeCode: string }[]
  >([]);
  const [dateStr, setDateStr] = useState("");
  const [lookups, setLookups] = useState({
    groups: [] as EmployeeGroup[],
    positions: [] as EmployeePosition[],
    areas: [] as EmployeeArea[],
    statuses: [] as EmployeeStatus[],
  });

  const fetchTerms = async () => {
    const snap = await getDocs(
      query(collection(db, "payroll_terms"), where("isActive", "==", true)),
    );
    setTerms(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Term[]);
  };

  const fetchTemplates = async () => {
    if (!currentCompanyId) return;
    const snap = await getDocs(
      query(
        collection(db, "payroll_templates"),
        where("companyId", "==", currentCompanyId),
      ),
    );
    setTemplates(
      snap.docs.map((d) => ({
        id: d.id,
        name: (d.data() as { name: string }).name,
        data: d.data() as PayrollTemplate,
      })),
    );
  };

  const fetchLookups = async () => {
    const [gSnap, pSnap, aSnap, sSnap] = await Promise.all([
      getDocs(
        query(collection(db, "employee_groups"), where("isActive", "==", true)),
      ),
      getDocs(
        query(
          collection(db, "employee_positions"),
          where("isActive", "==", true),
        ),
      ),
      getDocs(
        query(collection(db, "employee_areas"), where("isActive", "==", true)),
      ),
      getDocs(
        query(
          collection(db, "employee_statuses"),
          where("isActive", "==", true),
        ),
      ),
    ]);
    setLookups({
      groups: gSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as EmployeeGroup[],
      positions: pSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as EmployeePosition[],
      areas: aSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as EmployeeArea[],
      statuses: sSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as EmployeeStatus[],
    });
  };

  const fetchEmployees = async () => {
    if (!currentCompanyId) return;
    const snap = await getDocs(
      query(
        collection(db, "employees"),
        where("companyId", "==", currentCompanyId),
      ),
    );
    setEmployees(
      snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as { nameId: string; employeeCode: string }),
      })),
    );
  };

  const fetchPayroll = async () => {
    if (!id) return;
    const snap = await getDoc(doc(db, "payroll", id));
    if (snap.exists()) {
      const data = snap.data() as {
        name: string;
        month: number;
        year: number;
        templateId?: string;
        termId?: string;
      };
      setFormData({
        name: data.name,
        month: data.month,
        year: data.year,
        templateId: data.templateId || "",
        termId: data.termId || "",
      });

      const [datesSnap, groupsSnap] = await Promise.all([
        getDocs(
          query(
            collection(db, "payroll_inclusive_dates"),
            where("payrollId", "==", id),
          ),
        ),
        getDocs(
          query(collection(db, "payroll_groups"), where("payrollId", "==", id)),
        ),
      ]);
      setInclusiveDates(
        datesSnap.docs.map((d) =>
          (d.data() as { date: { toDate: () => Date } }).date.toDate(),
        ),
      );
      setGroups(
        groupsSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<PayrollGroup, "id">),
        })),
      );
    }
  };

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (currentCompanyId) {
      fetchTemplates();
      fetchTerms();
      fetchLookups();
      fetchEmployees();
      if (id) fetchPayroll();
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, currentCompanyId]);

  const generateDatesFromTerm = (term: Term) => {
    const dates: Date[] = [];
    const { year, month } = formData;
    const daysInMonth = new Date(year, month, 0).getDate();

    if (term.type === "monthly") {
      for (
        let i = 1;
        i <= Math.min(term.daysPerPeriod || daysInMonth, daysInMonth);
        i++
      ) {
        dates.push(new Date(year, month - 1, i));
      }
    } else if (term.type === "semi-monthly") {
      for (let i = 1; i <= 15; i++) dates.push(new Date(year, month - 1, i));
      const secondHalfStart = 16;
      const secondHalfEnd = term.daysPerPeriod || daysInMonth;
      for (
        let i = secondHalfStart;
        i <= Math.min(secondHalfEnd, daysInMonth);
        i++
      ) {
        dates.push(new Date(year, month - 1, i));
      }
    } else if (term.type === "weekly" || term.type === "bi-weekly") {
      const weeks = term.type === "bi-weekly" ? 2 : 4;
      const daysPerWeek = term.daysPerPeriod
        ? Math.floor(term.daysPerPeriod / weeks)
        : 7;
      for (let w = 0; w < weeks; w++) {
        for (let d = 1; d <= daysPerWeek; d++) {
          const date = new Date(year, month - 1, w * 7 + d);
          if (date.getMonth() === month - 1) dates.push(date);
        }
      }
    }
    return dates;
  };

  const handleTermChange = (termId: string) => {
    setFormData({ ...formData, termId });
    if (termId) {
      const term = terms.find((t) => t.id === termId);
      if (term) {
        const dates = generateDatesFromTerm(term);
        setInclusiveDates(dates);
      }
    }
  };

  useEffect(() => {
    if (!formData.templateId) return;
    const tmpl = templates.find((t) => t.id === formData.templateId)?.data;
    if (!tmpl) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    if (tmpl.groupBy)
      setFormData((prev) => ({ ...prev, templateId: formData.templateId }));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [formData.templateId, templates]);

  const createPayroll = async (): Promise<string> => {
    if (!currentCompanyId) throw new Error("No company selected");
    const docRef = await addDoc(collection(db, "payroll"), {
      name: formData.name,
      month: formData.month,
      year: formData.year,
      templateId: formData.templateId || null,
      termId: formData.termId || null,
      companyId: currentCompanyId,
      status: "draft",
      isActive: true,
      isLocked: false,
      createdBy: currentCompanyId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  };

  const handleNext = async () => {
    if (step === 0) {
      const newErrors: Record<string, string> = {};
      if (!formData.name.trim()) newErrors.name = "Payroll name is required";
      if (formData.year < 2000 || formData.year > 2100)
        newErrors.year = "Year must be between 2000 and 2100";
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      setErrors({});
      setLoading(true);
      try {
        let payrollId = id;
        if (!payrollId) {
          payrollId = await createPayroll();
        } else {
          await updateDoc(doc(db, "payroll", payrollId), {
            name: formData.name,
            month: formData.month,
            year: formData.year,
            templateId: formData.templateId || null,
            termId: formData.termId || null,
          });
        }
        navigate(`/payroll/${payrollId}/wizard`, { replace: true });
        setStep(1);
      } finally {
        setLoading(false);
      }
    } else if (step === 1) {
      if (inclusiveDates.length === 0) {
        setErrors({ dates: "Add at least one inclusive date" });
        return;
      }
      setErrors({});
      setLoading(true);
      try {
        const payrollId = id || (await createPayroll());
        const existing = await getDocs(
          query(
            collection(db, "payroll_inclusive_dates"),
            where("payrollId", "==", payrollId),
          ),
        );
        for (const d of existing.docs)
          await deleteDoc(doc(db, "payroll_inclusive_dates", d.id));
        for (const date of inclusiveDates) {
          await addDoc(collection(db, "payroll_inclusive_dates"), {
            payrollId,
            date,
          });
        }
        setStep(2);
      } finally {
        setLoading(false);
      }
    } else if (step === 2) {
      setLoading(true);
      try {
        const payrollId = id!;
        const existing = await getDocs(
          query(
            collection(db, "payroll_groups"),
            where("payrollId", "==", payrollId),
          ),
        );
        for (const d of existing.docs)
          await deleteDoc(doc(db, "payroll_groups", d.id));
        for (let i = 0; i < groups.length; i++) {
          const { ...groupData } = groups[i];
          await addDoc(collection(db, "payroll_groups"), {
            ...groupData,
            payrollId,
            order: i,
            page: 1,
          });
        }
        setStep(3);
      } finally {
        setLoading(false);
      }
    } else {
      setStep(step + 1);
    }
  };

  const handleBack = () => setStep(Math.max(0, step - 1));

  const addDate = () => {
    if (dateStr) {
      setInclusiveDates([...inclusiveDates, new Date(dateStr)]);
      setDateStr("");
    }
  };

  const removeDate = (index: number) =>
    setInclusiveDates(inclusiveDates.filter((_, i) => i !== index));

  const addGroup = (group: PayrollGroup) => setGroups([...groups, group]);

  const removeGroup = (index: number) =>
    setGroups(groups.filter((_, i) => i !== index));

  const toggleEmployee = (empId: string) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(empId)
        ? prev.filter((eid) => eid !== empId)
        : [...prev, empId],
    );
  };

  const steps = STEPS.map((label, i) => ({
    label,
    completed: i < step,
    active: i === step,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Payroll Setup Wizard
          </h1>
          <p className="text-gray-500 mt-1">
            {formData.name || "New Payroll Run"}
          </p>
        </div>
        <Button variant="ghost" onClick={() => navigate("/payroll")}>
          Cancel
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Stepper steps={steps} />
        </CardContent>
      </Card>

      {step === 0 && (
        <PayrollConfigStep
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          setErrors={setErrors}
          templates={templates}
          terms={terms}
          onTermChange={handleTermChange}
          onNext={handleNext}
          loading={loading}
        />
      )}

      {step === 1 && (
        <InclusiveDatesStep
          errors={errors}
          dateStr={dateStr}
          onDateStrChange={setDateStr}
          inclusiveDates={inclusiveDates}
          onAddDate={addDate}
          onRemoveDate={removeDate}
          onNext={handleNext}
          onBack={handleBack}
          loading={loading}
        />
      )}

      {step === 2 && (
        <GroupsStep
          groups={groups}
          onAddGroup={addGroup}
          onRemoveGroup={removeGroup}
          onNext={handleNext}
          onBack={handleBack}
          loading={loading}
          lookups={lookups}
        />
      )}

      {step === 3 && (
        <EmployeeSelectionStep
          employees={employees}
          selectedEmployeeIds={selectedEmployeeIds}
          onToggleEmployee={toggleEmployee}
          onNext={handleNext}
          onBack={handleBack}
        />
      )}

      {step === 4 && (
        <ReviewStep
          formData={formData}
          templates={templates}
          inclusiveDates={inclusiveDates}
          groups={groups}
          selectedEmployeeIds={selectedEmployeeIds}
          employees={employees}
          id={id}
          onBack={handleBack}
        />
      )}

      {step < 4 && (
        <div className="flex justify-between">
          {step > 0 && (
            <Button variant="ghost" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <div className="ml-auto">
            <Button onClick={handleNext} disabled={loading}>
              {loading ? "Saving..." : step < 4 ? "Next" : "Complete"}{" "}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
