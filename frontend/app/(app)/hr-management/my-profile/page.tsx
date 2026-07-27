"use client";

import { useRef } from "react";
import { Camera, FileText, Loader2 } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import AppLayout from "@/components/layout/AppLayout";
import FormInput from "@/components/forms/FormInput";
import FormDatePicker from "@/components/forms/FormDatePicker";
import { formatNumber } from "@/lib/utils/format-number";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useMyEmployee, useUploadProfilePicture } from "@/lib/modules/employees/hooks";
import { useToast } from "@/hooks/useToast";

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
  const upload = useUploadProfilePicture();
  const toast  = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            <FormDatePicker label="Birthday" value={emp.birthday ?? ""} disabled />
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
            <FormInput label="Loan Repayment" value={fmt(emp.loan_repayment)} disabled />
          </div>
        </Section>

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
