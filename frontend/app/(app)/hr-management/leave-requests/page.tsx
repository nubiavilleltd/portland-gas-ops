"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import FileDropzone from "@/components/ui/FileDropzone";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormDatePicker from "@/components/forms/FormDatePicker";
import FormTextarea from "@/components/forms/FormTextarea";
import DataTable from "@/components/data-table/data-table";
import ApprovalStepper from "../_components/ApprovalStepper";
import WorkflowPath from "../_components/WorkflowPath";
import ActivityHistory from "../_components/ActivityHistory";
import { leaveRequestColumns } from "../_components/columns";
import {
  LEAVE_STORE,
  LEAVE_TYPE_OPTIONS,
  genHRRef,
  SEED_EMPLOYEES,
  type LeaveRequest,
} from "../_components/_data";

const TODAY = new Date().toISOString().split("T")[0];

const CURRENT_USER = {
  name: "Joseph Chika",
  department: "Operations",
  title: "Operations Manager",
};

const REQUEST_TYPE_OPTIONS = [
  { value: "self",   label: "Self"   },
  { value: "others", label: "Others" },
];

const schema = z.object({
  request_type:  z.string().min(1, "Select request type"),
  employee_name: z.string().optional(),
  leave_type:    z.string().min(1, "Select a leave type"),
  start_date:    z.string().min(1, "Start date is required"),
  end_date:      z.string().min(1, "End date is required"),
  reliever:      z.string().min(1, "Select a reliever"),
  reason:        z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.request_type === "others" && !data.employee_name?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Select an employee", path: ["employee_name"] });
  }
});

type FormData = z.infer<typeof schema>;
type View = "list" | "form" | "submitted";

interface SubmittedInfo {
  ref: string;
  employee: string;
  department: string;
  submittedAt: Date;
}

const APPROVAL_ROUTE = ["Initiator (You)", "Line Manager", "HR Review", "Processed"];

function calcDays(start: string, end: string): number {
  if (!start || !end) return 0;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (e < s) return 0;
  return Math.round((e - s) / (1000 * 60 * 60 * 24));
}

