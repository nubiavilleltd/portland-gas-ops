"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, PlusCircle, Trash2, FileText } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormDatePicker from "@/components/forms/FormDatePicker";
import FormFileUpload from "@/components/forms/FormFileUpload";
import Button from "@/components/ui/Button";
import { formatNumber } from "@/lib/utils/format-number";
import EmployeePicker, { type PickedEmployee } from "@/components/ui/EmployeePicker";
import { useEmployees } from "@/lib/modules/employees/hooks";
import {
  EMPLOYEE_STORE,
  SEED_EMPLOYEE_RECORDS,
  HR_DEPT_OPTIONS,
  CATEGORY_OPTIONS,
  GRADE_OPTIONS,
  type Employee,
  type EmployeeRecord,
} from "../../_components/_data";

type EmployeeFormState = Partial<Employee>;

function calcDeductions(basic = 0, housing = 0, transport = 0, meal = 0) {
  const pension = Math.round(0.08 * (basic + housing + transport));
  const nhf     = Math.round(0.025 * basic);
  const annualGross   = (basic + housing + transport + meal) * 12;
  const annualPension = pension * 12;
  const annualNhf     = nhf * 12;
  const cra = Math.max(200_000, 0.01 * annualGross) + 0.2 * annualGross;
  const taxable = Math.max(0, annualGross - annualPension - annualNhf - cra);
  const bands: [number, number][] = [
    [300_000,   0.07],
    [300_000,   0.11],
    [500_000,   0.15],
    [500_000,   0.19],
    [1_600_000, 0.21],
    [Infinity,  0.24],
  ];
  let rem = taxable, annualTax = 0;
  for (const [cap, rate] of bands) {
    const slice = Math.min(rem, cap);
    annualTax += slice * rate;
    rem -= slice;
    if (rem <= 0) break;
  }
  return { pension, nhf, paye: Math.round(annualTax / 12) };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-brand-card border border-brand-border rounded-2xl shadow-sm">
      <div className="rounded-t-2xl border-b border-brand-border bg-gray-50 px-6 py-4">
        <h2 className="text-base font-semibold text-brand-text-primary">{title}</h2>
      </div>
      <div className="px-6 pt-5 pb-6">{children}</div>
    </div>
  );
}

