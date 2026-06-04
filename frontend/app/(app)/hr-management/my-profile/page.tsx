"use client";

import { Eye, Download, FileText } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import FormInput from "@/components/forms/FormInput";
import FormDatePicker from "@/components/forms/FormDatePicker";
import { formatNumber } from "@/lib/utils/format-number";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  EMPLOYEE_STORE,
  SEED_EMPLOYEE_RECORDS,
  fmtDate,
  type EmployeeRecord,
} from "../_components/_data";

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

export default function MyProfilePage() {
  const { user } = useCurrentUser();
  const currentUserName = user?.name || "Joseph Chika";

  const emp = EMPLOYEE_STORE.find(
    (e) => `${e.firstName} ${e.lastName}` === currentUserName
  );

  const docs: EmployeeRecord[] = emp
    ? SEED_EMPLOYEE_RECORDS.filter((r) => r.employee === currentUserName)
    : [];

  const fmt = (n: number | undefined) =>
    n !== undefined && n > 0 ? formatNumber(n) : "—";

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

  if (!emp) {
    return (
      <AppLayout pageTitle="My Profile">
        <div className="bg-brand-card border border-brand-border rounded-2xl p-8 text-center max-w-lg">
          <p className="text-brand-text-primary font-semibold">Profile not found</p>
          <p className="text-brand-text-secondary text-sm mt-1">
            No employee record found for <span className="font-medium">{currentUserName}</span>.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="My Profile">
      <div className="space-y-5">

        {/* Header */}
        <div className="bg-brand-card border border-brand-border rounded-2xl shadow-sm">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-brand-text-secondary">PG-{emp.id.padStart(3, "0")}</p>
                <h1 className="text-lg font-semibold text-brand-text-primary mt-1">
                  {emp.firstName} {emp.lastName}
                </h1>
                <p className="text-sm text-brand-text-secondary mt-0.5">
                  {emp.title} · {emp.department}
                </p>
              </div>
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 self-start">
                {emp.category}
              </span>
            </div>
          </div>
        </div>

        {/* Personal Details */}
        <Section title="Personal Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput label="First Name" value={emp.firstName} disabled />
            <FormInput label="Last Name"  value={emp.lastName}  disabled />
            <FormInput label="Email"      value={emp.email}     disabled />
            <FormDatePicker label="Birthday" value={emp.birthday ?? ""} disabled />
          </div>
        </Section>

        {/* Employment Details */}
        <Section title="Employment Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput label="Job Title / Role"         value={emp.title}                   disabled />
            <FormInput label="Department"               value={emp.department}               disabled />
            <FormInput label="Category"                 value={emp.category}                 disabled />
            <FormInput label="Grade Level"              value={`Grade ${emp.grade}`}         disabled />
            <FormInput label="Operations Manager"       value={emp.lineManager ?? "—"}       disabled />
            <FormInput label="Operations Manager Email" value={emp.lineManagerEmail ?? "—"}  disabled />
          </div>
        </Section>

        {/* Compensation */}
        <Section title="Compensation">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput label="Basic Salary"        value={fmt(emp.basicSalary)}        disabled />
            <FormInput label="Housing Allowance"   value={fmt(emp.housingAllowance)}   disabled />
            <FormInput label="Transport Allowance" value={fmt(emp.transportAllowance)} disabled />
            <FormInput label="Meal Allowance"      value={fmt(emp.mealAllowance)}      disabled />
            <FormInput label="PAYE Tax"    value={fmt(emp.paye)}    disabled hint="[Annual gross − Pension − NHF − CRA] × 7/11/15/19/21/24% bands ÷ 12 · CRA = max(₦200k, 1% gross) + 20% gross" />
            <FormInput label="Pension"     value={fmt(emp.pension)} disabled hint="8% × (Basic + Housing + Transport)" />
            <FormInput label="NHF"         value={fmt(emp.nhf)}     disabled hint="2.5% × Basic Salary" />
            <FormInput label="Loan Repayment" value={fmt(emp.loanRepayment)} disabled />
          </div>
        </Section>

        {/* Documents */}
        <div className="bg-brand-card border border-brand-border rounded-2xl shadow-sm">
          <div className="rounded-t-2xl border-b border-brand-border bg-gray-50 px-6 py-4">
            <h2 className="text-base font-semibold text-brand-text-primary">Documents</h2>
          </div>
          <div className="px-6 pt-5 pb-6">
            {docs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText size={32} className="text-brand-text-secondary mb-2 opacity-40" />
                <p className="text-sm text-brand-text-secondary">No documents uploaded yet.</p>
              </div>
            ) : (
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
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
