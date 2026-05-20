"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormDatePicker from "@/components/forms/FormDatePicker";
import FormTextarea from "@/components/forms/FormTextarea";
import FormFileUpload from "@/components/forms/FormFileUpload";
import DataTable from "@/components/data-table/data-table";
import ApprovalStepper from "../_components/ApprovalStepper";
import WorkflowPath from "../_components/WorkflowPath";
import ActivityHistory from "../_components/ActivityHistory";
import { leaveRequestColumns } from "../_components/columns";
import {
  SEED_LEAVE_REQUESTS,
  HR_DEPT_OPTIONS,
  LEAVE_TYPE_OPTIONS,
  genHRRef,
  type LeaveRequest,
} from "../_components/_data";

type View = "list" | "form" | "submitted";

interface SubmittedInfo {
  ref: string;
  employee: string;
  department: string;
  submittedAt: Date;
}

type FormState = {
  employee?: string;
  department?: string;
  leaveType?: string;
  days?: string;
  startDate?: string;
  endDate?: string;
  reliefOfficer?: string;
  reason?: string;
};

const APPROVAL_ROUTE = ["Initiator (You)", "Line Manager", "HR Review", "Processed"];

export default function LeaveRequestsPage() {
  const [list, setList] = useState<LeaveRequest[]>(SEED_LEAVE_REQUESTS);
  const [view, setView] = useState<View>("list");
  const [form, setForm] = useState<FormState>({});
  const [submitted, setSubmitted] = useState<SubmittedInfo | null>(null);

  const u = (k: keyof FormState, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const submit = () => {
    const ref = genHRRef("LRQ");
    const dept = form.department || "Legal";
    const now = new Date();
    setList((p) => [
      {
        id: ref,
        ref,
        employee: form.employee || "Current User",
        type: form.leaveType || "Annual Leave",
        department: dept,
        startDate: form.startDate || "",
        endDate: form.endDate || "",
        days: parseInt(form.days || "1"),
        reliefOfficer: form.reliefOfficer || "—",
        status: "pending",
        date: now.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      },
      ...p,
    ]);
    setSubmitted({ ref, employee: form.employee || "Current User", department: dept, submittedAt: now });
    setView("submitted");
  };

  const goBack = () => { setView("list"); setForm({}); setSubmitted(null); };

  // ── Submitted view ────────────────────────────────────────────────────────
  if (view === "submitted" && submitted) {
    return (
      <AppLayout pageTitle="Leave Request Submitted">
        <button onClick={goBack} className="flex items-center gap-2 text-sm font-medium text-brand-text-secondary hover:text-brand-purple transition-colors mb-5">
          <ArrowLeft size={16} /> Back to Leave Requests
        </button>
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6 flex items-start gap-4">
          <CheckCircle2 size={22} className="text-green-600 shrink-0 mt-0.5" />
          <div>
            <h2 className="font-semibold text-green-800">Request Submitted Successfully</h2>
            <p className="text-sm text-green-700 mt-0.5">
              Reference: <span className="font-mono font-bold">{submitted.ref}</span> — Routed to Line Manager for review.
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <ApprovalStepper currentStep={1} />
          <WorkflowPath initiator={submitted.employee} department={submitted.department} currentStep={1} approver2Label="HR Review" />
          <ActivityHistory initiator={submitted.employee} department={submitted.department} submittedAt={submitted.submittedAt} approver2Label="HR Review" />
        </div>
        <div className="flex flex-wrap gap-3 mt-6">
          <Button onClick={goBack}>View All Requests</Button>
          <Button variant="outline" onClick={() => { setForm({}); setView("form"); }}>Submit Another</Button>
        </div>
      </AppLayout>
    );
  }

  // ── Form view ─────────────────────────────────────────────────────────────
  if (view === "form") {
    return (
      <AppLayout pageTitle="New Leave Request">
        <button onClick={goBack} className="flex items-center gap-2 text-sm font-medium text-brand-text-secondary hover:text-brand-purple transition-colors mb-5">
          <ArrowLeft size={16} /> Back to Leave Requests
        </button>
        <PageHeader title="New Leave Request" description="Submit a leave request for approval" className="mb-6" />

        <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden max-w-4xl">
          <div className="h-1.5 w-full bg-linear-to-r from-brand-purple to-brand-purple-light" />
          <div className="p-6 lg:p-8 space-y-8">

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-brand-text-secondary mb-4">Employee Details</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <FormInput
                  label="Employee Name"
                  required
                  placeholder="Your full name"
                  value={form.employee ?? ""}
                  onChange={(e) => u("employee", e.target.value)}
                />
                <FormSelect
                  label="Department"
                  required
                  options={HR_DEPT_OPTIONS}
                  placeholder="Select department"
                  value={form.department ?? ""}
                  onValueChange={(v) => u("department", v)}
                />
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-brand-text-secondary mb-4">Leave Details</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <FormSelect
                  label="Leave Type"
                  required
                  options={LEAVE_TYPE_OPTIONS}
                  placeholder="Select leave type"
                  value={form.leaveType ?? ""}
                  onValueChange={(v) => u("leaveType", v)}
                />
                <FormInput
                  label="Number of Days"
                  required
                  type="number"
                  placeholder="0"
                  value={form.days ?? ""}
                  onChange={(e) => u("days", e.target.value)}
                />
                <FormDatePicker
                  label="Start Date"
                  required
                  value={form.startDate ?? ""}
                  onValueChange={(v) => u("startDate", v)}
                />
                <FormDatePicker
                  label="End Date"
                  required
                  value={form.endDate ?? ""}
                  onValueChange={(v) => u("endDate", v)}
                />
                <FormInput
                  label="Relief Officer"
                  required
                  placeholder="Who covers for you"
                  value={form.reliefOfficer ?? ""}
                  onChange={(e) => u("reliefOfficer", e.target.value)}
                />
                <FormFileUpload label="Supporting Document" hint="Medical certificate, approval letter (optional)" />
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-brand-text-secondary mb-4">Justification</p>
              <FormTextarea
                label="Reason / Notes"
                placeholder="Brief reason for this leave request…"
                rows={4}
                value={form.reason ?? ""}
                onChange={(e) => u("reason", e.target.value)}
              />
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
    <AppLayout pageTitle="Leave Requests">
      <Link href="/hr-management" className="flex items-center gap-2 text-sm font-medium text-brand-text-secondary hover:text-brand-purple transition-colors mb-5">
        <ArrowLeft size={16} /> Back to HR Management
      </Link>
      <PageHeader title="Leave Requests" description="Manage leave requests and approvals" className="mb-6" />
      <DataTable
        columns={leaveRequestColumns}
        data={list}
        rowHref={(row) => `/hr-management/leave-requests/${row.id}`}
        onNewRequest={() => { setView("form"); setForm({}); }}
        newRequestLabel="New Request"
        emptyMessage="No leave requests yet"
        emptyDescription="Submit your first leave request to get started"
      />
    </AppLayout>
  );
}