export default function NewEmployeePage() {
  const router = useRouter();
  const [empForm, setEmpForm] = useState<EmployeeFormState>({});
  const [pickedManager, setPickedManager] = useState<PickedEmployee | null>(null);

  const ue = (k: keyof Employee, v: string) => setEmpForm((p) => ({ ...p, [k]: v }));
  const un = (k: keyof Employee, v: string) =>
    setEmpForm((p) => ({ ...p, [k]: v === "" ? undefined : Number(v) }));

  const computed = calcDeductions(
    empForm.basicSalary,
    empForm.housingAllowance,
    empForm.transportAllowance,
    empForm.mealAllowance,
  );

  const { data: employees = [] } = useEmployees({ limit: 200 });
  const managerPickerEmployees: PickedEmployee[] = employees.map((e) => ({
    id: e.id,
    name: e.user ? `${e.user.first_name ?? ""} ${e.user.last_name ?? ""}`.trim() : e.employee_no,
    role: e.job_title ?? "—",
    department: e.department ?? "—",
    avatar_url: e.user?.profile_picture_url ?? null,
  }));

  const DOC_TYPE_OPTIONS = [
    "Employment Contract", "ID / Passport Copy", "Certificates",
    "Safety Certification", "Disciplinary Record", "Other",
  ].map((t) => ({ value: t, label: t }));

  type PendingDoc = { uid: string; docType: string };
  const [pendingDocs, setPendingDocs] = useState<PendingDoc[]>([]);

  const addDoc    = () => setPendingDocs(p => [...p, { uid: String(Date.now()), docType: "" }]);
  const removeDoc = (uid: string) => setPendingDocs(p => p.filter(d => d.uid !== uid));
  const setDocType = (uid: string, v: string) =>
    setPendingDocs(p => p.map(d => d.uid === uid ? { ...d, docType: v } : d));

  const saveEmployee = () => {
    const newEmp = {
      ...empForm,
      paye: computed.paye,
      pension: computed.pension,
      nhf: computed.nhf,
      id: String(Date.now()),
    } as Employee;
    EMPLOYEE_STORE.push(newEmp);

    const empName = `${newEmp.firstName} ${newEmp.lastName}`;
    const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    pendingDocs.forEach((d) => {
      if (!d.docType) return;
      SEED_EMPLOYEE_RECORDS.unshift({
        id: String(Date.now()),
        employee: empName,
        docType: d.docType,
        fileName: `${empName.replace(/\s+/g, "_")}_${d.docType.replace(/\s+/g, "_")}.pdf`,
        uploadDate: today,
        uploadedBy: "HR Admin",
      } as EmployeeRecord);
    });

    router.push("/hr-management/employees");
  };

  return (
    <AppLayout pageTitle="Add Employee">
      <Link
        href="/hr-management/employees"
        className="flex items-center gap-2 text-sm font-medium text-brand-text-secondary hover:text-brand-purple transition-colors mb-5"
      >
        <ArrowLeft size={16} />
        Back to Employees
      </Link>

      <div className="mb-6">
        <h1 className="text-xl font-semibold text-brand-text-primary">Add Employee</h1>
        <p className="text-sm text-brand-text-secondary mt-0.5">Create a new employee profile</p>
      </div>

      <div className="space-y-5">
        <Section title="Personal Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="First Name" required placeholder="First name"
              value={empForm.firstName ?? ""}
              onChange={(e) => ue("firstName", e.target.value)}
            />
            <FormInput
              label="Last Name" required placeholder="Last name"
              value={empForm.lastName ?? ""}
              onChange={(e) => ue("lastName", e.target.value)}
            />
            <FormInput
              label="Email" required type="email" placeholder="email@portlandgas.com"
              value={empForm.email ?? ""}
              onChange={(e) => ue("email", e.target.value)}
            />
            <FormDatePicker
              label="Birthday"
              value={empForm.birthday ?? ""}
              onValueChange={(v) => ue("birthday", v)}
            />
          </div>
        </Section>

        <Section title="Employment Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Job Title / Role" required placeholder="e.g. Software Developer"
              value={empForm.title ?? ""}
              onChange={(e) => ue("title", e.target.value)}
            />
            <FormSelect
              label="Department" required options={HR_DEPT_OPTIONS} placeholder="Select department"
              value={empForm.department ?? ""}
              onValueChange={(v) => ue("department", v)}
            />
            <FormSelect
              label="Category" required options={CATEGORY_OPTIONS} placeholder="Select category"
              value={empForm.category ?? ""}
              onValueChange={(v) => ue("category", v)}
            />
            <FormSelect
              label="Grade Level" required options={GRADE_OPTIONS} placeholder="Select grade level"
              value={empForm.grade ?? ""}
              onValueChange={(v) => ue("grade", v)}
            />
            <EmployeePicker
              label="Operations Manager"
              employees={managerPickerEmployees}
              value={pickedManager}
              onChange={(mgr) => {
                setPickedManager(mgr);
                setEmpForm((p) => ({
                  ...p,
                  lineManager: mgr?.name ?? "",
                  lineManagerEmail: "",
                }));
              }}
            />
          </div>
        </Section>

        <Section title="Earnings">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Basic Salary" min={0} placeholder="0.00"
              onChange={(e) => {
                const rawValue = e.target.value.replace(/,/g, "");
                un("basicSalary", rawValue);
              }}
              onBlur={(e) => {
                const rawValue = e.target.value.replace(/,/g, "");
                e.target.value = formatNumber(parseFloat(rawValue) || 0);
              }}
            />
            <FormInput
              label="Housing Allowance" min={0} placeholder="0.00"
              onChange={(e) => {
                const rawValue = e.target.value.replace(/,/g, "");
                un("housingAllowance", rawValue);
              }}
              onBlur={(e) => {
                const rawValue = e.target.value.replace(/,/g, "");
                e.target.value = formatNumber(parseFloat(rawValue) || 0);
              }}
            />
            <FormInput
              label="Transport Allowance" min={0} placeholder="0.00"
              onChange={(e) => {
                const rawValue = e.target.value.replace(/,/g, "");
                un("transportAllowance", rawValue);
              }}
              onBlur={(e) => {
                const rawValue = e.target.value.replace(/,/g, "");
                e.target.value = formatNumber(parseFloat(rawValue) || 0);
              }}
            />
            <FormInput
              label="Meal Allowance" min={0} placeholder="0.00"
              onChange={(e) => {
                const rawValue = e.target.value.replace(/,/g, "");
                un("mealAllowance", rawValue);
              }}
              onBlur={(e) => {
                const rawValue = e.target.value.replace(/,/g, "");
                e.target.value = formatNumber(parseFloat(rawValue) || 0);
              }}
            />
          </div>
        </Section>

        <Section title="Deductions">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="PAYE Tax"
              value={computed.paye > 0 ? formatNumber(computed.paye) : "0.00"}
              disabled
              hint="[Annual gross − Pension − NHF − CRA] × 7/11/15/19/21/24% bands ÷ 12 · CRA = max(₦200k, 1% gross) + 20% gross"
            />
            <FormInput
              label="Pension"
              value={computed.pension > 0 ? formatNumber(computed.pension) : "0.00"}
              disabled
              hint="8% × (Basic + Housing + Transport)"
            />
            <FormInput
              label="NHF"
              value={computed.nhf > 0 ? formatNumber(computed.nhf) : "0.00"}
              disabled
              hint="2.5% × Basic Salary"
            />
            <FormInput
              label="Loan Repayment" min={0} placeholder="0.00"
              onChange={(e) => {
                const rawValue = e.target.value.replace(/,/g, "");
                un("loanRepayment", rawValue);
              }}
              onBlur={(e) => {
                const rawValue = e.target.value.replace(/,/g, "");
                e.target.value = formatNumber(parseFloat(rawValue) || 0);
              }}
            />
          </div>
        </Section>

        {/* Documents */}
        <div className="bg-brand-card border border-brand-border rounded-2xl shadow-sm">
          <div className="rounded-t-2xl border-b border-brand-border bg-gray-50 px-6 py-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-brand-text-primary">Documents</h2>
            <button
              type="button"
              onClick={addDoc}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-medium bg-brand-purple text-white hover:bg-brand-purple-dark transition-colors"
            >
              <PlusCircle size={13} />
              Add Document
            </button>
          </div>
          <div className="px-6 pt-5 pb-6">
            {pendingDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText size={32} className="text-brand-text-secondary mb-2 opacity-40" />
                <p className="text-sm text-brand-text-secondary">No documents added yet.</p>
                <p className="text-xs text-brand-text-secondary mt-1">
                  Click "Add Document" to attach files to this employee profile.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingDocs.map((doc) => (
                  <div
                    key={doc.uid}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-brand-border last:border-0 last:pb-0"
                  >
                    <FormSelect
                      label="Document Type"
                      required
                      options={DOC_TYPE_OPTIONS}
                      placeholder="Select type"
                      value={doc.docType}
                      onValueChange={(v) => setDocType(doc.uid, v)}
                    />
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <FormFileUpload
                          label="Upload File"
                          hint="PDF, DOC, JPG — max 10 MB"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDoc(doc.uid)}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition mb-1"
                        title="Remove"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 pb-4">
          <Button onClick={saveEmployee}>Create Employee</Button>
          <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </div>
    </AppLayout>
  );
}
