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
  EMPLOYEE_STORE,
  SEED_EMPLOYEE_RECORDS,
  LEAVE_TYPES,
  HR_DEPT_OPTIONS,
  CATEGORY_OPTIONS,
  GRADE_OPTIONS,
  calcLeaveBalance,
  fmtDate,
  type Employee,
  type EmployeeRecord,
} from "../../_components/_data";

const YEAR = new Date().getFullYear();

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

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [emp, setEmp] = useState<Employee | undefined>(() => EMPLOYEE_STORE.find((e) => e.id === id));
  const [isEditing, setIsEditing] = useState(false);
  const [empForm, setEmpForm] = useState<EmployeeFormState>({});

  const empName = emp ? `${emp.firstName} ${emp.lastName}` : "";
  const [docs, setDocs] = useState<EmployeeRecord[]>(() =>
    SEED_EMPLOYEE_RECORDS.filter((r) => r.employee === empName)
  );

  const DOC_TYPE_OPTIONS = [
    "Employment Contract", "ID / Passport Copy", "Certificates",
    "Safety Certification", "Disciplinary Record", "Other",
  ].map((t) => ({ value: t, label: t }));

  type PendingDoc = { uid: string; docType: string };
  const [pendingDocs, setPendingDocs] = useState<PendingDoc[]>([]);

  const addDoc = () => setPendingDocs(p => [...p, { uid: String(Date.now()), docType: "" }]);
  const removePending = (uid: string) => setPendingDocs(p => p.filter(d => d.uid !== uid));
  const setDocType = (uid: string, v: string) =>
    setPendingDocs(p => p.map(d => d.uid === uid ? { ...d, docType: v } : d));

  const ue = (k: keyof Employee, v: string) => setEmpForm((p) => ({ ...p, [k]: v }));
  const un = (k: keyof Employee, v: string) => setEmpForm((p) => ({ ...p, [k]: v === "" ? undefined : Number(v) }));

  const openEdit  = () => { setEmpForm(emp ? { ...emp } : {}); setIsEditing(true); };
  const cancelEdit = () => { setIsEditing(false); setEmpForm({}); setPendingDocs([]); };

  const computed = calcDeductions(
    empForm.basicSalary,
    empForm.housingAllowance,
    empForm.transportAllowance,
    empForm.mealAllowance,
  );

  const managerOptions = EMPLOYEE_STORE
    .filter((e) => e.id !== id)
    .map((e) => ({ value: e.email, label: `${e.firstName} ${e.lastName}` }));

  const saveEmployee = () => {
    const updated = { ...empForm, paye: computed.paye, pension: computed.pension, nhf: computed.nhf } as Employee;
    const idx = EMPLOYEE_STORE.findIndex((e) => e.id === id);
    if (idx !== -1) Object.assign(EMPLOYEE_STORE[idx], updated);
    setEmp((prev) => prev ? { ...prev, ...updated } : prev);

    const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    const newDocs: EmployeeRecord[] = [];
    pendingDocs.forEach((d) => {
      if (!d.docType) return;
      const doc: EmployeeRecord = {
        id: String(Date.now()),
        employee: empName,
        docType: d.docType,
        fileName: `${empName.replace(/\s+/g, "_")}_${d.docType.replace(/\s+/g, "_")}.pdf`,
        uploadDate: today,
        uploadedBy: "HR Admin",
      };
      SEED_EMPLOYEE_RECORDS.unshift(doc);
      newDocs.push(doc);
    });
    if (newDocs.length) setDocs(p => [...newDocs, ...p]);

    setIsEditing(false);
    setEmpForm({});
    setPendingDocs([]);
  };

  const removeDoc = (docId: string) => {
    const idx = SEED_EMPLOYEE_RECORDS.findIndex((r) => r.id === docId);
    if (idx !== -1) SEED_EMPLOYEE_RECORDS.splice(idx, 1);
    setDocs((p) => p.filter((r) => r.id !== docId));
  };

  const mockViewDoc = async (doc: EmployeeRecord) => {
    const { default: jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    pdf.setFillColor(88, 28, 135);
    pdf.rect(0, 0, 210, 18, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.setTextColor(255, 255, 255);
    pdf.text("PORTLAND GAS OPERATIONS", 20, 11);
    pdf.setTextColor(30, 30, 30);
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.text(doc.docType, 20, 34);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Employee: ${doc.employee}`, 20, 44);
    pdf.text(`File: ${doc.fileName}`, 20, 51);
    pdf.text(`Uploaded: ${doc.uploadDate}  ·  By: ${doc.uploadedBy}`, 20, 58);
    window.open(pdf.output("bloburl"), "_blank");
  };

  const mockDownloadDoc = async (doc: EmployeeRecord) => {
    const { default: jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    pdf.setFillColor(88, 28, 135);
    pdf.rect(0, 0, 210, 18, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.setTextColor(255, 255, 255);
    pdf.text("PORTLAND GAS OPERATIONS", 20, 11);
    pdf.setTextColor(30, 30, 30);
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.text(doc.docType, 20, 34);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Employee: ${doc.employee}`, 20, 44);
    pdf.text(`File: ${doc.fileName}`, 20, 51);
    pdf.text(`Uploaded: ${doc.uploadDate}  ·  By: ${doc.uploadedBy}`, 20, 58);
    pdf.save(doc.fileName);
  };

  const fmt = (n: number | undefined) => n !== undefined && n > 0 ? formatNumber(n) : "—";

  return (
    <AppLayout pageTitle="Employee Profile">
      <Link
        href="/admin/employees"
        className="flex items-center gap-2 text-sm font-medium text-brand-text-secondary hover:text-brand-purple transition-colors mb-5"
      >
        <ArrowLeft size={16} />
        Back to Employees
      </Link>

      {!emp ? (
        <div className="bg-brand-card border border-brand-border rounded-2xl p-8 text-center max-w-lg">
          <p className="text-brand-text-primary font-semibold">Employee not found</p>
          <p className="text-brand-text-secondary text-sm mt-1">
            No employee found for ID <span className="font-mono">{id}</span>.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Header */}
          <div className="bg-brand-card border border-brand-border rounded-2xl shadow-sm">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-brand-text-secondary">PG-{emp.id.padStart(3, "0")}</p>
                  <h1 className="text-lg font-semibold text-brand-text-primary mt-1">
                    {isEditing
                      ? `${empForm.firstName || emp.firstName} ${empForm.lastName || emp.lastName}`
                      : `${emp.firstName} ${emp.lastName}`}
                  </h1>
                  <p className="text-sm text-brand-text-secondary mt-0.5">
                    {isEditing
                      ? `${empForm.title || emp.title} · ${empForm.department || emp.department}`
                      : `${emp.title} · ${emp.department}`}
                  </p>
                </div>
                <div className="flex items-center gap-3 self-start">
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                    {isEditing ? (empForm.category || emp.category) : emp.category}
                  </span>
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={openEdit}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-medium border border-brand-border bg-white text-brand-text-primary hover:bg-gray-50 transition-colors"
                    >
                      <Pencil size={13} />
                      Edit
                    </button>
                  )}
                </div>
              </div>
            </div>
            {!isEditing && (
              <div className="border-t border-brand-border px-6 py-5">
                <p className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-4">{`Leave Balance — ${YEAR}`}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                  {LEAVE_TYPES.map((type) => {
                    const bal = calcLeaveBalance(`${emp.firstName} ${emp.lastName}`, type, YEAR);
                    return <BalanceCard key={type} type={type} used={bal.used} entitlement={bal.entitlement} />;
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Personal Details */}
          <Section title="Personal Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {isEditing ? (
                <>
                  <FormInput label="First Name" required placeholder="First name"
                    value={empForm.firstName ?? ""} onChange={(e) => ue("firstName", e.target.value)} />
                  <FormInput label="Last Name" required placeholder="Last name"
                    value={empForm.lastName ?? ""} onChange={(e) => ue("lastName", e.target.value)} />
                  <FormInput label="Email" required type="email" placeholder="email@portlandgas.com"
                    value={empForm.email ?? ""} onChange={(e) => ue("email", e.target.value)} />
                  <FormDatePicker label="Birthday"
                    value={empForm.birthday ?? ""} onValueChange={(v) => ue("birthday", v)} />
                </>
              ) : (
                <>
                  <FormInput label="First Name" value={emp.firstName} />
                  <FormInput label="Last Name"  value={emp.lastName}  />
                  <FormInput label="Email"      value={emp.email}     />
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
                  <FormInput label="Job Title / Role" required placeholder="e.g. Software Developer"
                    value={empForm.title ?? ""} onChange={(e) => ue("title", e.target.value)} />
                  <FormSelect label="Department" required options={HR_DEPT_OPTIONS} placeholder="Select department"
                    value={empForm.department ?? ""} onValueChange={(v) => ue("department", v)} />
                  <FormSelect label="Category" required options={CATEGORY_OPTIONS} placeholder="Select category"
                    value={empForm.category ?? ""} onValueChange={(v) => ue("category", v)} />
                  <FormSelect label="Grade Level" required options={GRADE_OPTIONS} placeholder="Select grade level"
                    sortOptions={false}
                    value={empForm.grade ?? ""} onValueChange={(v) => ue("grade", v)} />
                  <FormSelect label="Operations Manager" options={managerOptions} placeholder="Select operations manager"
                    value={empForm.lineManagerEmail ?? ""}
                    onValueChange={(email) => {
                      const mgr = EMPLOYEE_STORE.find((e) => e.email === email);
                      setEmpForm((p) => ({
                        ...p,
                        lineManager: mgr ? `${mgr.firstName} ${mgr.lastName}` : "",
                        lineManagerEmail: email,
                      }));
                    }}
                  />
                  <FormInput label="Operations Manager Email" type="email"
                    value={empForm.lineManagerEmail ?? ""} disabled />
                </>
              ) : (
                <>
                  <FormInput label="Job Title / Role"  value={emp.title}      />
                  <FormInput label="Department"         value={emp.department} />
                  <FormInput label="Category"           value={emp.category}  />
                  <FormInput label="Grade Level"        value={`Grade ${emp.grade}`} />
                  <FormInput label="Operations Manager"       value={emp.lineManager ?? "—"}      />
                  <FormInput label="Operations Manager Email" value={emp.lineManagerEmail ?? "—"} />
                </>
              )}
            </div>
          </Section>

          {/* Compensation */}
          <Section title="Compensation">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {isEditing ? (
                <>
                  <FormInput label="Basic Salary" min={0} placeholder="0.00"
                    value={empForm.basicSalary !== undefined ? String(empForm.basicSalary) : ""}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/,/g, "");
                      un("basicSalary", rawValue);
                    }}
                    onBlur={(e) => {
                      const rawValue = e.target.value.replace(/,/g, "");
                      e.target.value = formatNumber(parseFloat(rawValue) || 0);
                    }} />
                  <FormInput label="Housing Allowance" min={0} placeholder="0.00"
                    value={empForm.housingAllowance !== undefined ? String(empForm.housingAllowance) : ""}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/,/g, "");
                      un("housingAllowance", rawValue);
                    }}
                    onBlur={(e) => {
                      const rawValue = e.target.value.replace(/,/g, "");
                      e.target.value = formatNumber(parseFloat(rawValue) || 0);
                    }} />
                  <FormInput label="Transport Allowance" min={0} placeholder="0.00"
                    value={empForm.transportAllowance !== undefined ? String(empForm.transportAllowance) : ""}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/,/g, "");
                      un("transportAllowance", rawValue);
                    }}
                    onBlur={(e) => {
                      const rawValue = e.target.value.replace(/,/g, "");
                      e.target.value = formatNumber(parseFloat(rawValue) || 0);
                    }} />
                  <FormInput label="Meal Allowance" min={0} placeholder="0.00"
                    value={empForm.mealAllowance !== undefined ? String(empForm.mealAllowance) : ""}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/,/g, "");
                      un("mealAllowance", rawValue);
                    }}
                    onBlur={(e) => {
                      const rawValue = e.target.value.replace(/,/g, "");
                      e.target.value = formatNumber(parseFloat(rawValue) || 0);
                    }} />
                  <FormInput label="PAYE Tax"
                    value={computed.paye > 0 ? formatNumber(computed.paye) : "0.00"} disabled
                    hint="[Annual gross − Pension − NHF − CRA] × 7/11/15/19/21/24% bands ÷ 12 · CRA = max(₦200k, 1% gross) + 20% gross" />
                  <FormInput label="Pension"
                    value={computed.pension > 0 ? formatNumber(computed.pension) : "0.00"} disabled
                    hint="8% × (Basic + Housing + Transport)" />
                  <FormInput label="NHF"
                    value={computed.nhf > 0 ? formatNumber(computed.nhf) : "0.00"} disabled
                    hint="2.5% × Basic Salary" />
                  <FormInput label="Loan Repayment" type="number" min={0} placeholder="0"
                    value={empForm.loanRepayment !== undefined ? String(empForm.loanRepayment) : ""}
                    onChange={(e) => un("loanRepayment", e.target.value)} />
                </>
              ) : (
                <>
                  <FormInput label="Basic Salary"        value={fmt(emp.basicSalary)}        />
                  <FormInput label="Housing Allowance"   value={fmt(emp.housingAllowance)}   />
                  <FormInput label="Transport Allowance" value={fmt(emp.transportAllowance)} />
                  <FormInput label="Meal Allowance"      value={fmt(emp.mealAllowance)}      />
                  <FormInput label="PAYE Tax"  value={fmt(emp.paye)}    hint="[Annual gross − Pension − NHF − CRA] × 7/11/15/19/21/24% bands ÷ 12 · CRA = max(₦200k, 1% gross) + 20% gross" />
                  <FormInput label="Pension"   value={fmt(emp.pension)} hint="8% × (Basic + Housing + Transport)" />
                  <FormInput label="NHF"       value={fmt(emp.nhf)}     hint="2.5% × Basic Salary" />
                  <FormInput label="Loan Repayment" value={fmt(emp.loanRepayment)} />
                </>
              )}
            </div>
          </Section>

          {/* Documents */}
          <div className="bg-brand-card border border-brand-border rounded-2xl shadow-sm">
            <div className="rounded-t-2xl border-b border-brand-border bg-gray-50 px-6 py-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-brand-text-primary">Documents</h2>
              {isEditing && (
                <button
                  type="button"
                  onClick={addDoc}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-medium bg-brand-purple text-white hover:bg-brand-purple-dark transition-colors"
                >
                  <PlusCircle size={13} />
                  Add Document
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
                              <p className="text-sm font-medium text-brand-text-primary truncate">{doc.docType}</p>
                              <p className="text-xs font-mono text-brand-text-secondary truncate">{doc.fileName}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                            <span className="text-xs text-brand-text-secondary hidden sm:block">{doc.uploadDate}</span>
                            <span className="text-xs text-brand-text-secondary hidden md:block">{doc.uploadedBy}</span>
                            <div className="flex items-center gap-1">
                              <button
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-brand-text-secondary transition"
                                title="View"
                                onClick={() => mockViewDoc(doc)}
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition"
                                title="Download"
                                onClick={() => mockDownloadDoc(doc)}
                              >
                                <Download size={14} />
                              </button>
                              {isEditing && (
                                <button onClick={() => removeDoc(doc.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition" title="Delete">
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
                              onClick={() => removePending(doc.uid)}
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
                </>
              )}
            </div>
          </div>

          {/* Save/Cancel Buttons */}
          {isEditing && (
            <div className="flex gap-3">
              <Button onClick={saveEmployee}>Save Changes</Button>
              <Button variant="outline" onClick={cancelEdit}>Cancel</Button>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}
