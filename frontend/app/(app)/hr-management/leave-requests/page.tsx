"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, CheckCircle2, Plus } from "lucide-react";
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
  LEAVE_TYPES,
  genHRRef,
  SEED_EMPLOYEES,
  calcLeaveBalance,
  type LeaveRequest,
} from "../_components/_data";

const YEAR = new Date().getFullYear();

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
  reliever: string;
  submittedAt: Date;
}

const APPROVAL_ROUTE = ["Initiator (You)", "Reliever", "Line Manager", "HR Review", "Processed"];

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
  const watchLeaveType   = form.watch("leave_type");

  const isOthers = watchRequestType === "others";

  const balanceName = isOthers ? (watchEmployee ?? "") : CURRENT_USER.name;
  const activeBal = watchLeaveType && balanceName
    ? calcLeaveBalance(balanceName, watchLeaveType, YEAR)
    : null;

  const selectedEmployee = isOthers
    ? SEED_EMPLOYEES.find((e) => `${e.firstName} ${e.lastName}` === watchEmployee)
    : undefined;

  const days = calcDays(watchStart, watchEnd);
  const exceedsBalance = days > 0 && activeBal !== null && days > activeBal.remaining;

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
    setSubmitted({ ref, employee: employeeName, department, reliever: data.reliever, submittedAt: now });
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
            action={
              <Button leftIcon={<Plus size={16} />} onClick={() => setView("form")}>
                New Request
              </Button>
            }
            className="mb-6"
          />

          {/* My Leave Balance strip */}
          <div className="mb-5 bg-brand-card border border-brand-border rounded-2xl p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-text-secondary mb-3">
              My Leave Balance — {YEAR}
            </p>
            <div className="flex flex-wrap gap-2">
              {LEAVE_TYPES.map((type) => {
                const bal = calcLeaveBalance(CURRENT_USER.name, type, YEAR);
                const pct = bal.entitlement > 0 ? (bal.remaining / bal.entitlement) * 100 : 100;
                const color =
                  pct <= 20
                    ? "bg-red-50 border-red-200 text-red-700"
                    : pct <= 50
                    ? "bg-amber-50 border-amber-200 text-amber-700"
                    : "bg-green-50 border-green-200 text-green-700";
                return (
                  <div
                    key={type}
                    className={`flex flex-col px-3 py-2 rounded-xl border text-xs font-medium ${color}`}
                  >
                    <span className="font-semibold">{type}</span>
                    <span className="mt-0.5 text-[11px] opacity-80">
                      {bal.remaining}/{bal.entitlement} days left
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <DataTable
            columns={leaveRequestColumns}
            data={items}
            rowHref={(row) => `/hr-management/leave-requests/${row.id}`}
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
            <FormSection title="Requester Details" description="Your employee information for this leave request.">
              <div className="grid gap-4 md:grid-cols-2">
                <FormInput label="Requester Name"  value={CURRENT_USER.name}       disabled />
                <FormInput label="Department"       value={CURRENT_USER.department} disabled />
                <FormInput label="Job Title / Role" value={CURRENT_USER.title}      disabled />
                <FormDatePicker label="Request Date" value={TODAY} disabled />
              </div>
            </FormSection>

            {/* ── Leave Details ── */}
            <FormSection title="Leave Details" description="Details about the leave being requested.">
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

                {/* Balance banner — updates when leave type (and employee for others) is selected */}
                {activeBal && (
                  <div className={`md:col-span-2 rounded-xl border px-4 py-3 flex items-center justify-between gap-4 ${
                    (() => {
                      const pct = activeBal.entitlement > 0 ? (activeBal.remaining / activeBal.entitlement) * 100 : 100;
                      return pct <= 20
                        ? "bg-red-50 border-red-200"
                        : pct <= 50
                        ? "bg-amber-50 border-amber-200"
                        : "bg-green-50 border-green-200";
                    })()
                  }`}>
                    <div>
                      <p className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">
                        {isOthers && watchEmployee ? `${watchEmployee}'s` : "Your"} {watchLeaveType} Balance
                      </p>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className={`text-2xl font-bold ${
                          (() => {
                            const pct = activeBal.entitlement > 0 ? (activeBal.remaining / activeBal.entitlement) * 100 : 100;
                            return pct <= 20 ? "text-red-700" : pct <= 50 ? "text-amber-700" : "text-green-700";
                          })()
                        }`}>
                          {activeBal.remaining}
                        </span>
                        <span className="text-sm text-brand-text-secondary">
                          of {activeBal.entitlement} days remaining · {activeBal.used} used
                        </span>
                      </div>
                    </div>
                    <div className="w-28 shrink-0">
                      <div className="h-2 bg-white/60 rounded-full overflow-hidden border border-white">
                        <div
                          className={`h-full rounded-full ${
                            (() => {
                              const pct = activeBal.entitlement > 0 ? (activeBal.remaining / activeBal.entitlement) * 100 : 100;
                              return pct <= 20 ? "bg-red-500" : pct <= 50 ? "bg-amber-500" : "bg-green-500";
                            })()
                          }`}
                          style={{
                            width: `${activeBal.entitlement > 0 ? Math.min(100, (activeBal.remaining / activeBal.entitlement) * 100) : 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

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
                <div className="flex flex-col gap-1.5">
                  <FormInput
                    label="Number of Days"
                    value={days > 0 ? String(days) : ""}
                    disabled
                    placeholder="Auto-calculated"
                  />
                  {exceedsBalance && activeBal && (
                    <p className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      Requested {days} day{days !== 1 ? "s" : ""} exceeds your available balance of {activeBal.remaining} day{activeBal.remaining !== 1 ? "s" : ""} for {watchLeaveType}.
                    </p>
                  )}
                </div>

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
              <Button type="submit" loading={isSubmitting} loadingText="Submitting..." disabled={exceedsBalance}>
                Submit for Approval
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
                <span className="font-mono font-bold">{submitted.ref}</span> — Routed to Reliever for review.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <ApprovalStepper currentStep={1} />
            <WorkflowPath
              initiator={submitted.employee}
              department={submitted.department}
              reliever={submitted.reliever}
              currentStep={1}
            />
            <ActivityHistory
              initiator={submitted.employee}
              department={submitted.department}
              reliever={submitted.reliever}
              submittedAt={submitted.submittedAt}
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

function FormSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-brand-border bg-white shadow-sm">
      <div className="rounded-t-2xl border-b border-brand-border bg-gray-50 px-6 py-4">
        <h2 className="text-base font-semibold text-brand-text-primary">{title}</h2>
        {description && (
          <p className="text-sm text-brand-text-secondary mt-0.5">{description}</p>
        )}
      </div>
      <div className="px-6 pt-5 pb-6">
        {children}
      </div>
    </section>
  );
}
