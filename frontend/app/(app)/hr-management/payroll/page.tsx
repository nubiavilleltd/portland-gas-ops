"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import SuccessAlert from "@/components/ui/SuccessAlert";
import Button from "@/components/ui/Button";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormDatePicker from "@/components/forms/FormDatePicker";
import FormTextarea from "@/components/forms/FormTextarea";
import FormFileUpload from "@/components/forms/FormFileUpload";
import DataTable from "@/components/data-table/data-table";
import AuditTrail from "@/components/forms/AuditTrail";
import { formatDate } from "@/lib/utils";
import { payrollColumns } from "../_components/columns";
import { SEED_PAYROLL, PAYROLL_PERIODS, genHRRef, type PayrollRun } from "../_components/_data";

const PAYROLL_STEPS = ["Submitted", "Line Manager", "Finance Review", "Processed"];

const PERIOD_OPTIONS = PAYROLL_PERIODS.map((p) => ({ value: p, label: p }));

type View = "list" | "form" | "submitted";

interface SubmittedInfo {
  ref: string;
  preparedBy: string;
  submittedAt: string;
}

type FormState = {
  period?: string;
  runDate?: string;
  employees?: string;
  preparedBy?: string;
  totalGross?: string;
  totalDeductions?: string;
  totalNet?: string;
  notes?: string;
};

const APPROVAL_ROUTE = ["Initiator (You)", "Line Manager", "Finance Review", "Processed"];

