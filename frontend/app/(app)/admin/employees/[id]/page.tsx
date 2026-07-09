"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, PlusCircle, Eye, Download, Trash2, FileText } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormDatePicker from "@/components/forms/FormDatePicker";
import FormFileUpload from "@/components/forms/FormFileUpload";
import Button from "@/components/ui/Button";
import { formatNumber } from "@/lib/utils/format-number";
import {
  LEAVE_TYPES,
  HR_DEPT_OPTIONS,
  CATEGORY_OPTIONS,
  GRADE_OPTIONS,
  fmtDate,
} from "../../_components/_data";
import {
  useEmployee,
  useUpdateEmployee,
  useEmployees,
  useEmployeeDocuments,
  useUploadEmployeeDocument,
  useDeleteEmployeeDocument,
} from "@/lib/modules/employees/hooks";
import type { Department, EmploymentType } from "@/lib/modules/employees/types";
import EmployeePicker, { type PickedEmployee } from "@/components/ui/EmployeePicker";
import { useToast } from "@/hooks/useToast";

const YEAR = new Date().getFullYear();

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

function BalanceCard({ type, used, entitlement }: { type: string; used: number; entitlement: number }) {
  const remaining = Math.max(0, entitlement - used);
  const pct = entitlement > 0 ? Math.min(100, (remaining / entitlement) * 100) : 100;
  const barColor  = pct <= 20 ? "bg-red-500"  : pct <= 50 ? "bg-amber-500" : "bg-brand-purple";
  const textColor = pct <= 20 ? "text-red-600" : pct <= 50 ? "text-amber-600" : "text-brand-text-primary";
  return (
    <div className="bg-brand-card border border-brand-border rounded-xl p-4 flex flex-col">
      <p className="text-xs font-semibold text-brand-text-secondary line-clamp-2 h-7">{type}</p>
      <p className={`text-2xl font-bold mt-1 ${textColor}`}>{remaining}</p>
      <p className="text-xs text-brand-text-secondary flex-grow">of {entitlement} days remaining</p>
      <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-brand-text-secondary mt-1.5">{used} days used</p>
    </div>
  );
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

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "Full-time", label: "Full-time" },
  { value: "Part-time", label: "Part-time" },
  { value: "Contract",  label: "Contract"  },
  { value: "Intern",    label: "Intern"    },
];