export default function LeaveRequestsPage() {
  const [view, setView] = useState<View>("list");
  const [items, setItems] = useState<LeaveRequest[]>(LEAVE_STORE);
  const [submitted, setSubmitted] = useState<SubmittedInfo | null>(null);
  const [supportingFiles, setSupportingFiles] = useState<File[]>([]);

  const form = useForm<FormData>({ resolver: zodResolver(schema) });
  const { formState: { errors, isSubmitting } } = form;

  const watchRequestType = form.watch("request_type");
  const watchEmployee    = form.watch("employee_name");
  const watchStart       = form.watch("start_date");
  const watchEnd         = form.watch("end_date");

  const isOthers = watchRequestType === "others";

  const selectedEmployee = isOthers
    ? SEED_EMPLOYEES.find((e) => `${e.firstName} ${e.lastName}` === watchEmployee)
    : undefined;

  const days = calcDays(watchStart, watchEnd);

  const employeeOptions = SEED_EMPLOYEES.map((e) => ({
    value: `${e.firstName} ${e.lastName}`,
    label: `${e.firstName} ${e.lastName} — ${e.title}`,
  }));

  const relieverOptions = SEED_EMPLOYEES
    .filter((e) => {
      const fullName = `${e.firstName} ${e.lastName}`;
      return isOthers ? fullName !== watchEmployee : fullName !== CURRENT_USER.name;
    })
    .map((e) => ({
      value: `${e.firstName} ${e.lastName}`,
      label: `${e.firstName} ${e.lastName} — ${e.title}`,
    }));

  function onSubmit(data: FormData) {
    const ref = genHRRef("LRQ");
    const employeeName = isOthers ? (data.employee_name ?? CURRENT_USER.name) : CURRENT_USER.name;
    const department   = isOthers ? (selectedEmployee?.department ?? "—") : CURRENT_USER.department;
    const jobTitle     = isOthers ? selectedEmployee?.title : CURRENT_USER.title;
    const now = new Date();

    const newItem: LeaveRequest = {
      id: ref,
      ref,
      requestType: data.request_type as "self" | "others",
      requester: CURRENT_USER.name,
      employee: employeeName,
      jobTitle,
      type: data.leave_type,
      department,
      startDate: data.start_date,
      endDate: data.end_date,
      days,
      reliever: data.reliever,
      reason: data.reason,
      supportingDocuments: supportingFiles.length > 0
        ? supportingFiles.map((f) => f.name)
        : undefined,
      status: "pending",
      date: now.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    };
    LEAVE_STORE.unshift(newItem);
    setItems([...LEAVE_STORE]);
    setSubmitted({ ref, employee: employeeName, department, submittedAt: now });
    setView("submitted");
  }

  function goBack() {
    setView("list");
    form.reset();
    setSupportingFiles([]);
    setSubmitted(null);
  }

  return (
    <AppLayout pageTitle={view === "form" ? "New Leave Request" : "Leave Requests"}>

      {/* ── LIST ── */}
      {view === "list" && (
        <>
          <PageHeader
            title="Leave Requests"
            description="Manage leave requests and approvals"
            className="mb-6"
          />
          <DataTable
            columns={leaveRequestColumns}
            data={items}
            rowHref={(row) => `/hr-management/leave-requests/${row.id}`}
            onNewRequest={() => setView("form")}
            newRequestLabel="New Request"
            emptyMessage="No leave requests yet"
            emptyDescription="Submit your first leave request to get started"
          />
        </>
      )}

      {/* ── FORM ── */}
      {view === "form" && (
        <>
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-sm font-medium text-brand-text-secondary hover:text-brand-purple transition-colors mb-5"
          >
            <ArrowLeft size={16} /> Back to Leave Requests
          </button>
          <PageHeader
            title="New Leave Request"
            description="Submit a leave request for approval"
            className="mb-6"
          />

          <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto w-full space-y-5">

            {/* ── Requester Details (fixed, like invoice) ── */}
            <FormSection title="Requester Details">
              <div className="grid gap-4 md:grid-cols-2">
                <FormInput label="Requester Name"  value={CURRENT_USER.name}       disabled />
                <FormInput label="Department"       value={CURRENT_USER.department} disabled />
                <FormInput label="Job Title / Role" value={CURRENT_USER.title}      disabled />
                <FormDatePicker label="Request Date" value={TODAY} disabled />
              </div>
            </FormSection>

            {/* ── Leave Details ── */}
            <FormSection title="Leave Details">
              <div className="grid gap-4 md:grid-cols-2">

                {/* Leave Type | Request Type — side by side */}
                <FormSelect
                  label="Leave Type"
                  required
                  options={LEAVE_TYPE_OPTIONS}
                  sortOptions={false}
                  placeholder="Select leave type"
                  error={errors.leave_type?.message}
                  {...form.register("leave_type")}
                />
                <FormSelect
                  label="Request Type"
                  required
                  options={REQUEST_TYPE_OPTIONS}
                  sortOptions={false}
                  placeholder="Select request type"
                  error={errors.request_type?.message}
                  {...form.register("request_type")}
                />

                {/* Employee fields — only when Others */}
                {isOthers && (
                  <FormSelect
                    label="Employee Name"
                    required
                    options={employeeOptions}
                    sortOptions={false}
                    placeholder="Select employee"
                    error={errors.employee_name?.message}
                    {...form.register("employee_name")}
                  />
                )}
                {isOthers && (
                  <FormInput
                    label="Employee Department"
                    value={selectedEmployee?.department ?? ""}
                    disabled
                    placeholder="Auto-filled on selection"
                  />
                )}
                {isOthers && (
                  <FormInput
                    label="Employee Job Title / Role"
                    value={selectedEmployee?.title ?? ""}
                    disabled
                    placeholder="Auto-filled on selection"
                  />
                )}

                {/* Dates */}
                <FormDatePicker
                  label="Start Date"
                  required
                  error={errors.start_date?.message}
                  {...form.register("start_date")}
                />
                <FormDatePicker
                  label="End Date"
                  required
                  error={errors.end_date?.message}
                  {...form.register("end_date")}
                />

                {/* Number of Days — after End Date */}
                <FormInput
                  label="Number of Days"
                  value={days > 0 ? String(days) : ""}
                  disabled
                  placeholder="Auto-calculated"
                />

                <FormSelect
                  label="Reliever"
                  required
                  options={relieverOptions}
                  sortOptions={false}
                  placeholder="Select reliever"
                  error={errors.reliever?.message}
                  {...form.register("reliever")}
                />
                <div className="md:col-span-2">
                  <FileDropzone
                    label="Supporting Document"
                    value={supportingFiles}
                    onChange={setSupportingFiles}
                    accept="image/*,.pdf,.doc,.docx"
                    maxFiles={5}
                    hint="Medical certificate, approval letter (optional)"
                  />
                </div>
                <div className="md:col-span-2">
                  <FormTextarea
                    label="Reason / Notes"
                    placeholder="Brief reason for this leave request…"
                    rows={4}
                    {...form.register("reason")}
                  />
                </div>
              </div>
            </FormSection>

            <section className="rounded-xl border border-brand-border bg-gray-50 px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-text-secondary mb-3">
                Approval Route
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {APPROVAL_ROUTE.map((step, i, arr) => (
                  <div key={step} className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
                      i === 0
                        ? "bg-brand-purple-faint text-brand-purple border-brand-purple-mid"
                        : "bg-white text-brand-text-secondary border-brand-border"
                    }`}>
                      {step}
                    </span>
                    {i < arr.length - 1 && (
                      <span className="text-brand-text-secondary text-xs">→</span>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <div className="flex gap-3 pt-1">
              <Button type="submit" loading={isSubmitting} loadingText="Submitting...">
                Submit for Approval
              </Button>
              <Button type="button" variant="ghost" className="ml-auto" onClick={goBack}>
                Cancel
              </Button>
            </div>
          </form>
        </>
      )}

      {/* ── SUBMITTED ── */}
      {view === "submitted" && submitted && (
        <>
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-sm font-medium text-brand-text-secondary hover:text-brand-purple transition-colors mb-5"
          >
            <ArrowLeft size={16} /> Back to Leave Requests
          </button>

          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6 flex items-start gap-4">
            <CheckCircle2 size={22} className="text-green-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-semibold text-green-800">Request Submitted Successfully</h2>
              <p className="text-sm text-green-700 mt-0.5">
                Reference:{" "}
                <span className="font-mono font-bold">{submitted.ref}</span> — Routed to Line Manager for review.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <ApprovalStepper currentStep={1} />
            <WorkflowPath
              initiator={submitted.employee}
              department={submitted.department}
              currentStep={1}
              approver2Label="HR Review"
            />
            <ActivityHistory
              initiator={submitted.employee}
              department={submitted.department}
              submittedAt={submitted.submittedAt}
              approver2Label="HR Review"
            />
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            <Button onClick={goBack}>View All Requests</Button>
            <Button
              variant="outline"
              onClick={() => { form.reset(); setSupportingFiles([]); setView("form"); }}
            >
              Submit Another
            </Button>
          </div>
        </>
      )}
    </AppLayout>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-brand-border bg-white p-5 md:p-6">
      <h2 className="mb-5 text-base font-semibold text-brand-text-primary">{title}</h2>
      {children}
    </section>
  );
}
