"use client";

import { useRef, useState } from "react";
import { Camera, FileText, Loader2, Wallet } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import AppLayout from "@/components/layout/AppLayout";
import FormInput from "@/components/forms/FormInput";
import FormDatePicker from "@/components/forms/FormDatePicker";
import { formatNumber } from "@/lib/utils/format-number";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useMyEmployee, useUploadProfilePicture, useUpdateMyProfile } from "@/lib/modules/employees/hooks";
import { useMyLoans } from "@/lib/modules/loans/hooks";
import type { LoanMode, LoanStatus } from "@/lib/modules/loans/types";
import { useToast } from "@/hooks/useToast";

const LOAN_MODE_LABEL: Record<LoanMode, string> = {
  one_off: "One-off", installment: "Installment", standing: "Standing",
};
const LOAN_STATUS_STYLE: Record<LoanStatus, string> = {
  active:    "bg-green-50 text-green-700 border-green-200",
  completed: "bg-gray-100 text-gray-600 border-gray-200",
  cancelled: "bg-red-50 text-red-600 border-red-200",
};
const fmtLoanMoney = (n: number | null | undefined) =>
  n !== null && n !== undefined ? `₦${formatNumber(n)}` : "—";

const TODAY = new Date().toISOString().split("T")[0];

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

function fmt(n: string | null | undefined) {
  if (!n) return "—";
  const num = parseFloat(n);
  return isNaN(num) || num === 0 ? "—" : formatNumber(num);
}

