"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Plus, CalendarDays } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import FileDropzone from "@/components/ui/FileDropzone";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormDatePicker from "@/components/forms/FormDatePicker";
import FormTextarea from "@/components/forms/FormTextarea";
import DataTable from "@/components/data-table/data-table";
import { leaveRequestColumns } from "../_components/columns";
import { useCreateLeaveRequest, useLeaveRequests } from "@/lib/modules/leave-requests/hooks";
import { useLeaveTypes } from "@/lib/modules/leave-types/hooks";
import { useEmployees } from "@/lib/modules/employees/hooks";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAuthStore } from "@/store/authStore";
import leaveRequestsApi from "@/lib/modules/leave-requests/api";
import {
  LEAVE_TYPE_OPTIONS,
  LEAVE_TYPES,
  genHRRef,
  SEED_EMPLOYEES,
  calcLeaveBalance,
} from "../_components/_data";

const YEAR = new Date().getFullYear();

const TODAY = new Date().toISOString().split("T")[0];

const REQUEST_TYPE_OPTIONS = [
  { value: "self",   label: "Self"   },
  { value: "others", label: "Others" },
];

const schema = z.object({
  request_type:  z.string().min(1, "Select request type"),
  employee_id:   z.string().optional(), // Optional because it's only shown when "Others" is selected
  leave_type:    z.string().min(1, "Select a leave type"),
  start_date:    z.string().min(1, "Start date is required"),
  end_date:      z.string().min(1, "End date is required"),
  reliever_id:   z.string().min(1, "Select a reliever"),
  reason:        z.string().optional(),
});

type FormData = z.infer<typeof schema>;
type View = "list" | "form";

function calcDays(start: string, end: string): number {
  if (!start || !end) return 0;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (e < s) return 0;
  return Math.round((e - s) / (1000 * 60 * 60 * 24));
}