export default function PayrollPage() {
  const [list, setList] = useState<PayrollRun[]>(SEED_PAYROLL);
  const [view, setView] = useState<View>("list");
  const [form, setForm] = useState<FormState>({});
  const [submitted, setSubmitted] = useState<SubmittedInfo | null>(null);

  const u = (k: keyof FormState, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const submit = () => {
    const ref = genHRRef("PAY");
    const now = new Date();
    setList((p) => [
      {
        id: ref,
        ref,
        period: form.period || "June 2026",
        runDate: now.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
        totalGross: parseFloat(form.totalGross || "0"),
        totalDeductions: parseFloat(form.totalDeductions || "0"),
        totalNet: parseFloat(form.totalNet || "0"),
        employees: parseInt(form.employees || "7"),
        status: "pending" as const,
        preparedBy: form.preparedBy || "HR Admin",
      },
      ...p,
    ]);
    setSubmitted({ ref, preparedBy: form.preparedBy || "HR Admin", submittedAt: now.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) });
    setView("submitted");
  };

  const goBack = () => { setView("list"); setForm({}); setSubmitted(null); };

  // ── Submitted view ────────────────────────────────────────────────────────
  if (view === "submitted" && submitted) {
    return (
      <AppLayout pageTitle="Payroll Submitted">
        <button onClick={goBack} className="flex items-center gap-2 text-sm font-medium text-brand-text-secondary hover:text-brand-purple transition-colors mb-5">
          <ArrowLeft size={16} /> Back to Payroll
        </button>
        <SuccessAlert
          title="Payroll Run Submitted Successfully"
          message="Routed to Line Manager for review."
          reference={submitted.ref}
        />
        <div className="space-y-4">
          <AuditTrail
            items={[
              {
                action: "Submitted",
                actor: submitted.preparedBy,
                role: "HR Officer",
                dateTime: formatDate(submitted.submittedAt),
                comment: "Payroll run submitted",
              },
            ]}
          />
        </div>
        <div className="flex flex-wrap gap-3 mt-6">
          <Button onClick={goBack}>View All Payroll Runs</Button>
          <Button variant="outline" onClick={() => { setForm({}); setView("form"); }}>New Payroll Run</Button>
        </div>
      </AppLayout>
    );
  }

  // ── Form view ─────────────────────────────────────────────────────────────
  if (view === "form") {
    return (
      <AppLayout pageTitle="New Payroll Run">
        <button onClick={goBack} className="flex items-center gap-2 text-sm font-medium text-brand-text-secondary hover:text-brand-purple transition-colors mb-5">
          <ArrowLeft size={16} /> Back to Payroll
        </button>
        <PageHeader title="New Payroll Run" description="Prepare monthly payroll for approval and disbursement" className="mb-6" />

        <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden max-w-4xl">
          <div className="h-1.5 w-full bg-linear-to-r from-brand-purple to-brand-purple-light" />
          <div className="p-6 lg:p-8 space-y-8">

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-brand-text-secondary mb-4">Payroll Details</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <FormSelect
                  label="Pay Period"
                  required
                  options={PERIOD_OPTIONS}
                  placeholder="Select pay period"
                  value={form.period ?? ""}
                  onValueChange={(v) => u("period", v)}
                />
                <FormDatePicker
                  label="Run Date"
                  value={form.runDate ?? ""}
                  onValueChange={(v) => u("runDate", v)}
                />
                <FormInput
                  label="Number of Employees"
                  required
                  type="number"
                  placeholder="7"
                  value={form.employees ?? ""}
                  onChange={(e) => u("employees", e.target.value)}
                />
                <FormInput
                  label="Prepared By"
                  required
                  placeholder="HR Officer name"
                  value={form.preparedBy ?? ""}
                  onChange={(e) => u("preparedBy", e.target.value)}
                />
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-brand-text-secondary mb-4">Financial Summary</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
                <FormInput
                  label="Total Gross (₦)"
                  required
                  type="number"
                  placeholder="0.00"
                  value={form.totalGross ?? ""}
                  onChange={(e) => u("totalGross", e.target.value)}
                />
                <FormInput
                  label="Total Deductions (₦)"
                  required
                  type="number"
                  placeholder="0.00"
                  value={form.totalDeductions ?? ""}
                  onChange={(e) => u("totalDeductions", e.target.value)}
                />
                <FormInput
                  label="Total Net Pay (₦)"
                  required
                  type="number"
                  placeholder="0.00"
                  value={form.totalNet ?? ""}
                  onChange={(e) => u("totalNet", e.target.value)}
                />
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-brand-text-secondary mb-4">Adjustments & Notes</p>
              <FormTextarea
                label="Notes / Adjustments"
                placeholder="Overtime, bonuses, special deductions…"
                rows={4}
                value={form.notes ?? ""}
                onChange={(e) => u("notes", e.target.value)}
              />
              <div className="mt-5">
                <FormFileUpload label="Upload Payroll Sheet" hint="Excel or PDF payroll summary" />
              </div>
            </div>

            <div className="rounded-xl border border-brand-border bg-gray-50 px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-text-secondary mb-3">Approval Route</p>
              <div className="flex flex-wrap items-center gap-2">
                {APPROVAL_ROUTE.map((step, i, arr) => (
                  <div key={step} className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-3 py-1.5 rounded-full border ${i === 0 ? "bg-brand-purple-faint text-brand-purple border-brand-purple-mid" : "bg-white text-brand-text-secondary border-brand-border"}`}>
                      {step}
                    </span>
                    {i < arr.length - 1 && <span className="text-brand-text-secondary text-xs">→</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-brand-border">
              <Button onClick={submit}>Submit for Approval</Button>
              <Button variant="outline" onClick={() => setForm({})}>Clear Form</Button>
              <Button variant="ghost" className="sm:ml-auto" onClick={goBack}>Cancel</Button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────
  return (
    <AppLayout pageTitle="Payroll">
      <Link href="/hr-management" className="flex items-center gap-2 text-sm font-medium text-brand-text-secondary hover:text-brand-purple transition-colors mb-5">
        <ArrowLeft size={16} /> Back to HR Management
      </Link>
      <PageHeader title="Payroll" description="Manage monthly payroll runs and disbursements" className="mb-6" />
      <DataTable
        columns={payrollColumns}
        data={list}
        rowHref={(row) => `/hr-management/payroll/${row.id}`}
        onNewRequest={() => { setView("form"); setForm({}); }}
        newRequestLabel="New Payroll Run"
        emptyMessage="No payroll runs yet"
        emptyDescription="Create your first payroll run to get started"
      />
    </AppLayout>
  );
}