export default function MyProfilePage() {
  const { user } = useCurrentUser();
  const { data: emp, isLoading, error } = useMyEmployee();
  // Own loans (read-only) — Outstanding Amount + Loans & Deductions display.
  const { data: myLoans = [] } = useMyLoans();
  const totalOutstanding = myLoans
    .filter((l) => l.status === "active")
    .reduce((sum, l) => sum + (l.outstanding ?? 0), 0);
  const upload = useUploadProfilePicture();
  const updateProfile = useUpdateMyProfile();
  const toast  = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Date-of-birth — a user may correct their own DOB; the field is live on page load.
  // `null` means untouched, so the saved value shows through until the user picks a date.
  const [dobDraft, setDobDraft] = useState<string | null>(null);
  const dob = dobDraft ?? emp?.birthday ?? "";

  const saveDob = async () => {
    if (!dob) { toast.error("Please pick a date of birth"); return; }
    try {
      await updateProfile.mutateAsync({ birthday: dob });
      toast.success("Date of birth updated");
      setDobDraft(null);   // fall back to the refetched record
    } catch {
      toast.error("Failed to update date of birth");
    }
  };

  const fullName = emp
    ? `${emp.user?.first_name ?? ""} ${emp.user?.last_name ?? ""}`.trim()
    : user
    ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim()
    : "";

  const managerName = emp?.operating_manager?.user
    ? `${emp.operating_manager.user.first_name ?? ""} ${emp.operating_manager.user.last_name ?? ""}`.trim()
    : "—";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await upload.mutateAsync(file);
      toast.success("Profile picture updated");
    } catch {
      toast.error("Failed to upload picture. Max 5 MB, JPEG/PNG/WebP only.");
    }
    e.target.value = "";
  };

  if (isLoading) {
    return (
      <AppLayout pageTitle="My Profile">
        <div className="flex items-center justify-center py-24">
          <Loader2 size={24} className="animate-spin text-brand-purple" />
        </div>
      </AppLayout>
    );
  }

  if (error || !emp) {
    return (
      <AppLayout pageTitle="My Profile">
        <div className="bg-brand-card border border-brand-border rounded-2xl p-8 text-center max-w-lg">
          <p className="text-brand-text-primary font-semibold">Profile not found</p>
          <p className="text-brand-text-secondary text-sm mt-1">
            No employee record found for your account. Contact IT to get set up.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="My Profile">
      <div className="space-y-5">

        {/* Header card with avatar */}
        <div className="bg-brand-card border border-brand-border rounded-2xl shadow-sm">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Avatar + upload */}
                <div className="relative shrink-0">
                  <Avatar
                    name={fullName || "?"}
                    src={emp?.user?.profile_picture_url}
                    size="lg"
                    className="ring-2 ring-brand-border"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={upload.isPending}
                    className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-brand-purple text-white flex items-center justify-center shadow hover:bg-brand-purple-dark transition-colors disabled:opacity-60"
                    title="Change profile picture"
                  >
                    {upload.isPending ? <Loader2 size={10} className="animate-spin" /> : <Camera size={10} />}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>

                <div>
                  <p className="font-mono text-xs text-brand-text-secondary">{emp.employee_no}</p>
                  <h1 className="text-lg font-semibold text-brand-text-primary mt-0.5">{fullName}</h1>
                  <p className="text-sm text-brand-text-secondary">
                    {emp.job_title ?? "—"}{emp.department ? ` · ${emp.department}` : ""}
                  </p>
                </div>
              </div>
              {emp.employment_type && (
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 self-start">
                  {emp.employment_type}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Personal Details */}
        <Section title="Personal Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput label="First Name" value={emp.user?.first_name ?? "—"} disabled />
            <FormInput label="Last Name"  value={emp.user?.last_name  ?? "—"} disabled />
            <FormInput label="Email"      value={emp.user?.email      ?? "—"} disabled />
            <FormDatePicker
              label="Birthday"
              value={dob}
              onValueChange={setDobDraft}
              disabled={updateProfile.isPending}
              max={TODAY}
            />
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Button
              variant="primary"
              onClick={saveDob}
              loading={updateProfile.isPending}
              loadingText="Saving…"
            >
              Save date of birth
            </Button>
          </div>
        </Section>

        {/* Employment Details */}
        <Section title="Employment Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput label="Job Title"          value={emp.job_title       ?? "—"} disabled />
            <FormInput label="Department"         value={emp.department      ?? "—"} disabled />
            <FormInput label="Employment Type"    value={emp.employment_type ?? "—"} disabled />
            <FormInput label="Operations Manager" value={managerName}                disabled />
          </div>
        </Section>

        {/* Compensation */}
        <Section title="Compensation">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput label="Basic Salary"        value={fmt(emp.basic_salary)}        disabled />
            <FormInput label="Housing Allowance"   value={fmt(emp.housing_allowance)}   disabled />
            <FormInput label="Transport Allowance" value={fmt(emp.transport_allowance)} disabled />
            <FormInput label="Meal Allowance"      value={fmt(emp.meal_allowance)}      disabled />
            <FormInput label="PAYE Tax"    value={fmt(emp.paye)}    disabled hint="Auto-computed (PITA bands)" />
            <FormInput label="Pension"     value={fmt(emp.pension)} disabled hint="8% × (Basic + Housing + Transport)" />
            <FormInput label="NHF"         value={fmt(emp.nhf)}     disabled hint="2.5% × Basic Salary" />
            <FormInput label="Outstanding Amount"
              value={totalOutstanding > 0 ? formatNumber(totalOutstanding) : "—"}
              disabled hint="Total outstanding across active loans." />
          </div>
        </Section>

        {/* Loans & Deductions (read-only) */}
        <div className="bg-brand-card border border-brand-border rounded-2xl shadow-sm">
          <div className="rounded-t-2xl border-b border-brand-border bg-gray-50 px-6 py-4 flex items-center gap-2">
            <Wallet size={16} className="text-brand-text-secondary" />
            <h2 className="text-base font-semibold text-brand-text-primary">Loans &amp; Deductions</h2>
          </div>
          <div className="px-6 pt-2 pb-4">
            {myLoans.length === 0 ? (
              <p className="py-6 text-sm text-brand-text-secondary text-center">No loans on record.</p>
            ) : (
              <div className="divide-y divide-brand-border">
                {myLoans.map((loan) => (
                  <div key={loan.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-brand-text-primary truncate">
                          {loan.description || LOAN_MODE_LABEL[loan.mode]}
                        </span>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-brand-purple-faint text-brand-purple border border-brand-purple-mid">
                          {LOAN_MODE_LABEL[loan.mode]}
                        </span>
                      </div>
                      <p className="text-xs text-brand-text-secondary mt-0.5">
                        {fmtLoanMoney(loan.monthly_amount)}/mo
                        {loan.total_amount != null && <> · total {fmtLoanMoney(loan.total_amount)}</>}
                        {loan.total_amount != null && <> · outstanding <span className="font-medium text-brand-text-primary">{fmtLoanMoney(loan.outstanding)}</span></>}
                      </p>
                    </div>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border capitalize shrink-0 ${LOAN_STATUS_STYLE[loan.status]}`}>
                      {loan.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Documents placeholder */}
        <div className="bg-brand-card border border-brand-border rounded-2xl shadow-sm">
          <div className="rounded-t-2xl border-b border-brand-border bg-gray-50 px-6 py-4">
            <h2 className="text-base font-semibold text-brand-text-primary">Documents</h2>
          </div>
          <div className="px-6 py-10 flex flex-col items-center text-center">
            <FileText size={32} className="text-brand-text-secondary mb-2 opacity-40" />
            <p className="text-sm text-brand-text-secondary">No documents uploaded yet.</p>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