export default function LeaveRequestsPage() {
  const router = useRouter();
  const { user: currentUser } = useCurrentUser();
  const [view, setView] = useState<View>("list");
  const [supportingFiles, setSupportingFiles] = useState<File[]>([]);

  const createLeaveRequest = useCreateLeaveRequest();
  const { data: leaveRequestsResponse, isLoading: isLoadingRequests } = useLeaveRequests({
    limit: 100,
    sort_by: "created_at",
    sort_order: "desc"
  });
  const items = leaveRequestsResponse?.data || [];

  const { data: employees = [] } = useEmployees({ limit: 200 });
  const { data: leaveTypesResponse, isLoading: isLoadingLeaveTypes, error: leaveTypesError } = useLeaveTypes({ limit: 100, is_active: true });
  const leaveTypes = leaveTypesResponse?.data || [];

  console.log("Leave Types Debug:", { leaveTypes, isLoadingLeaveTypes, leaveTypesError, leaveTypesResponse, rawResponse: JSON.stringify(leaveTypesResponse) });

  // Get current user's employee record
  const currentUserEmployee = employees.find((e) => e.user?.id === currentUser?.id);

  // Convert real leave types to form options (use ID as value)
  const realLeaveTypeOptions = leaveTypes.map((lt) => ({
    value: String(lt.id),
    label: lt.leave_type_name,
  }));

  // Convert real employees to form options
  const realEmployeeOptions = employees.map((e) => ({
    value: e.id,
    label: `${e.user?.first_name || ""} ${e.user?.last_name || ""} — ${e.job_title || ""}`,
  }));

  // Reliever options (all employees except self)
  const relieverOptions = employees
    .filter((e) => e.id !== currentUserEmployee?.id) // Exclude current user
    .map((e) => ({
      value: e.id,
      label: `${e.user?.first_name || ""} ${e.user?.last_name || ""} — ${e.job_title || ""}`,
    }));

  const form = useForm<FormData>({ resolver: zodResolver(schema) });
  const { formState: { errors, isSubmitting } } = form;

  const watchRequestType = form.watch("request_type");
  const watchStart       = form.watch("start_date");
  const watchEnd         = form.watch("end_date");
  const watchLeaveType   = form.watch("leave_type");

  const isOthers = watchRequestType === "others";

  // For balance calc, look up the leave type by ID and use its entitlement
  const selectedLeaveType = watchLeaveType
    ? leaveTypes.find((lt) => String(lt.id) === watchLeaveType)
    : null;

  const leaveTypeName = selectedLeaveType?.leave_type_name;

  // Use real entitlement from leave type setup
  const activeBal = selectedLeaveType ? {
    entitlement: selectedLeaveType.entitlement_days,
    used: 0,  // TODO: Calculate from approved leave requests
    remaining: selectedLeaveType.entitlement_days
  } : null;

  const days = calcDays(watchStart, watchEnd);
  const exceedsBalance = days > 0 && activeBal !== null && days > activeBal.remaining;

  async function onSubmit(data: FormData) {
    try {
      const employeeId = isOthers ? data.employee_id : currentUserEmployee?.id;
      const reliever_id = data.reliever_id;

      if (!employeeId || !reliever_id) {
        toast.error("Employee and reliever are required");
        return;
      }

      // Call the real API to create leave request
      // Convert dates to ISO format (YYYY-MM-DD)
      const startDateObj = new Date(data.start_date);
      const endDateObj = new Date(data.end_date);
      const startDateISO = startDateObj.toISOString().split('T')[0];
      const endDateISO = endDateObj.toISOString().split('T')[0];

      const leaveTypeId = parseInt(data.leave_type, 10);
      console.log("Leave type ID parsed:", { raw: data.leave_type, parsed: leaveTypeId });

      // Create leave request first
      const leaveRequest = await createLeaveRequest.mutateAsync({
        employee_id: employeeId,
        leave_type_id: leaveTypeId,
        reliever_id: reliever_id,
        start_date: startDateISO,
        end_date: endDateISO,
        request_type: data.request_type,
        reason: data.reason,
      });

      // Upload supporting files if any
      if (supportingFiles.length > 0 && leaveRequest?.id) {
        console.log("Uploading files:", supportingFiles.length, supportingFiles);
        for (const file of supportingFiles) {
          try {
            console.log("Uploading file:", {
              name: file.name,
              size: file.size,
              type: file.type,
              leaveRequestId: leaveRequest.id,
            });
            const result = await leaveRequestsApi.uploadDocument(leaveRequest.id, file);
            console.log("File uploaded successfully:", result);
          } catch (uploadError: unknown) {
            console.error("File upload failed:", uploadError);
            let errorMessage = "Unknown error";
            if (uploadError instanceof Error) {
              errorMessage = uploadError.message;
            } else if (typeof uploadError === "object" && uploadError !== null) {
              const err = uploadError as Record<string, unknown>;
              if (err.response && typeof err.response === "object") {
                const resp = err.response as Record<string, unknown>;
                errorMessage = resp.data ? String(resp.data) : String(resp);
              }
            }
            toast.warning(`Could not upload ${file.name}: ${errorMessage}. Your leave request was saved.`);
          }
        }
      }

      // Submit leave request for approval via workflow engine
      if (leaveRequest?.id) {
        try {
          console.log("Submitting leave request for approval:", leaveRequest.id);
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/hr/leave-requests/${leaveRequest.id}/submit-for-approval`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${useAuthStore.getState().accessToken}`,
              },
              credentials: "include",
            }
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Submission failed with status ${response.status}`);
          }

          const submissionResult = await response.json();
          console.log("Leave request submitted for approval:", submissionResult);
          toast.success("Leave request submitted for approval!");
        } catch (submissionError: unknown) {
          console.error("Workflow submission error:", submissionError);
          let errorMessage = "Unknown error";
          if (submissionError instanceof Error) {
            errorMessage = submissionError.message;
          }
          toast.error(`Could not submit for approval: ${errorMessage}`);
          return;
        }
      }

      form.reset();
      setSupportingFiles([]);
      setView("list");
    } catch (error: unknown) {
      let message = "Failed to submit leave request";
      console.error("Submission error:", error);
      if (error instanceof Error) {
        message = error.message;
        // Log the full error for debugging
        if ('response' in error) {
          const axiosError = error as { response?: { data?: unknown } };
          console.error("API response:", axiosError.response?.data);
        }
      }
      toast.error(message);
    }
  }

  function goBack() {
    setView("list");
    form.reset();
    setSupportingFiles([]);
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
          {leaveTypes.length > 0 && (
          <div className="mb-5 bg-brand-card border border-brand-border rounded-2xl px-4 py-3 overflow-hidden">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-text-secondary mb-3">
              My Leave Balance — {YEAR}
            </p>
            <div className="flex gap-3">
              {leaveTypes.map((lt) => (
                <section key={lt.id} className="rounded-xl border border-brand-border bg-white p-3 flex-shrink-0 min-w-[130px]">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-brand-text-secondary leading-tight">{lt.leave_type_name}</p>
                      <p className="mt-1 text-xl font-bold text-brand-text-primary">{lt.entitlement_days}</p>
                    </div>
                    <span className="rounded-lg p-1.5 ring-1 bg-purple-50 text-purple-700 ring-purple-100 shrink-0">
                      <CalendarDays size={16} />
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] leading-4 text-brand-text-secondary">
                    {lt.entitlement_days}/{lt.entitlement_days} days left
                  </p>
                </section>
              ))}
            </div>
          </div>
          )}

          <div className="w-full overflow-hidden">
            <DataTable
              columns={leaveRequestColumns}
              data={items}
              rowHref={(row) => `/hr-management/leave-requests/${row.ref}`}
              emptyMessage="No leave requests yet"
              emptyDescription="Submit your first leave request to get started"
            />
          </div>
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
                <FormInput
                  label="Requester Name"
                  value={currentUserEmployee ? `${currentUserEmployee.user?.first_name || ""} ${currentUserEmployee.user?.last_name || ""}`.trim() : ""}
                  disabled
                />
                <FormInput
                  label="Department"
                  value={currentUserEmployee?.department || ""}
                  disabled
                />
                <FormInput
                  label="Job Title / Role"
                  value={currentUserEmployee?.job_title || ""}
                  disabled
                />
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
                  options={realLeaveTypeOptions}
                  sortOptions={false}
                  placeholder="Select leave type"
                  error={errors.leave_type?.message}
                  {...form.register("leave_type")}
                />
                <FormSelect
                  label="Raise For"
                  required
                  options={REQUEST_TYPE_OPTIONS}
                  sortOptions={false}
                  placeholder="Select Raise For"
                  error={errors.request_type?.message}
                  {...form.register("request_type")}
                />

                {/* Balance banner — updates when leave type (and employee for others) is selected */}
                {activeBal && (
                  <div className="md:col-span-2 rounded-xl border border-brand-purple bg-white px-4 py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-brand-text-secondary uppercase tracking-wide">
                        Your {leaveTypeName} Balance
                      </p>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-sm font-bold text-brand-purple">
                          {activeBal.remaining}
                        </span>
                        <span className="text-sm text-brand-text-secondary">
                          of {activeBal.entitlement} days remaining · {activeBal.used} used
                        </span>
                      </div>
                    </div>
                    <div className="w-28 shrink-0">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
                        <div
                          className="h-full rounded-full bg-brand-purple"
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
                    options={realEmployeeOptions}
                    sortOptions={false}
                    placeholder="Select employee"
                    error={errors.employee_id?.message}
                    {...form.register("employee_id")}
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
                      Requested {days} day{days !== 1 ? "s" : ""} exceeds your available balance of {activeBal.remaining} day{activeBal.remaining !== 1 ? "s" : ""} for {leaveTypeName}.
                    </p>
                  )}
                </div>

                <FormSelect
                  label="Reliever"
                  required
                  options={relieverOptions}
                  sortOptions={false}
                  placeholder="Select reliever"
                  error={errors.reliever_id?.message}
                  {...form.register("reliever_id")}
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

            <div className="flex gap-3 pt-1">
              <Button type="submit" loading={isSubmitting} loadingText="Submitting..." disabled={exceedsBalance}>
                Submit for Approval
              </Button>
            </div>
          </form>
        </>
      )}

      {/* ── SUBMITTED ── */}
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