type EditForm = Partial<{
  firstName: string; lastName: string; email: string; birthday: string;
  title: string; department: string; category: string; grade: string;
  basicSalary: number; housingAllowance: number; transportAllowance: number;
  mealAllowance: number; loanRepayment: number;
}>;

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: emp, isLoading } = useEmployee(id);
  const update = useUpdateEmployee(id);
  const toast  = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [empForm, setEmpForm] = useState<EditForm>({});
  const [pickedManager, setPickedManager] = useState<PickedEmployee | null>(null);

  const { data: docs = [] } = useEmployeeDocuments(id);
  const uploadDoc  = useUploadEmployeeDocument(id);
  const deleteDoc  = useDeleteEmployeeDocument(id);

  // Employees list for the manager picker
  const { data: allEmployees = [] } = useEmployees({ limit: 200 });
  const managerPickerEmployees: PickedEmployee[] = allEmployees
    .filter((e) => e.id !== id)
    .map((e) => ({
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

  type PendingDoc = { uid: string; docType: string; file: File | null };
  const [pendingDocs, setPendingDocs] = useState<PendingDoc[]>([]);

  const addDoc       = () => setPendingDocs(p => [...p, { uid: String(Date.now()), docType: "", file: null }]);
  const removePending = (uid: string) => setPendingDocs(p => p.filter(d => d.uid !== uid));
  const setDocType   = (uid: string, v: string) => setPendingDocs(p => p.map(d => d.uid === uid ? { ...d, docType: v } : d));
  const setDocFile   = (uid: string, file: File | null) => setPendingDocs(p => p.map(d => d.uid === uid ? { ...d, file } : d));

  const ue = (k: keyof EditForm, v: string) => setEmpForm(p => ({ ...p, [k]: v }));
  const un = (k: keyof EditForm, v: string) =>
    setEmpForm(p => ({ ...p, [k]: v === "" ? undefined : Number(v.replace(/,/g, "")) }));

  const openEdit  = () => {
    if (!emp) return;
    setEmpForm({
      firstName:        emp.user?.first_name    ?? "",
      lastName:         emp.user?.last_name     ?? "",
      email:            emp.user?.email         ?? "",
      birthday:         emp.birthday            ?? "",
      title:            emp.job_title           ?? "",
      department:       emp.department          ?? "",
      category:         emp.employment_type     ?? "",
      basicSalary:      emp.basic_salary        ? Number(emp.basic_salary)        : undefined,
      housingAllowance: emp.housing_allowance   ? Number(emp.housing_allowance)   : undefined,
      transportAllowance: emp.transport_allowance ? Number(emp.transport_allowance) : undefined,
      mealAllowance:    emp.meal_allowance      ? Number(emp.meal_allowance)      : undefined,
      loanRepayment:    emp.loan_repayment      ? Number(emp.loan_repayment)      : undefined,
    });
    if (emp.operating_manager?.user) {
      const mgrUser = emp.operating_manager.user;
      const mgrName = `${mgrUser.first_name ?? ""} ${mgrUser.last_name ?? ""}`.trim();
      setPickedManager({
        id:         emp.operating_manager.id,
        name:       mgrName,
        role:       emp.operating_manager.job_title ?? "—",
        department: emp.operating_manager.department ?? "—",
        avatar_url: emp.operating_manager.user.profile_picture_url ?? null,
      });
    } else {
      setPickedManager(null);
    }
    setIsEditing(true);
  };
  const cancelEdit = () => { setIsEditing(false); setEmpForm({}); setPickedManager(null); setPendingDocs([]); };

  const computed = calcDeductions(
    empForm.basicSalary, empForm.housingAllowance,
    empForm.transportAllowance, empForm.mealAllowance,
  );

  const saveEmployee = async () => {
    // Capture pending uploads before clearing state
    const toUpload = pendingDocs.filter(d => d.file && d.docType);

    // 1. Save employee details — if this fails, stay in edit mode
    try {
      await update.mutateAsync({
        first_name:           empForm.firstName                    || undefined,
        last_name:            empForm.lastName                     || undefined,
        job_title:            empForm.title                        || undefined,
        department:           (empForm.department as Department)   || undefined,
        employment_type:      (empForm.category as EmploymentType) || undefined,
        birthday:             empForm.birthday                     || undefined,
        operating_manager_id: pickedManager?.id                   ?? null,
        basic_salary:         empForm.basicSalary,
        housing_allowance:    empForm.housingAllowance,
        transport_allowance:  empForm.transportAllowance,
        meal_allowance:       empForm.mealAllowance,
        loan_repayment:       empForm.loanRepayment,
      });
    } catch {
      toast.error("Failed to save changes");
      return;
    }

    // 2. Employee saved — close edit mode immediately
    setIsEditing(false);
    setEmpForm({});
    setPickedManager(null);
    setPendingDocs([]);
    toast.success("Employee updated successfully");

    // 3. Upload documents independently — errors here don't revert edit mode
    if (toUpload.length > 0) {
      try {
        await Promise.all(
          toUpload.map(d => uploadDoc.mutateAsync({ file: d.file!, docType: d.docType }))
        );
      } catch {
        toast.error("Some documents failed to upload. Try adding them again.");
      }
    }
  };

  const viewDoc     = (url: string) => window.open(url, "_blank");
  const downloadDoc = (url: string, name: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.target = "_blank";
    a.click();
  };

  const fmt = (v: string | null | undefined) =>
    v && Number(v) > 0 ? formatNumber(Number(v)) : "—";

  const empName = emp ? `${emp.user?.first_name ?? ""} ${emp.user?.last_name ?? ""}`.trim() : "";

  if (isLoading) {
    return (
      <AppLayout pageTitle="Employee Profile">
        <div className="space-y-4 animate-pulse">
          <div className="h-6 w-48 bg-gray-100 rounded" />
          <div className="h-40 bg-white border border-brand-border rounded-2xl" />
          <div className="h-40 bg-white border border-brand-border rounded-2xl" />
        </div>
      </AppLayout>
    );
  }

  if (!emp) {
    return (
      <AppLayout pageTitle="Employee Profile">
        <Link href="/admin/employees" className="flex items-center gap-2 text-sm font-medium text-brand-text-secondary hover:text-brand-purple transition-colors mb-5">
          <ArrowLeft size={16} /> Back to Employees
        </Link>
        <div className="bg-brand-card border border-brand-border rounded-2xl p-8 text-center max-w-lg">
          <p className="text-brand-text-primary font-semibold">Employee not found</p>
          <p className="text-brand-text-secondary text-sm mt-1">No employee found for ID <span className="font-mono">{id}</span>.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="Employee Profile">
      <Link href="/admin/employees" className="flex items-center gap-2 text-sm font-medium text-brand-text-secondary hover:text-brand-purple transition-colors mb-5">
        <ArrowLeft size={16} /> Back to Employees
      </Link>

      <div className="space-y-5">
        {/* Header */}
        <div className="bg-brand-card border border-brand-border rounded-2xl shadow-sm">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-brand-text-secondary">{emp.employee_no}</p>
                <h1 className="text-lg font-semibold text-brand-text-primary mt-1">
                  {isEditing
                    ? `${empForm.firstName || emp.user?.first_name} ${empForm.lastName || emp.user?.last_name}`
                    : empName}
                </h1>
                <p className="text-sm text-brand-text-secondary mt-0.5">
                  {isEditing
                    ? `${empForm.title || emp.job_title} · ${empForm.department || emp.department}`
                    : `${emp.job_title ?? "—"} · ${emp.department ?? "—"}`}
                </p>
              </div>
              <div className="flex items-center gap-3 self-start">
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                  {emp.employment_type ?? "—"}
                </span>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={openEdit}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-medium border border-brand-border bg-white text-brand-text-primary hover:bg-gray-50 transition-colors"
                  >
                    <Pencil size={13} /> Edit
                  </button>
                )}
              </div>
            </div>
          </div>
          {!isEditing && (
            <div className="border-t border-brand-border px-6 py-5">
              <p className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-4">{`Leave Balance — ${YEAR}`}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                {LEAVE_TYPES.map((type) => (
                  <BalanceCard key={type} type={type} used={0} entitlement={21} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Personal Details */}
        <Section title="Personal Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isEditing ? (
              <>
                <FormInput label="First Name" required placeholder="First name" value={empForm.firstName ?? ""} onChange={(e) => ue("firstName", e.target.value)} />
                <FormInput label="Last Name"  required placeholder="Last name"  value={empForm.lastName  ?? ""} onChange={(e) => ue("lastName",  e.target.value)} />
                <FormInput label="Email" required type="email" placeholder="email@portlandgas.com" value={empForm.email ?? ""} onChange={(e) => ue("email", e.target.value)} />
                <FormDatePicker label="Birthday" value={empForm.birthday ?? ""} onValueChange={(v) => ue("birthday", v)} />
              </>
            ) : (
              <>
                <FormInput label="First Name" value={emp.user?.first_name ?? "—"} />
                <FormInput label="Last Name"  value={emp.user?.last_name  ?? "—"} />
                <FormInput label="Email"      value={emp.user?.email      ?? "—"} />
                <FormInput label="Birthday"   value={emp.birthday ? fmtDate(emp.birthday) : "—"} />
              </>
            )}
          </div>
        </Section>

        {/* Employment Details */}
        <Section title="Employment Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isEditing ? (
              <>
                <FormInput label="Job Title / Role" required placeholder="e.g. Software Developer" value={empForm.title ?? ""} onChange={(e) => ue("title", e.target.value)} />
                <FormSelect label="Department" required options={HR_DEPT_OPTIONS} placeholder="Select department" value={empForm.department ?? ""} onValueChange={(v) => ue("department", v)} />
                <FormSelect label="Employment Type" options={EMPLOYMENT_TYPE_OPTIONS} placeholder="Select type" value={empForm.category ?? ""} onValueChange={(v) => ue("category", v)} />
                <EmployeePicker
                  label="Operations Manager"
                  employees={managerPickerEmployees}
                  value={pickedManager}
                  onChange={setPickedManager}
                />
              </>
            ) : (
              <>
                <FormInput label="Job Title / Role"  value={emp.job_title      ?? "—"} />
                <FormInput label="Department"         value={emp.department     ?? "—"} />
                <FormInput label="Employment Type"    value={emp.employment_type ?? "—"} />
                <FormInput label="Hire Date"          value={emp.hire_date ? fmtDate(emp.hire_date) : "—"} />
                <FormInput label="Employee No"        value={emp.employee_no} />
                <FormInput label="Account Status"     value={emp.user?.account_status ?? "—"} />
                <FormInput
                  label="Operations Manager"
                  value={emp.operating_manager?.user
                    ? `${emp.operating_manager.user.first_name ?? ""} ${emp.operating_manager.user.last_name ?? ""}`.trim()
                    : "—"}
                  disabled
                />
              </>
            )}
          </div>
        </Section>

        {/* Compensation */}
        <Section title="Compensation">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isEditing ? (
              <>
                {[
                  { label: "Basic Salary",        key: "basicSalary"        },
                  { label: "Housing Allowance",    key: "housingAllowance"   },
                  { label: "Transport Allowance",  key: "transportAllowance" },
                  { label: "Meal Allowance",       key: "mealAllowance"      },
                ].map(({ label, key }) => (
                  <FormInput key={key} label={label} placeholder="0.00"
                    value={empForm[key as keyof EditForm] !== undefined ? String(empForm[key as keyof EditForm]) : ""}
                    onChange={(e) => un(key as keyof EditForm, e.target.value)}
                    onBlur={(e) => {
                      const raw = e.target.value.replace(/,/g, "");
                      e.target.value = raw ? formatNumber(parseFloat(raw) || 0) : "";
                    }}
                  />
                ))}
                <FormInput label="PAYE Tax" value={computed.paye > 0 ? formatNumber(computed.paye) : "0.00"} disabled hint="Auto-computed from earnings" />
                <FormInput label="Pension"  value={computed.pension > 0 ? formatNumber(computed.pension) : "0.00"} disabled hint="8% × (Basic + Housing + Transport)" />
                <FormInput label="NHF"      value={computed.nhf > 0 ? formatNumber(computed.nhf) : "0.00"} disabled hint="2.5% × Basic Salary" />
                <FormInput label="Loan Repayment" placeholder="0.00"
                  value={empForm.loanRepayment !== undefined ? String(empForm.loanRepayment) : ""}
                  onChange={(e) => un("loanRepayment", e.target.value)} />
              </>
            ) : (
              <>
                <FormInput label="Basic Salary"        value={fmt(emp.basic_salary)}        />
                <FormInput label="Housing Allowance"   value={fmt(emp.housing_allowance)}   />
                <FormInput label="Transport Allowance" value={fmt(emp.transport_allowance)} />
                <FormInput label="Meal Allowance"      value={fmt(emp.meal_allowance)}      />
                <FormInput label="PAYE Tax"            value={fmt(emp.paye)}    hint="Auto-computed from earnings" />
                <FormInput label="Pension"             value={fmt(emp.pension)} hint="8% × (Basic + Housing + Transport)" />
                <FormInput label="NHF"                 value={fmt(emp.nhf)}     hint="2.5% × Basic Salary" />
                <FormInput label="Loan Repayment"      value={fmt(emp.loan_repayment)} />
              </>
            )}
          </div>
        </Section>

        {/* Documents */}
        <div className="bg-brand-card border border-brand-border rounded-2xl shadow-sm">
          <div className="rounded-t-2xl border-b border-brand-border bg-gray-50 px-6 py-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-brand-text-primary">Documents</h2>
            {isEditing && (
              <button type="button" onClick={addDoc}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-medium bg-brand-purple text-white hover:bg-brand-purple-dark transition-colors">
                <PlusCircle size={13} /> Add Document
              </button>
            )}
          </div>
          <div className="px-6 pt-5 pb-6">
            {docs.length === 0 && pendingDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText size={32} className="text-brand-text-secondary mb-2 opacity-40" />
                <p className="text-sm text-brand-text-secondary">No documents uploaded yet.</p>
              </div>
            ) : (
              <>
                {docs.length > 0 && (
                  <div className="divide-y divide-brand-border">
                    {docs.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between py-3 gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText size={16} className="text-brand-text-secondary shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-brand-text-primary truncate">{doc.category ?? "Document"}</p>
                            <p className="text-xs font-mono text-brand-text-secondary truncate">{doc.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <span className="text-xs text-brand-text-secondary hidden sm:block">
                            {new Date(doc.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                          <div className="flex items-center gap-1">
                            {doc.file_path && (
                              <>
                                <button className="p-1.5 rounded-lg hover:bg-gray-100 text-brand-text-secondary transition" title="View" onClick={() => viewDoc(doc.file_path!)}><Eye size={14} /></button>
                                <button className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition" title="Download" onClick={() => downloadDoc(doc.file_path!, doc.name)}><Download size={14} /></button>
                              </>
                            )}
                            {isEditing && (
                              <button
                                onClick={() => deleteDoc.mutate(doc.id)}
                                disabled={deleteDoc.isPending}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition disabled:opacity-50"
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {isEditing && pendingDocs.length > 0 && (
                  <div className={`space-y-4 ${docs.length > 0 ? "mt-4 pt-4 border-t border-brand-border" : ""}`}>
                    {pendingDocs.map((doc) => (
                      <div key={doc.uid} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormSelect label="Document Type" required options={DOC_TYPE_OPTIONS} placeholder="Select type" value={doc.docType} onValueChange={(v) => setDocType(doc.uid, v)} />
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <FormFileUpload
                              label="Upload File"
                              hint="PDF, DOC, JPG — max 10 MB"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg"
                              onChange={(e) => setDocFile(doc.uid, e.target.files?.[0] ?? null)}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removePending(doc.uid)}
                            className="p-2 mt-6 rounded-lg hover:bg-red-50 text-red-500 transition shrink-0"
                            title="Remove"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="flex gap-3">
            <Button onClick={saveEmployee} loading={update.isPending}>Save Changes</Button>
            <Button variant="outline" onClick={cancelEdit}>Cancel</Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
